// src/components/EditTransactionModal.jsx
import React, { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    FormControl, FormLabel, Input, NumberInput, NumberInputField, Select,
    Button, useToast, Stack
} from '@chakra-ui/react';
import api from '../api';
import moment from 'moment'; // Para manejo de fechas

// Opciones de categoría (igual que TransactionForm)
const expenseCategories = [ /* ... tus categorías ... */];
// const incomeCategories = [ /* ... si es necesario ... */ ];

export default function EditTransactionModal({ open, onCancel, onUpdate, transaction }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // --- Estado para los campos del formulario ---
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    // ------------------------------------------

    // Determina el tipo de transacción ('IN' o 'OUT') basado en el objeto 'transaction'
    const transactionType = transaction?.transaction_type || 'IN';

    // Rellena el formulario cuando se abre el modal o cambia la transacción seleccionada
    useEffect(() => {
        if (open && transaction) {
            setDate(moment(transaction.date).format('YYYY-MM-DD')); // Formatea fecha a YYYY-MM-DD
            setAmount(String(parseFloat(transaction.amount) || 0)); // Convierte monto a string
            setCategory(transaction.category || ''); // Usa categoría o string vacío
            setDescription(transaction.description || ''); // Usa descripción o string vacío
        }
    }, [open, transaction]); // Dependencias

    // Manejador del envío del formulario
    const handleSubmit = async () => {
        setLoading(true);
        // Validación básica
        if (!date || !amount || parseFloat(amount) <= 0) {
            toast({ title: "Datos inválidos", description: "Fecha y monto (positivo) son requeridos.", status: "warning", duration: 3000, isClosable: true });
            setLoading(false);
            return;
        }
        if (transactionType === 'OUT' && !category) {
            toast({ title: "Datos inválidos", description: "Selecciona una categoría para el gasto.", status: "warning", duration: 3000, isClosable: true });
            setLoading(false);
            return;
        }

        try {
            // Prepara los datos para enviar a la API
            const dataToSend = {
                date: date,
                amount: parseFloat(amount),
                description: description || '',
                transaction_type: transactionType, // Mantiene el tipo original
            };
            if (transactionType === 'OUT') {
                dataToSend.category = category;
            }

            // console.log("EditModal: Enviando datos:", dataToSend, "ID:", transaction.id); // DEBUG

            await api.updateTransaction(transaction.id, dataToSend); // Llama a la API de actualización
            toast({ title: "Éxito", description: "Registro actualizado.", status: "success", duration: 3000, isClosable: true });
            onUpdate(); // Llama a la función del Dashboard para cerrar y recargar

        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.response?.data || err.message;
            console.error('Error al actualizar:', errorDetail);
            toast({ title: "Error", description: `No se pudo actualizar: ${errorDetail || 'Error desconocido'}`, status: "error", duration: 5000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={open} onClose={onCancel} isCentered size={{ base: 'full', sm: 'md' }}>
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
                                    {/* Mapea las opciones de categoría */}
                                    {expenseCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {/* Si necesitas categoría para Ingresos, añade un Select similar aquí */}

                        {/* Campo Descripción */}
                        <FormControl id="edit-description">
                            <FormLabel fontSize="sm" color="gray.600">Descripción (opcional)</FormLabel>
                            <Input
                                as="textarea"
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                size="lg"
                                focusBorderColor="green.500"
                            />
                        </FormControl>
                    </Stack>
                </ModalBody>

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