// src/components/EditTransactionModal.jsx
import React, { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
    NumberInput, NumberInputField, Select, Button, useToast, Stack
} from '@chakra-ui/react';
import api from "../../lib/api.js";
import moment from 'moment';

// Opciones de categoría (debes completar con tus categorías reales)
const expenseCategories = [
    { value: 'AL', label: 'Alimentación' },
    { value: 'TR', label: 'Transporte' },
    { value: 'SE', label: 'Servicios' },
    { value: 'VI', label: 'Vivienda' },
    { value: 'OC', label: 'Ocio' },
    { value: 'SA', label: 'Salud' },
    { value: 'ED', label: 'Educación' },
    { value: 'OT', label: 'Otros' },
];

// ✅ CAMBIO: Ajustar las props para que coincidan con Dashboard.jsx
export default function EditTransactionModal({
    isOpen,
    onClose,
    onSuccess,
    transaction
}) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // Determina el tipo de transacción
    const transactionType = transaction?.transaction_type || 'IN';

    // ✅ CORREGIDO: Usar las props correctas
    useEffect(() => {
        if (isOpen && transaction) {
            setDate(moment(transaction.date).format('YYYY-MM-DD'));
            setAmount(String(parseFloat(transaction.amount) || 0));
            setCategory(transaction.category || '');
            setDescription(transaction.description || '');
        }
    }, [isOpen, transaction]); // ✅ Cambiado de 'open' a 'isOpen'

    // ✅ CORREGIDO: Limpiar formulario cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setDate('');
            setAmount('');
            setCategory('');
            setDescription('');
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        setLoading(true);

        // Validación básica
        if (!date || !amount || parseFloat(amount) <= 0) {
            toast({
                title: "Datos inválidos",
                description: "Fecha y monto (positivo) son requeridos.",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            setLoading(false);
            return;
        }

        if (transactionType === 'OUT' && !category) {
            toast({
                title: "Datos inválidos",
                description: "Selecciona una categoría para el gasto.",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                date: date,
                amount: parseFloat(amount),
                description: description || '',
                transaction_type: transactionType,
            };

            if (transactionType === 'OUT') {
                dataToSend.category = category;
            }

            await api.updateTransaction(transaction.id, dataToSend);

            toast({
                title: "Éxito",
                description: "Transacción actualizada correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true
            });

            // ✅ CORREGIDO: Llamar a onSuccess en lugar de onUpdate
            onSuccess();

        } catch (err) {
            console.error('Error al actualizar:', err);
            const errorDetail = err.response?.data?.detail || err.response?.data || err.message;
            toast({
                title: "Error",
                description: `No se pudo actualizar: ${errorDetail || 'Error desconocido'}`,
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
            onClose={onClose}  // ✅ Cambiado de onCancel a onClose
            isCentered
            size={{ base: 'full', sm: 'md' }}
        >
            <ModalOverlay />
            <ModalContent mx={4}>
                <ModalHeader>Editar Transacción</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Stack spacing={4}>
                        {/* Campo Fecha */}
                        <FormControl isRequired id="edit-date">
                            <FormLabel fontSize="sm" color="gray.600">Fecha</FormLabel>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                size="lg"
                                focusBorderColor="green.500"
                            />
                        </FormControl>

                        {/* Campo Monto */}
                        <FormControl isRequired id="edit-amount">
                            <FormLabel fontSize="sm" color="gray.600">Monto</FormLabel>
                            <NumberInput
                                min={0.01}
                                step={1}
                                precision={2}
                                value={amount}
                                onChange={(valueAsString) => setAmount(valueAsString)}
                                size="lg"
                                focusBorderColor="green.500"
                            >
                                <NumberInputField />
                            </NumberInput>
                        </FormControl>

                        {/* Campo Categoría (SOLO para Gastos) */}
                        {transactionType === 'OUT' && (
                            <FormControl isRequired id="edit-category">
                                <FormLabel fontSize="sm" color="gray.600">Categoría</FormLabel>
                                <Select
                                    placeholder="Selecciona una categoría"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    size="lg"
                                    focusBorderColor="green.500"
                                >
                                    {expenseCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Campo Descripción */}
                        <FormControl id="edit-description">
                            <FormLabel fontSize="sm" color="gray.600">
                                Descripción (opcional)
                            </FormLabel>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                size="lg"
                                focusBorderColor="green.500"
                                placeholder="Descripción de la transacción"
                            />
                        </FormControl>
                    </Stack>
                </ModalBody>

                <ModalFooter>
                    <Button variant='ghost' mr={3} onClick={onClose}>  {/* ✅ Cambiado de onCancel a onClose */}
                        Cancelar
                    </Button>
                    <Button
                        colorScheme='green'
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