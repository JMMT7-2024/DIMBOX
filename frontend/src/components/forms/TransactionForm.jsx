import React, { useState, useEffect } from 'react';
import {
    Card, CardBody,
    Tabs, TabList, TabPanels, Tab, TabPanel,
    VStack, HStack, Stack,
    FormControl, FormLabel, Input, Select, Button, useToast, Box, Text,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Divider, Alert, AlertIcon, Progress, Badge, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure
} from '@chakra-ui/react';
import { FiAlertTriangle, FiStar, FiCheck, FiX } from 'react-icons/fi';
import api from "../../lib/api.js";
import { useAuth } from "../../auth/AuthContext";

// ✅ COMPONENTE MODAL DE UPGRADE - CORREGIDO
const UpgradeModal = ({ isOpen, onClose, currentPlan, onUpgrade, isPremium = false }) => {
    // ✅ NO MOSTRAR MODAL SI YA ES PREMIUM
    if (isPremium) {
        return null;
    }

    const handleWhatsAppRedirect = () => {
        const phoneNumber = '+51931119720';
        const message = 'Hola, estoy interesado en actualizar mi cuenta a Premium en FinanzApp. ¿Podrían brindarme más información?';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={2}>
                        <FiStar color="gold" />
                        <Text>Actualiza a Premium</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Alert status="warning" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <Text fontWeight="bold">Límite alcanzado</Text>
                                <Text fontSize="sm">
                                    Has alcanzado el límite de tu plan {currentPlan}.
                                </Text>
                            </Box>
                        </Alert>

                        <Card variant="outline" borderColor="green.200">
                            <CardBody>
                                <VStack spacing={3} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Plan Premium</Text>
                                        <Badge colorScheme="green">Recomendado</Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600">
                                        Desbloquea todas las funcionalidades:
                                    </Text>
                                    <VStack spacing={1} align="start">
                                        <Text fontSize="sm">✓ Transacciones ilimitadas</Text>
                                        <Text fontSize="sm">✓ Hasta 1000 transacciones mensuales</Text>
                                        <Text fontSize="sm">✓ Cuentas rápidas ilimitadas</Text>
                                        <Text fontSize="sm">✓ Exportación Excel completa</Text>
                                        <Text fontSize="sm">✓ Análisis avanzados</Text>
                                        <Text fontSize="sm">✓ Soporte prioritario</Text>
                                    </VStack>
                                    <Text fontWeight="bold" color="green.600">
                                        S/ 9.99 / mes
                                    </Text>
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* ✅ INFORMACIÓN DE CONTACTO */}
                        <Card variant="outline" borderColor="blue.200">
                            <CardBody>
                                <VStack spacing={2} align="stretch">
                                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                        📞 Contáctanos por WhatsApp
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                        Te atenderemos personalmente para resolver todas tus dudas y activar tu plan Premium.
                                    </Text>
                                    <HStack spacing={2} mt={2}>
                                        <Badge colorScheme="green" fontSize="xs">
                                            +51 931 119 720
                                        </Badge>
                                    </HStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <HStack spacing={3}>
                        <Button variant="outline" onClick={onClose}>
                            Quizás luego
                        </Button>
                        <Button
                            colorScheme="green"
                            onClick={handleWhatsAppRedirect}
                            leftIcon={<FiStar />}
                        >
                            Contactar por WhatsApp
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ✅ COMPONENTE DE INDICADOR DE LÍMITES - CORREGIDO
const LimitsIndicator = ({ currentCount, limit, type, onUpgradeRequired, isPremium = false }) => {
    // ✅ NO MOSTRAR INDICADOR SI ES PREMIUM
    if (isPremium) {
        return null;
    }

    const percentage = Math.min(100, (currentCount / limit) * 100);
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    const getColorScheme = () => {
        if (isAtLimit) return 'red';
        if (isNearLimit) return 'orange';
        return 'green';
    };

    const getLabel = () => {
        if (isAtLimit) return 'Límite alcanzado';
        if (isNearLimit) return 'Cerca del límite';
        return 'Dentro del límite';
    };

    if (limit === 0 || limit === Infinity) return null;

    return (
        <Box>
            <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">
                    {getLabel()}: {currentCount} / {limit}
                </Text>
                {isAtLimit && (
                    <Button
                        size="xs"
                        colorScheme="green"
                        variant="outline"
                        onClick={onUpgradeRequired}
                        leftIcon={<FiStar size={12} />}
                    >
                        Upgrade
                    </Button>
                )}
            </HStack>
            <Progress
                value={percentage}
                colorScheme={getColorScheme()}
                size="sm"
                borderRadius="full"
                mb={2}
            />
            {isNearLimit && !isAtLimit && (
                <Alert status="warning" size="sm" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="xs">
                        Te quedan {limit - currentCount} {type}. Considera actualizar tu plan.
                    </Text>
                </Alert>
            )}
        </Box>
    );
};

const CATEGORY_OPTIONS = [
    { value: 'AL', label: 'Alimentación' },
    { value: 'TR', label: 'Transporte' },
    { value: 'SE', label: 'Servicios' },
    { value: 'VI', label: 'Vivienda' },
    { value: 'OC', label: 'Ocio' },
    { value: 'SA', label: 'Salud' },
    { value: 'ED', label: 'Educación' },
    { value: 'OT', label: 'Otros' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

// ✅ SUBCOMPONENTE FORM CORREGIDO
function FormComponent({
    date,
    setDate,
    amount,
    setAmount,
    description,
    setDescription,
    loading,
    onSubmit,
    isExpense = false,
    category,
    setCategory,
    maxTransactionAmount,
    currentAmount,
    isPremium = false
}) {
    // ✅ NO HAY LÍMITE DE MONTO SI ES PREMIUM
    const exceedsAmountLimit = !isPremium && maxTransactionAmount > 0 && currentAmount > maxTransactionAmount;

    return (
        <Box as="form" onSubmit={onSubmit}>
            <VStack align="stretch" spacing={4}>
                <HStack spacing={4} flexWrap="wrap">
                    <FormControl isRequired minW={{ base: '100%', md: '260px' }} flex="1">
                        <FormLabel fontSize="sm" color="gray.600">Fecha</FormLabel>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            bg="white"
                        />
                    </FormControl>

                    <FormControl
                        isRequired
                        minW={{ base: '100%', md: '260px' }}
                        flex="1"
                        isInvalid={exceedsAmountLimit}
                    >
                        <FormLabel fontSize="sm" color="gray.600">
                            Monto {!isPremium && maxTransactionAmount > 0 && `(Máx: S/ ${maxTransactionAmount.toLocaleString()})`}
                            {isPremium && " (Sin límites)"}
                        </FormLabel>
                        {/* "Addon" S/ manual para NumberInput */}
                        <HStack>
                            <Box
                                px={3}
                                py={2}
                                fontSize="sm"
                                bg="gray.100"
                                border="1px solid"
                                borderColor={exceedsAmountLimit ? "red.300" : "gray.200"}
                                borderRight="0"
                                borderRadius="md"
                                borderTopRightRadius="0"
                                borderBottomRightRadius="0"
                            >
                                S/
                            </Box>
                            <NumberInput
                                value={amount}
                                onChange={(valueString) => setAmount(valueString)}
                                precision={2}
                                step={0.5}
                                min={0}
                                flex="1"
                                isInvalid={exceedsAmountLimit}
                            >
                                <NumberInputField
                                    borderLeftRadius="0"
                                    borderColor={exceedsAmountLimit ? "red.300" : "gray.200"}
                                    _focus={{
                                        borderColor: exceedsAmountLimit ? "red.500" : "blue.500",
                                        boxShadow: exceedsAmountLimit ? "0 0 0 1px red.500" : "0 0 0 1px blue.500"
                                    }}
                                />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </HStack>
                        {exceedsAmountLimit && (
                            <Text fontSize="xs" color="red.500" mt={1}>
                                El monto excede el límite permitido para tu plan
                            </Text>
                        )}
                        {isPremium && (
                            <Text fontSize="xs" color="green.600" mt={1}>
                                ✅ Monto ilimitado disponible
                            </Text>
                        )}
                    </FormControl>
                </HStack>

                {isExpense && (
                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.600">Categoría (opcional)</FormLabel>
                        <Select
                            placeholder="Selecciona una categoría"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            bg="white"
                        >
                            {CATEGORY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <FormControl>
                    <FormLabel fontSize="sm" color="gray.600">Descripción (opcional)</FormLabel>
                    <Input
                        maxLength={140}
                        placeholder="Ej: Almuerzo familiar / Sueldo del mes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        bg="white"
                    />
                </FormControl>

                <Divider />

                <Button
                    type="submit"
                    colorScheme={isExpense ? 'red' : 'green'}
                    isLoading={loading}
                    size="md"
                    isDisabled={exceedsAmountLimit}
                >
                    {isExpense ? 'Registrar Gasto' : 'Registrar Ingreso'}
                    {isPremium && " 🚀"}
                </Button>
            </VStack>
        </Box>
    );
}

// ✅ COMPONENTE PRINCIPAL CORREGIDO
export default function TransactionForm({ onSaved, currentTransactionCount = 0, isPremium = false }) {
    const toast = useToast();
    const { getLimit, hasReachedLimit } = useAuth();
    const [tabIndex, setTabIndex] = useState(0);
    const [date, setDate] = useState(todayStr());
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const type = tabIndex === 0 ? 'IN' : 'OUT';

    // ✅ VERIFICAR LÍMITES - SI ES PREMIUM, NO HAY LÍMITES
    const transactionLimit = isPremium ? Infinity : (getLimit?.('maxTransactions') || 10);
    const hasReachedTransactionLimit = isPremium ? false : (hasReachedLimit?.('maxTransactions', currentTransactionCount) || false);
    const canAddMoreTransactions = isPremium ? true : !hasReachedTransactionLimit;

    // ✅ VERIFICAR LÍMITE DE MONTO POR TRANSACCIÓN - SI ES PREMIUM, NO HAY LÍMITE
    const maxTransactionAmount = isPremium ? 0 : (getLimit?.('maxTransactionAmount') || 1000);
    const currentAmount = parseFloat(String(amount).replace(',', '.')) || 0;
    const exceedsAmountLimit = !isPremium && maxTransactionAmount > 0 && currentAmount > maxTransactionAmount;

    useEffect(() => {
        // ✅ SOLO NOTIFICAR SI NO ES PREMIUM
        if (!isPremium) {
            const usagePercentage = (currentTransactionCount / transactionLimit) * 100;
            if (usagePercentage >= 80 && usagePercentage < 100) {
                toast({
                    title: 'Límite cercano',
                    description: `Has usado el ${Math.round(usagePercentage)}% de tus transacciones. Te quedan ${transactionLimit - currentTransactionCount}.`,
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    }, [currentTransactionCount, transactionLimit, isPremium, toast]);

    const resetForm = () => {
        setDate(todayStr());
        setAmount('');
        setCategory('');
        setDescription('');
    };

    const handleUpgradeRequired = () => {
        // ✅ NO MOSTRAR MODAL SI YA ES PREMIUM
        if (!isPremium) {
            setShowUpgradeModal(true);
        }
    };

    const handleUpgrade = () => {
        // ✅ REDIRECCIÓN A WHATSAPP
        const phoneNumber = '+51931119720';
        const message = 'Hola, estoy interesado en actualizar mi cuenta a Premium en FinanzApp. ¿Podrían brindarme más información?';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        setShowUpgradeModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ VERIFICAR LÍMITE DE TRANSACCIONES - SOLO SI NO ES PREMIUM
        if (!isPremium && !canAddMoreTransactions) {
            handleUpgradeRequired();
            return;
        }

        // ✅ VERIFICAR LÍMITE DE MONTO - SOLO SI NO ES PREMIUM
        if (!isPremium && exceedsAmountLimit) {
            toast({
                title: 'Monto excede el límite',
                description: `El monto máximo permitido es S/ ${maxTransactionAmount.toLocaleString()}. Actualiza tu plan para transacciones mayores.`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Validaciones mínimas
        const amt = parseFloat(String(amount).replace(',', '.'));
        if (!date) {
            return toast({ status: 'warning', title: 'Fecha requerida' });
        }
        if (isNaN(amt) || amt <= 0) {
            return toast({ status: 'warning', title: 'Monto inválido' });
        }

        const payload = {
            transaction_type: type,
            amount: amt,
            date,
            description: description.trim(),
            category: type === 'OUT' ? (category || null) : null,
        };

        setLoading(true);
        try {
            await api.createTransaction(payload);
            toast({
                status: 'success',
                title: type === 'IN' ? 'Ingreso registrado' : 'Gasto registrado',
            });
            resetForm();
            setTabIndex(0);
            console.log('✅ Transacción guardada, llamando onSaved');
            onSaved?.();
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.category?.[0] ||
                'No se pudo guardar. Intenta de nuevo.';
            toast({ status: 'error', title: 'Error', description: msg });
            console.error('❌ Error guardando transacción:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card variant="outline" borderRadius="xl">
                <CardBody>
                    {/* ✅ INDICADOR DE LÍMITES - SOLO SI NO ES PREMIUM */}
                    {!isPremium && transactionLimit > 0 && (
                        <Box mb={4}>
                            <LimitsIndicator
                                currentCount={currentTransactionCount}
                                limit={transactionLimit}
                                type="transacciones"
                                onUpgradeRequired={handleUpgradeRequired}
                                isPremium={isPremium}
                            />
                        </Box>
                    )}

                    {/* ✅ ALERTA DE LÍMITE ALCANZADO - SOLO SI NO ES PREMIUM */}
                    {!isPremium && !canAddMoreTransactions && (
                        <Alert status="error" borderRadius="md" mb={4}>
                            <AlertIcon />
                            <Box>
                                <Text fontWeight="bold">Límite de transacciones alcanzado</Text>
                                <Text fontSize="sm">
                                    Has alcanzado tu límite de {transactionLimit} transacciones.
                                    Actualiza a Premium para continuar registrando movimientos.
                                </Text>
                            </Box>
                        </Alert>
                    )}

                    {/* ✅ ALERTA DE LÍMITE DE MONTO - SOLO SI NO ES PREMIUM */}
                    {!isPremium && exceedsAmountLimit && (
                        <Alert status="error" borderRadius="md" mb={4}>
                            <AlertIcon />
                            <Box>
                                <Text fontWeight="bold">Monto excede el límite</Text>
                                <Text fontSize="sm">
                                    El monto máximo permitido para tu plan es S/ {maxTransactionAmount.toLocaleString()}.
                                </Text>
                            </Box>
                        </Alert>
                    )}

                    {/* ✅ BADGE PREMIUM EN EL HEADER */}
                    {isPremium && (
                        <Box mb={4} textAlign="center">
                            <Badge colorScheme="purple" fontSize="sm" px={3} py={1} borderRadius="full">
                                ⭐ CUENTA PREMIUM - SIN LÍMITES
                            </Badge>
                        </Box>
                    )}

                    <Tabs
                        index={tabIndex}
                        onChange={setTabIndex}
                        variant="soft-rounded"
                        colorScheme={tabIndex === 0 ? 'green' : 'red'}
                        isFitted
                    >
                        <TabList mb={4}>
                            <Tab isDisabled={!canAddMoreTransactions}>
                                <HStack spacing={2}>
                                    <Text>Ingresos</Text>
                                    {!canAddMoreTransactions && <FiX size={14} />}
                                </HStack>
                            </Tab>
                            <Tab isDisabled={!canAddMoreTransactions}>
                                <HStack spacing={2}>
                                    <Text>Gastos</Text>
                                    {!canAddMoreTransactions && <FiX size={14} />}
                                </HStack>
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel px={0}>
                                <FormComponent
                                    date={date}
                                    amount={amount}
                                    description={description}
                                    setDate={setDate}
                                    setAmount={setAmount}
                                    setDescription={setDescription}
                                    loading={loading || !canAddMoreTransactions}
                                    onSubmit={handleSubmit}
                                    isExpense={false}
                                    maxTransactionAmount={maxTransactionAmount}
                                    currentAmount={currentAmount}
                                    isPremium={isPremium}
                                />
                            </TabPanel>

                            <TabPanel px={0}>
                                <FormComponent
                                    date={date}
                                    amount={amount}
                                    description={description}
                                    setDate={setDate}
                                    setAmount={setAmount}
                                    setDescription={setDescription}
                                    loading={loading || !canAddMoreTransactions}
                                    onSubmit={handleSubmit}
                                    isExpense
                                    category={category}
                                    setCategory={setCategory}
                                    maxTransactionAmount={maxTransactionAmount}
                                    currentAmount={currentAmount}
                                    isPremium={isPremium}
                                />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>

                    {/* ✅ INDICADOR DE PLAN ACTUAL - MEJORADO */}
                    <Box mt={4} pt={4} borderTop="1px" borderColor="gray.100">
                        <HStack justify="space-between" fontSize="sm">
                            <Text color="gray.600">Plan actual:</Text>
                            <Badge colorScheme={isPremium ? "purple" : "gray"}>
                                {isPremium ? "⭐ PREMIUM" : "FREE"}
                            </Badge>
                        </HStack>

                        {/* ✅ BOTÓN DE ACTUALIZACIÓN - SOLO SI NO ES PREMIUM */}
                        {!isPremium && (
                            <Button
                                size="sm"
                                variant="outline"
                                colorScheme="green"
                                leftIcon={<FiStar />}
                                onClick={handleUpgradeRequired}
                                width="100%"
                                mt={2}
                            >
                                Actualizar a Premium
                            </Button>
                        )}

                        {/* ✅ MENSAJE PARA USUARIOS PREMIUM */}
                        {isPremium && (
                            <Text fontSize="xs" color="green.600" textAlign="center" mt={2}>
                                ✅ Disfruta de todas las funciones sin límites
                            </Text>
                        )}
                    </Box>
                </CardBody>
            </Card>

            {/* ✅ MODAL DE UPGRADE - SOLO SE MUESTRA SI NO ES PREMIUM */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentPlan={isPremium ? "premium" : "free"}
                onUpgrade={handleUpgrade}
                isPremium={isPremium}
            />
        </>
    );
}