// src/components/ProfileModal.jsx
import React, { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    FormControl, FormLabel, Input, NumberInput, NumberInputField,
    Button, useToast, Stack
} from '@chakra-ui/react';
import api from '../api';

export default function ProfileModal({ open, onCancel, onUpdate, profile }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // --- Estado para los campos del formulario ---
    const [name, setName] = useState('');
    const [goalName, setGoalName] = useState('');
    const [goalAmount, setGoalAmount] = useState(''); // Se guarda como string para NumberInput
    // ------------------------------------------

    // Actualiza el estado cuando se abre el modal o cambia el perfil
    useEffect(() => {
        if (open && profile) {
            setName(profile.name || '');
            setGoalName(profile.goal_name || '');
            // Formatea número para NumberInput (espera string o número)
            setGoalAmount(String(parseFloat(profile.goal_amount) || 0));
        }
    }, [open, profile]);

    // Manejador del envío del formulario
    const handleSubmit = async () => {
        setLoading(true);
        // Validación básica
        if (!name || !goalName || !goalAmount || parseFloat(goalAmount) < 0) {
            toast({ title: "Datos inválidos", description: "Nombre y meta (con monto no negativo) son requeridos.", status: "warning", duration: 3000, isClosable: true });
            setLoading(false);
            return;
        }

        try {
            // Prepara los datos para enviar a la API
            const values = {
                name: name,
                goal_name: goalName,
                goal_amount: parseFloat(goalAmount) // Convierte de nuevo a número para la API
            };
            // console.log("ProfileModal: Enviando valores:", values); // DEBUG
            await api.updateProfile(values);
            toast({ title: "Éxito", description: "Perfil actualizado.", status: "success", duration: 3000, isClosable: true });
            onUpdate(); // Llama a la función del Dashboard para recargar y cerrar

        } catch (err) {
            console.error("ProfileModal: Error al actualizar", err);
            toast({ title: "Error", description: "No se pudo actualizar el perfil.", status: "error", duration: 5000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        // Componente Modal de Chakra
        <Modal isOpen={open} onClose={onCancel} isCentered size={{ base: 'full', sm: 'md' }}> {/* Ocupa toda la pantalla en móvil */}
            <ModalOverlay /> {/* Fondo semitransparente */}
            <ModalContent mx={4}> {/* Margen horizontal en pantallas pequeñas */}
                <ModalHeader>Tu Perfil y Meta de Ahorro</ModalHeader>
                <ModalCloseButton /> {/* Botón 'X' para cerrar */}
                <ModalBody pb={6}> {/* Cuerpo del modal con padding inferior */}
                    {/* Stack para apilar los campos del formulario */}
                    <Stack spacing={4}>
                        {/* Campo Nombre */}
                        <FormControl isRequired id="profile-name"> {/* Añadir ID para accesibilidad */}
                            <FormLabel fontSize="sm" color="gray.600">Tu nombre</FormLabel>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Jesús Martín"
                                size="lg" // Input grande
                                focusBorderColor="green.500" // Borde verde al enfocar
                            />
                        </FormControl>

                        {/* Campo Nombre Meta */}
                        <FormControl isRequired id="profile-goal-name">
                            <FormLabel fontSize="sm" color="gray.600">Nombre de la meta de ahorro</FormLabel>
                            <Input
                                value={goalName}
                                onChange={(e) => setGoalName(e.target.value)}
                                placeholder="Ej: Viaje a Cusco, Fondo de Emergencia"
                                size="lg"
                                focusBorderColor="green.500"
                            />
                        </FormControl>

                        {/* Campo Monto Meta */}
                        <FormControl isRequired id="profile-goal-amount">
                            <FormLabel fontSize="sm" color="gray.600">Monto meta (S/)</FormLabel>
                            <NumberInput
                                min={0} // Mínimo 0
                                step={100} // Incremento
                                precision={2} // Dos decimales
                                value={goalAmount} // Valor del estado
                                onChange={(valueAsString) => setGoalAmount(valueAsString)} // Actualiza estado
                                size="lg"
                                focusBorderColor="green.500"
                            >
                                <NumberInputField placeholder="Ej: 1500.00" />
                                {/* Puedes añadir steppers si quieres */}
                            </NumberInput>
                        </FormControl>
                    </Stack>
                </ModalBody>

                {/* Pie del modal con botones */}
                <ModalFooter>
                    <Button variant='ghost' mr={3} onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button colorScheme='green' onClick={handleSubmit} isLoading={loading}>
                        Guardar Cambios
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}