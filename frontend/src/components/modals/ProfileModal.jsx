// /root/DIMBOX/frontend/src/components/modals/ProfileModal.jsx - VERSIÓN CORREGIDA
import React, { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
    NumberInput, NumberInputField, Button, useToast, Stack,
    VStack, Text, Box, useColorModeValue
} from '@chakra-ui/react';
import { FiUser, FiTarget, FiDollarSign } from 'react-icons/fi';

export default function ProfileModal({ isOpen, onClose, onUpdate, profile }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [goalName, setGoalName] = useState('');
    const [goalAmount, setGoalAmount] = useState('');

    // Colores dinámicos
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const subtleTextColor = useColorModeValue('gray.600', 'gray.400');

    // ✅ ACTUALIZADO: Usar isOpen en lugar de open
    useEffect(() => {
        if (isOpen && profile) {
            setName(profile.name || '');
            setGoalName(profile.goal_name || '');
            setGoalAmount(String(parseFloat(profile.goal_amount) || ''));
        }
    }, [isOpen, profile]);

    // ✅ ACTUALIZADO: Limpiar formulario al cerrar
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setGoalName('');
            setGoalAmount('');
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        setLoading(true);

        // Validación mejorada
        if (!name?.trim()) {
            toast({
                title: "Nombre requerido",
                description: "Por favor ingresa tu nombre.",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            setLoading(false);
            return;
        }

        if (!goalName?.trim()) {
            toast({
                title: "Meta requerida",
                description: "Por favor ingresa un nombre para tu meta de ahorro.",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            setLoading(false);
            return;
        }

        const amount = parseFloat(goalAmount);
        if (isNaN(amount) || amount < 0) {
            toast({
                title: "Monto inválido",
                description: "El monto debe ser un número positivo.",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            setLoading(false);
            return;
        }

        try {
            const values = {
                name: name.trim(),
                goal_name: goalName.trim(),
                goal_amount: amount
            };

            // ✅ ACTUALIZADO: Usar AuthContext o API según corresponda
            // Por ahora mantenemos la API, pero podrías migrar a AuthContext
            const { default: api } = await import("@lib/api.js");
            await api.updateProfile(values);

            toast({
                title: "¡Perfil actualizado! 🎉",
                description: "Tu información se guardó correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true
            });

            onUpdate?.(); // ✅ Usar optional chaining

        } catch (err) {
            console.error("ProfileModal: Error al actualizar", err);
            const errorMsg = err?.response?.data?.detail ||
                err?.response?.data?.name?.[0] ||
                err?.response?.data?.goal_name?.[0] ||
                'No se pudo actualizar el perfil. Intenta nuevamente.';

            toast({
                title: "Error",
                description: errorMsg,
                status: "error",
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose} // ✅ CORREGIDO: onClose en lugar de onCancel
            isCentered
            size={{ base: 'full', sm: 'md' }}
        >
            <ModalOverlay />
            <ModalContent
                mx={4}
                bg={cardBg}
                border="1px"
                borderColor={borderColor}
                borderRadius="xl"
            >
                <ModalHeader pb={3}>
                    <VStack spacing={2} align="start">
                        <Text fontSize="xl" fontWeight="bold" color={textColor}>
                            Mi Perfil
                        </Text>
                        <Text fontSize="sm" color={subtleTextColor}>
                            Actualiza tu información personal y metas
                        </Text>
                    </VStack>
                </ModalHeader>

                <ModalCloseButton />

                <ModalBody pb={6}>
                    <Stack spacing={5}>
                        {/* Información Personal */}
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                                👤 Información Personal
                            </Text>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color={subtleTextColor}>
                                    Tu nombre completo
                                </FormLabel>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: María González"
                                    size="lg"
                                    focusBorderColor="green.500"
                                    leftIcon={<FiUser />}
                                />
                            </FormControl>
                        </Box>

                        {/* Meta de Ahorro */}
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                                🎯 Meta de Ahorro
                            </Text>

                            <FormControl isRequired mb={4}>
                                <FormLabel fontSize="sm" color={subtleTextColor}>
                                    ¿Qué estás ahorrando?
                                </FormLabel>
                                <Input
                                    value={goalName}
                                    onChange={(e) => setGoalName(e.target.value)}
                                    placeholder="Ej: Viaje a la playa, Fondo de emergencia..."
                                    size="lg"
                                    focusBorderColor="green.500"
                                    leftIcon={<FiTarget />}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color={subtleTextColor}>
                                    Monto objetivo (S/)
                                </FormLabel>
                                <NumberInput
                                    min={0}
                                    step={100}
                                    precision={2}
                                    value={goalAmount}
                                    onChange={(valueAsString) => setGoalAmount(valueAsString)}
                                    size="lg"
                                    focusBorderColor="green.500"
                                >
                                    <NumberInputField
                                        placeholder="0.00"
                                        leftIcon={<FiDollarSign />}
                                    />
                                </NumberInput>
                            </FormControl>
                        </Box>

                        {/* Información de ayuda */}
                        <Box
                            p={3}
                            bg="blue.50"
                            borderRadius="md"
                            border="1px"
                            borderColor="blue.200"
                        >
                            <Text fontSize="xs" color="blue.700">
                                💡 Tu meta de ahorro te ayudará a mantener el enfoque
                                y trackear tu progreso financiero.
                            </Text>
                        </Box>
                    </Stack>
                </ModalBody>

                <ModalFooter pt={4}>
                    <Button
                        variant="outline"
                        mr={3}
                        onClick={onClose} // ✅ CORREGIDO: onClose
                        isDisabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        colorScheme="green"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="Guardando..."
                    >
                        Guardar Cambios
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}