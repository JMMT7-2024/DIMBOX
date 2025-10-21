import React, { useMemo, useState } from 'react';
import {
    Box,
    Stack,
    Grid,
    GridItem,
    FormControl,
    FormLabel,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Select,
    Button,
    ButtonGroup,
    useToast,
} from '@chakra-ui/react';

import api from '../api';

// === Config ===
// Si tu API usa 'category_id' (numérico), cambia aquí:
const CATEGORY_FIELD = 'category';

const normalizeCategory = (v) => {
    if (v == null) return v;
    if (typeof v === 'string') {
        return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    }
    return v;
};

const fmtDate = (dStr) => dStr; // Input type="date" ya viene 'YYYY-MM-DD'

const resolveSaveFn = () =>
    api.createTransaction ||
    api.addTransaction ||
    api.newTransaction ||
    api.postTransaction ||
    api.saveTransaction ||
    api.createMov ||
    api.addMov ||
    api.create; // último recurso

export default function TransactionForm({ onNewTransaction = () => { } }) {
    const toast = useToast();

    const [type, setType] = useState('income'); // 'income' | 'expense'
    const [loading, setLoading] = useState(false);

    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // Puedes cambiar estos a IDs si tu API lo requiere
    const categoryOptions = useMemo(
        () => [
            { label: 'Alimentación', value: 'Alimentación' },
            { label: 'Transporte', value: 'Transporte' },
            { label: 'Servicios', value: 'Servicios' },
            { label: 'Vivienda', value: 'Vivienda' },
            { label: 'Salud', value: 'Salud' },
            { label: 'Ocio', value: 'Ocio' },
            { label: 'Otros', value: 'Otros' },
        ],
        []
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        const saveFn = resolveSaveFn();
        if (!saveFn) {
            toast({ title: 'No se encontró el método para guardar en la API.', status: 'error' });
            return;
        }

        if (!date) {
            toast({ title: 'Selecciona la fecha.', status: 'warning' });
            return;
        }

        const raw = Number(amount);
        if (!Number.isFinite(raw) || raw <= 0) {
            toast({ title: 'Ingresa un monto válido mayor a 0.', status: 'warning' });
            return;
        }

        const payload = {
            transaction_type: type === 'income' ? 'IN' : 'OUT',
            transaction_date: fmtDate(date),
            amount: type === 'expense' ? -Math.abs(raw) : Math.abs(raw),
            description: description || '',
        };

        if (category) {
            payload[CATEGORY_FIELD] = normalizeCategory(category);
        }

        setLoading(true);
        try {
            await saveFn(payload);
            toast({ title: type === 'income' ? 'Ingreso registrado' : 'Gasto registrado', status: 'success' });
            // limpiar
            setAmount('');
            setDescription('');
            setCategory('');
            onNewTransaction();
        } catch (err) {
            console.error('Error guardando transacción:', err);
            const data = err?.response?.data;
            const msg =
                (typeof data === 'string' && data) ||
                data?.detail ||
                data?.transaction_type ||
                data?.transaction_date ||
                data?.amount ||
                data?.category ||
                data?.category_id ||
                'No se pudo guardar. Intenta de nuevo.';
            toast({ title: msg, status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            as="form"
            onSubmit={handleSubmit}
            bg="var(--card)"
            border="1px solid var(--line)"
            borderRadius="16px"
            boxShadow="var(--shadow-light)"
            p={5}
        >
            <Stack spacing={4}>
                <ButtonGroup size="sm" isAttached alignSelf="flex-end">
                    <Button
                        variant={type === 'income' ? 'solid' : 'outline'}
                        colorScheme="green"
                        onClick={() => setType('income')}
                    >
                        Ingresos
                    </Button>
                    <Button
                        variant={type === 'expense' ? 'solid' : 'outline'}
                        colorScheme="red"
                        onClick={() => setType('expense')}
                    >
                        Gastos
                    </Button>
                </ButtonGroup>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                    <GridItem>
                        <FormControl isRequired>
                            <FormLabel>Fecha</FormLabel>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </FormControl>
                    </GridItem>

                    <GridItem>
                        <FormControl isRequired>
                            <FormLabel>Monto</FormLabel>
                            <NumberInput precision={2} step={10} min={0} value={amount} onChange={(v) => setAmount(v)}>
                                <NumberInputField placeholder="Ej: 1200.00" />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                    </GridItem>
                </Grid>

                {type === 'expense' && (
                    <FormControl>
                        <FormLabel>Categoría (opcional)</FormLabel>
                        {/* Chakra Select usa <option> como hijos */}
                        <Select
                            placeholder="Selecciona una categoría"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categoryOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <FormControl>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <Input
                        placeholder={type === 'income' ? 'Ej: Sueldo del mes' : 'Ej: Compras / Transporte'}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </FormControl>

                <Button type="submit" colorScheme={type === 'income' ? 'green' : 'red'} isLoading={loading}>
                    {type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                </Button>
            </Stack>
        </Box>
    );
}
