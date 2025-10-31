// src/components/GoalCard.jsx - VERSIÓN COMPLETAMENTE CORREGIDA
import React, { useMemo, useState } from 'react';
import {
    Card, CardBody, CardHeader, CardFooter,
    HStack, VStack, Text, Button, Box, useColorModeValue,
    Icon, Progress, Tooltip, useDisclosure, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalFooter, ModalBody, ModalCloseButton,
    FormControl, FormLabel, Input, NumberInput, NumberInputField,
    Stat, StatLabel, StatNumber, StatHelpText,
    Badge, Flex, Spacer, IconButton, Alert, AlertIcon
} from '@chakra-ui/react';
import {
    FiTarget,
    FiEdit3,
    FiAward,
    FiCalendar,
    FiTrendingUp,
    FiInfo,
    FiX,
    FiCheckCircle
} from 'react-icons/fi';
import api from '../../lib/api.js';

// ✅ CORREGIDO: Función segura para formatear moneda
const formatCurrency = (amount) => {
    try {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    } catch (error) {
        // Fallback seguro si Intl falla
        return `S/ ${amount?.toLocaleString('es-PE') || '0'}`;
    }
};

// ✅ Función auxiliar para color del progreso
const getProgressColor = (progress) => {
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'yellow';
    if (progress >= 25) return 'orange';
    return 'red';
};

export default function GoalCard({ profile, balance = 0, onUpdated }) {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [loading, setLoading] = useState(false);
    const [goalName, setGoalName] = useState('');
    const [goalAmount, setGoalAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');

    // Colores dinámicos
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
    const successColor = useColorModeValue('green.500', 'green.300');
    const warningColor = useColorModeValue('orange.500', 'orange.300');

    // ✅ MEJORAR ESPACIADO EN MÓVIL
    const cardPadding = { base: 4, md: 6 };
    const progressSpacing = { base: 3, md: 4 };

    // ✅ INICIALIZAR ESTADOS CUANDO EL PERFIL CAMBIA
    React.useEffect(() => {
        if (profile) {
            setGoalName(profile?.goal_name || '');
            setGoalAmount(profile?.goal_amount?.toString() || '');
            setTargetDate(profile?.target_date || '');
        }
    }, [profile]);

    // Cálculos optimizados
    const goalData = useMemo(() => {
        // ✅ VALIDAR PROFILE NULL/UNDEFINED
        if (!profile) {
            return {
                goalName: 'Meta de Ahorro',
                goalAmount: 0,
                targetDate: null,
                progress: 0,
                remaining: 0,
                savedAmount: 0,
                isCompleted: false,
                isGoalSet: false,
                estimatedTime: null,
                progressPercentage: 0
            };
        }

        const goalAmountValue = Number(profile?.goal_amount) || 0;
        const goalNameValue = profile?.goal_name || 'Meta de Ahorro';
        const targetDateValue = profile?.target_date;

        // Progreso
        let progress = 0;
        if (goalAmountValue > 0) {
            progress = (balance / goalAmountValue) * 100;
            progress = Math.max(0, Math.min(100, progress));
        }

        // Cálculos adicionales
        const remaining = Math.max(0, goalAmountValue - balance);
        const savedAmount = Math.min(balance, goalAmountValue);
        const isCompleted = progress >= 100;
        const isGoalSet = goalAmountValue > 0;

        // Estimación de tiempo restante
        let estimatedTime = null;
        if (targetDateValue) {
            try {
                const target = new Date(targetDateValue);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalizar hora
                const daysRemaining = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
                estimatedTime = daysRemaining > 0 ? daysRemaining : 0;
            } catch (error) {
                console.error('Error calculando fecha:', error);
                estimatedTime = null;
            }
        }

        return {
            goalName: goalNameValue,
            goalAmount: goalAmountValue,
            targetDate: targetDateValue,
            progress,
            remaining,
            savedAmount,
            isCompleted,
            isGoalSet,
            estimatedTime,
            progressPercentage: Math.round(progress)
        };
    }, [profile, balance]);

    // ✅ SOLUCIÓN CORREGIDA: UN SOLO BOTÓN CON ESTADOS DIFERENTES
    const getButtonConfig = () => {
        if (!goalData.isGoalSet) {
            return {
                icon: FiTarget,
                label: "Configurar Meta",
                tooltip: "Establecer una meta de ahorro",
                variant: "ghost",
                color: "green"
            };
        }

        return {
            icon: FiEdit3,
            label: "Editar Meta",
            tooltip: "Modificar meta de ahorro",
            variant: "ghost",
            color: subtleTextColor
        };
    };

    const buttonConfig = getButtonConfig();

    // Configurar meta
    const handleConfigure = () => {
        setGoalName(goalData.goalName);
        setGoalAmount(goalData.goalAmount.toString());
        setTargetDate(goalData.targetDate || '');
        onOpen();
    };

    // Guardar meta
    const handleSaveGoal = async () => {
        if (!goalName.trim()) {
            toast({
                title: 'Nombre requerido',
                description: 'Por favor ingresa un nombre para tu meta.',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        const amount = parseFloat(goalAmount);
        if (!goalAmount || isNaN(amount) || amount <= 0) {
            toast({
                title: 'Monto inválido',
                description: 'El monto debe ser mayor a 0.',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        setLoading(true);
        try {
            const goalDataToSend = {
                goal_name: goalName.trim(),
                goal_amount: amount
            };

            // ✅ AGREGAR FECHA OBJETIVO SI ESTÁ CONFIGURADA Y ES VÁLIDA
            if (targetDate) {
                try {
                    const date = new Date(targetDate);
                    if (!isNaN(date.getTime())) {
                        goalDataToSend.target_date = targetDate;
                    }
                } catch (error) {
                    console.warn('Fecha inválida, ignorando:', error);
                }
            }

            await api.updateProfile(goalDataToSend);

            toast({
                title: goalData.isGoalSet ? 'Meta actualizada' : '¡Meta configurada!',
                description: goalData.isGoalSet
                    ? 'Tu meta de ahorro ha sido actualizada.'
                    : 'Comienza a ahorrar para alcanzar tu objetivo.',
                status: 'success',
                duration: 3000,
            });

            onClose();
            if (onUpdated) onUpdated();
        } catch (error) {
            console.error('Error updating goal:', error);
            toast({
                title: 'Error',
                description: 'No se pudo guardar la meta. Intenta nuevamente.',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Eliminar meta
    const handleRemoveGoal = async () => {
        setLoading(true);
        try {
            await api.updateProfile({
                goal_name: '',
                goal_amount: 0,
                target_date: null
            });

            toast({
                title: 'Meta eliminada',
                description: 'Tu meta de ahorro ha sido removida.',
                status: 'info',
                duration: 3000,
            });

            onClose();
            if (onUpdated) onUpdated();
        } catch (error) {
            console.error('Error removing goal:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la meta.',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Fecha mínima para el date picker (hoy)
    const getMinDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    return (
        <>
            <Card
                bg={cardBg}
                border="1px"
                borderColor={borderColor}
                shadow="sm"
                position="relative"
                overflow="hidden"
            >
                {/* ✅ MEJORAR ESPACIADO DEL BADGE */}
                {goalData.isCompleted && (
                    <Box
                        position="absolute"
                        top={3}
                        right={3}
                        zIndex={1}
                        px={3}
                        py={1}
                    >
                        <Badge
                            colorScheme="green"
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="bold"
                        >
                            <HStack spacing={1}>
                                <FiCheckCircle size={12} />
                                <Text>¡Completado!</Text>
                            </HStack>
                        </Badge>
                    </Box>
                )}

                <CardHeader pb={3} px={cardPadding}>
                    <Flex align="center" justify="space-between">
                        <HStack spacing={3}>
                            <Box
                                p={2}
                                borderRadius="lg"
                                bg={useColorModeValue('green.50', 'green.900')}
                                color={successColor}
                            >
                                <Icon as={FiTarget} boxSize={5} />
                            </Box>
                            <VStack spacing={0} align="start">
                                <Text fontWeight="bold" fontSize="lg">
                                    {goalData.goalName}
                                </Text>
                                <Text fontSize="sm" color={subtleTextColor}>
                                    Meta de ahorro
                                </Text>
                            </VStack>
                        </HStack>

                        {/* ✅ SOLUCIÓN CORREGIDA: IconButton con icono correcto */}
                        <Tooltip label={buttonConfig.tooltip}>
                            <IconButton
                                icon={<Icon as={buttonConfig.icon} />}
                                size="sm"
                                variant={buttonConfig.variant}
                                onClick={handleConfigure}
                                aria-label={buttonConfig.label}
                                color={buttonConfig.color}
                                _hover={{
                                    bg: useColorModeValue('gray.100', 'gray.700'),
                                    transform: 'scale(1.05)'
                                }}
                                transition="all 0.2s"
                            />
                        </Tooltip>
                    </Flex>
                </CardHeader>

                <CardBody pt={0} pb={4} px={cardPadding}>
                    {goalData.isGoalSet ? (
                        <VStack spacing={progressSpacing} align="stretch">
                            {/* ✅ MEJORAR ESPACIADO EN BARRAS */}
                            <Box>
                                <Flex justify="space-between" mb={2}>
                                    <Text fontSize="sm" fontWeight="medium">
                                        Progreso
                                    </Text>
                                    <Text fontSize="sm" fontWeight="bold" color={successColor}>
                                        {goalData.progressPercentage}%
                                    </Text>
                                </Flex>

                                <Tooltip
                                    // ✅ CORREGIDO: Usar formatCurrency en lugar de PEN.format
                                    label={`${formatCurrency(goalData.savedAmount)} ahorrados de ${formatCurrency(goalData.goalAmount)}`}
                                >
                                    <Progress
                                        value={goalData.progress}
                                        colorScheme={getProgressColor(goalData.progress)}
                                        size="lg"
                                        borderRadius="full"
                                        height="12px"
                                        bg={useColorModeValue('gray.100', 'gray.700')}
                                    />
                                </Tooltip>
                            </Box>

                            {/* Estadísticas - MEJORAR RESPONSIVE */}
                            <Box
                                display="grid"
                                gridTemplateColumns={{
                                    base: '1fr',
                                    sm: 'repeat(2, 1fr)'
                                }}
                                gap={4}
                            >
                                <Stat>
                                    <StatLabel fontSize="xs" color={subtleTextColor}>
                                        Ahorrado
                                    </StatLabel>
                                    <StatNumber
                                        fontSize={{ base: 'md', md: 'lg' }}
                                        color={successColor}
                                    >
                                        {/* ✅ CORREGIDO: Usar formatCurrency */}
                                        {formatCurrency(goalData.savedAmount)}
                                    </StatNumber>
                                    <StatHelpText fontSize="xs">
                                        {/* ✅ CORREGIDO: Usar formatCurrency */}
                                        de {formatCurrency(goalData.goalAmount)}
                                    </StatHelpText>
                                </Stat>

                                <Stat>
                                    <StatLabel fontSize="xs" color={subtleTextColor}>
                                        Restante
                                    </StatLabel>
                                    <StatNumber
                                        fontSize={{ base: 'md', md: 'lg' }}
                                        color={goalData.remaining > 0 ? warningColor : successColor}
                                    >
                                        {/* ✅ CORREGIDO: Usar formatCurrency */}
                                        {formatCurrency(goalData.remaining)}
                                    </StatNumber>
                                    <StatHelpText fontSize="xs">
                                        por alcanzar
                                    </StatHelpText>
                                </Stat>
                            </Box>

                            {/* ✅ MEJORAR ESPACIADO INFORMACIÓN ADICIONAL */}
                            <HStack
                                spacing={4}
                                justify="space-between"
                                fontSize="sm"
                                pt={2}
                            >
                                {goalData.estimatedTime !== null && goalData.estimatedTime > 0 && (
                                    <HStack spacing={1} color={subtleTextColor}>
                                        <Icon as={FiCalendar} boxSize={4} />
                                        <Text fontSize="xs">
                                            {goalData.estimatedTime} día{goalData.estimatedTime !== 1 ? 's' : ''} restante{goalData.estimatedTime !== 1 ? 's' : ''}
                                        </Text>
                                    </HStack>
                                )}

                                {goalData.isCompleted && (
                                    <HStack spacing={1} color="green.500">
                                        <Icon as={FiAward} boxSize={4} />
                                        <Text fontSize="xs" fontWeight="medium">¡Meta alcanzada!</Text>
                                    </HStack>
                                )}
                            </HStack>
                        </VStack>
                    ) : (
                        // Estado sin meta configurada - MEJORAR ESPACIADO
                        <VStack spacing={4} py={4} textAlign="center">
                            <Box
                                p={{ base: 4, md: 6 }}
                                borderRadius="lg"
                                bg={useColorModeValue('gray.50', 'gray.700')}
                                width="full"
                            >
                                <VStack spacing={4}>
                                    <Box
                                        p={3}
                                        borderRadius="full"
                                        bg={useColorModeValue('green.100', 'green.900')}
                                        color={successColor}
                                    >
                                        <Icon as={FiTrendingUp} boxSize={6} />
                                    </Box>
                                    <VStack spacing={1}>
                                        <Text fontWeight="medium" color={subtleTextColor}>
                                            Establece una meta de ahorro
                                        </Text>
                                        <Text fontSize="sm" color={subtleTextColor} textAlign="center">
                                            Mantén tu motivación y alcanza tus objetivos financieros
                                        </Text>
                                    </VStack>
                                    <Button
                                        colorScheme="green"
                                        size="sm"
                                        leftIcon={<Icon as={FiTarget} />}
                                        onClick={handleConfigure}
                                        width="full"
                                        maxW="200px"
                                    >
                                        Configurar Meta
                                    </Button>
                                </VStack>
                            </Box>
                        </VStack>
                    )}
                </CardBody>

                {goalData.isGoalSet && (
                    <CardFooter pt={0} px={cardPadding}>
                        <Alert
                            status={goalData.isCompleted ? "success" : "info"}
                            borderRadius="md"
                            fontSize="sm"
                            width="full"
                        >
                            <AlertIcon />
                            <Box flex="1">
                                <Text fontWeight="medium">
                                    {goalData.isCompleted
                                        ? "¡Felicidades! Has alcanzado tu meta."
                                        // ✅ CORREGIDO: Usar formatCurrency
                                        : `Faltan ${formatCurrency(goalData.remaining)} para tu meta.`
                                    }
                                </Text>
                                {!goalData.isCompleted && goalData.estimatedTime !== null && (
                                    <Text fontSize="xs" mt={1}>
                                        {goalData.estimatedTime > 0
                                            ? `Aproximadamente ${goalData.estimatedTime} día${goalData.estimatedTime !== 1 ? 's' : ''} restante${goalData.estimatedTime !== 1 ? 's' : ''}`
                                            : '¡Fecha objetivo alcanzada!'
                                        }
                                    </Text>
                                )}
                            </Box>
                        </Alert>
                    </CardFooter>
                )}
            </Card>

            {/* Modal de configuración de meta */}
            <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {goalData.isGoalSet ? 'Editar Meta' : 'Configurar Meta de Ahorro'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>¿Qué estás ahorrando?</FormLabel>
                                <Input
                                    value={goalName}
                                    onChange={(e) => setGoalName(e.target.value)}
                                    placeholder="Ej: Viaje a la playa, Nuevo carro, Emergencias..."
                                    size="lg"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Monto objetivo</FormLabel>
                                <NumberInput
                                    min={1}
                                    value={goalAmount}
                                    onChange={(value) => setGoalAmount(value)}
                                    size="lg"
                                >
                                    <NumberInputField placeholder="0.00" />
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel>
                                    <HStack spacing={2}>
                                        <Text>Fecha objetivo (opcional)</Text>
                                        <Tooltip label="Establece una fecha límite para alcanzar tu meta">
                                            <Box color={subtleTextColor}>
                                                <Icon as={FiInfo} boxSize={4} />
                                            </Box>
                                        </Tooltip>
                                    </HStack>
                                </FormLabel>
                                <Input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    min={getMinDate()}
                                    size="lg"
                                />
                            </FormControl>

                            {goalData.isGoalSet && (
                                <Alert status="warning" borderRadius="md" fontSize="sm">
                                    <AlertIcon />
                                    <Text>
                                        Al actualizar la meta, el progreso se recalculará automáticamente.
                                    </Text>
                                </Alert>
                            )}
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <HStack spacing={3} width="full">
                            {goalData.isGoalSet && (
                                <Button
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={handleRemoveGoal}
                                    isLoading={loading}
                                    leftIcon={<Icon as={FiX} />}
                                >
                                    Eliminar
                                </Button>
                            )}
                            <Spacer />
                            <Button variant="ghost" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={handleSaveGoal}
                                isLoading={loading}
                                loadingText="Guardando..."
                            >
                                {goalData.isGoalSet ? 'Actualizar Meta' : 'Crear Meta'}
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}