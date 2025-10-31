// src/features/transactions/Transactions.jsx - VERSIÓN CHAKRA UI MEJORADA
import React, { useState, useCallback, useMemo } from 'react';
import {
    Box, Card, CardBody, Tabs, TabList, TabPanels, Tab, TabPanel,
    VStack, HStack, FormControl, FormLabel, FormErrorMessage,
    Input, NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper,
    Select, Button, useToast, Text, Badge, useColorModeValue,
    Grid, GridItem, Icon, Tooltip, Collapse, Alert, AlertIcon,
    useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, ModalCloseButton
} from '@chakra-ui/react';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar,
    FiTag, FiFileText, FiPlus, FiEdit, FiTrash2, FiFilter,
    FiDownload, FiSearch, FiRefreshCw, FiBarChart2
} from 'react-icons/fi';
import { useAuth } from '../../auth/AuthContext';
import api from '../../services/api';

// ✅ COMPONENTE DE FORMULARIO DE TRANSACCIÓN
const TransactionForm = ({ onTransactionSaved, currentTransactionCount = 0 }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'OT',
        description: '',
        transaction_type: 'OUT'
    });

    // ✅ CATEGORÍAS MEJORADAS
    const CATEGORIES = useMemo(() => ({
        IN: {
            AL: 'Salario',
            FR: 'Freelance',
            IN: 'Inversiones',
            RE: 'Reembolsos',
            OT: 'Otros Ingresos'
        },
        OUT: {
            AL: 'Alimentación',
            TR: 'Transporte',
            SE: 'Servicios',
            VI: 'Vivienda',
            SA: 'Salud',
            ED: 'Educación',
            EN: 'Entretenimiento',
            RO: 'Ropa',
            OT: 'Otros Gastos'
        }
    }), []);

    // ✅ MANEJADORES DE FORMULARIO
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleTabChange = useCallback((index) => {
        setActiveTab(index);
        const transactionType = index === 0 ? 'OUT' : 'IN';
        setFormData(prev => ({
            ...prev,
            transaction_type: transactionType,
            category: transactionType === 'IN' ? 'OT' : 'AL'
        }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast({
                title: 'Monto inválido',
                description: 'Ingresa un monto válido mayor a 0',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        if (formData.transaction_type === 'OUT' && !formData.category) {
            toast({
                title: 'Categoría requerida',
                description: 'Selecciona una categoría para el gasto',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsLoading(true);
        try {
            const transactionData = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString()
            };

            await api.createTransaction(transactionData);

            toast({
                title: '✅ ¡Transacción registrada!',
                description: `${formData.transaction_type === 'IN' ? 'Ingreso' : 'Gasto'
                    } de S/ ${formData.amount} agregado`,
                status: 'success',
                duration: 3000,
            });

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                category: formData.transaction_type === 'IN' ? 'OT' : 'AL',
                description: '',
                transaction_type: formData.transaction_type
            });

            onTransactionSaved?.();
        } catch (error) {
            console.error('Error creando transacción:', error);
            toast({
                title: '❌ Error',
                description: 'No se pudo registrar la transacción',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, toast, onTransactionSaved]);

    const currentCategories = formData.transaction_type === 'IN' ? CATEGORIES.IN : CATEGORIES.OUT;

    return (
        <Card
            shadow="md"
            border="1px"
            borderColor="gray.200"
            _hover={{ shadow: 'lg' }}
            transition="all 0.3s"
        >
            <CardBody>
                <VStack spacing={4} align="stretch">
                    {/* HEADER */}
                    <HStack justify="space-between" align="center">
                        <Text fontSize="xl" fontWeight="bold" color="gray.800">
                            Nueva Transacción
                        </Text>
                        <Badge colorScheme="green" fontSize="sm">
                            #{currentTransactionCount + 1}
                        </Badge>
                    </HStack>

                    {/* TABS */}
                    <Tabs
                        index={activeTab}
                        onChange={handleTabChange}
                        colorScheme={activeTab === 0 ? "red" : "green"}
                        isFitted
                    >
                        <TabList bg="gray.50" borderRadius="md" p={1}>
                            <Tab
                                _selected={{
                                    bg: 'red.500',
                                    color: 'white',
                                    shadow: 'sm'
                                }}
                                borderRadius="md"
                            >
                                <HStack spacing={2}>
                                    <FiTrendingDown size={16} />
                                    <Text>Gasto</Text>
                                </HStack>
                            </Tab>
                            <Tab
                                _selected={{
                                    bg: 'green.500',
                                    color: 'white',
                                    shadow: 'sm'
                                }}
                                borderRadius="md"
                            >
                                <HStack spacing={2}>
                                    <FiTrendingUp size={16} />
                                    <Text>Ingreso</Text>
                                </HStack>
                            </Tab>
                        </TabList>
                    </Tabs>

                    {/* FORMULARIO */}
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            {/* FECHA */}
                            <FormControl isRequired>
                                <FormLabel>
                                    <HStack spacing={2}>
                                        <FiCalendar size={16} />
                                        <Text>Fecha</Text>
                                    </HStack>
                                </FormLabel>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </FormControl>

                            {/* MONTO */}
                            <FormControl isRequired>
                                <FormLabel>
                                    <HStack spacing={2}>
                                        <FiDollarSign size={16} />
                                        <Text>Monto (S/)</Text>
                                    </HStack>
                                </FormLabel>
                                <NumberInput
                                    value={formData.amount}
                                    onChange={(value) => handleInputChange('amount', value)}
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                >
                                    <NumberInputField placeholder="0.00" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            {/* CATEGORÍA */}
                            <FormControl isRequired={formData.transaction_type === 'OUT'}>
                                <FormLabel>
                                    <HStack spacing={2}>
                                        <FiTag size={16} />
                                        <Text>
                                            Categoría
                                            {formData.transaction_type === 'OUT' && ' *'}
                                        </Text>
                                    </HStack>
                                </FormLabel>
                                <Select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    placeholder="Selecciona categoría"
                                >
                                    {Object.entries(currentCategories).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* DESCRIPCIÓN */}
                            <FormControl>
                                <FormLabel>
                                    <HStack spacing={2}>
                                        <FiFileText size={16} />
                                        <Text>Descripción (opcional)</Text>
                                    </HStack>
                                </FormLabel>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder={
                                        formData.transaction_type === 'IN'
                                            ? 'Ej: Sueldo mensual, venta, etc.'
                                            : 'Ej: Supermercado, transporte, etc.'
                                    }
                                />
                            </FormControl>

                            {/* BOTÓN DE ENVÍO */}
                            <Button
                                type="submit"
                                colorScheme={formData.transaction_type === 'IN' ? 'green' : 'red'}
                                size="lg"
                                isLoading={isLoading}
                                loadingText="Registrando..."
                                leftIcon={<FiPlus />}
                                width="full"
                                mt={2}
                            >
                                Registrar {formData.transaction_type === 'IN' ? 'Ingreso' : 'Gasto'}
                            </Button>

                            {/* INFO ADICIONAL */}
                            <Alert status="info" size="sm" borderRadius="md">
                                <AlertIcon />
                                <Text fontSize="sm">
                                    {formData.transaction_type === 'IN'
                                        ? '💰 Registra tus ingresos para un mejor control'
                                        : '💡 Categoriza tus gastos para mejores reportes'
                                    }
                                </Text>
                            </Alert>
                        </VStack>
                    </form>
                </VStack>
            </CardBody>
        </Card>
    );
};

// ✅ COMPONENTE PRINCIPAL DE TRANSACCIONES (Página completa)
export default function Transactions() {
    const { user, isPremium } = useAuth();
    const toast = useToast();

    const [state, setState] = useState({
        transactions: [],
        filteredTransactions: [],
        loading: true,
        filterPeriod: 'all',
        searchTerm: '',
        selectedCategory: 'all'
    });

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingTransaction, setEditingTransaction] = useState(null);

    // ✅ CARGA DE TRANSACCIONES
    const loadTransactions = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const transactions = await api.getTransactions();
            setState(prev => ({
                ...prev,
                transactions: Array.isArray(transactions) ? transactions : [],
                filteredTransactions: Array.isArray(transactions) ? transactions : [],
                loading: false
            }));
        } catch (error) {
            console.error('Error cargando transacciones:', error);
            toast({
                title: '❌ Error',
                description: 'No se pudieron cargar las transacciones',
                status: 'error',
                duration: 3000,
            });
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [toast]);

    // ✅ EFECTO DE CARGA INICIAL
    React.useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // ✅ MANEJADOR PARA TRANSACCIÓN GUARDADA
    const handleTransactionSaved = useCallback(() => {
        loadTransactions();
    }, [loadTransactions]);

    // ✅ ESTADÍSTICAS
    const statistics = useMemo(() => {
        const transactions = state.filteredTransactions.length > 0
            ? state.filteredTransactions
            : state.transactions;

        const totals = transactions.reduce((acc, tx) => {
            const amount = Number(tx.amount) || 0;
            if (tx.transaction_type === 'IN') {
                acc.income += amount;
                acc.incomeCount++;
            } else {
                acc.expense += amount;
                acc.expenseCount++;
            }
            return acc;
        }, { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 });

        return {
            ...totals,
            balance: totals.income - totals.expense,
            totalCount: transactions.length
        };
    }, [state.filteredTransactions, state.transactions]);

    return (
        <Box minH="100vh" bg="gray.50" py={8}>
            <Box maxW="6xl" mx="auto" px={4}>
                <VStack spacing={8} align="stretch">
                    {/* HEADER */}
                    <VStack spacing={4} align="start">
                        <HStack spacing={4} align="center">
                            <Box
                                w={16}
                                h={16}
                                bg="blue.500"
                                borderRadius="xl"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                color="white"
                            >
                                <FiBarChart2 size={28} />
                            </Box>
                            <VStack spacing={1} align="start">
                                <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                                    Mis Transacciones
                                </Text>
                                <Text color="gray.600" fontSize="lg">
                                    Gestiona todos tus movimientos financieros
                                </Text>
                            </VStack>
                        </HStack>

                        {/* RESUMEN RÁPIDO */}
                        <HStack spacing={6} flexWrap="wrap">
                            <StatBadge
                                label="Total"
                                value={statistics.totalCount}
                                colorScheme="blue"
                            />
                            <StatBadge
                                label="Ingresos"
                                value={`S/ ${statistics.income.toFixed(2)}`}
                                colorScheme="green"
                            />
                            <StatBadge
                                label="Gastos"
                                value={`S/ ${statistics.expense.toFixed(2)}`}
                                colorScheme="red"
                            />
                            <StatBadge
                                label="Balance"
                                value={`S/ ${statistics.balance.toFixed(2)}`}
                                colorScheme={statistics.balance >= 0 ? "green" : "orange"}
                            />
                        </HStack>
                    </VStack>

                    {/* CONTENIDO PRINCIPAL */}
                    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
                        {/* FORMULARIO */}
                        <GridItem>
                            <TransactionForm
                                onTransactionSaved={handleTransactionSaved}
                                currentTransactionCount={state.transactions.length}
                            />
                        </GridItem>

                        {/* LISTA DE TRANSACCIONES */}
                        <GridItem>
                            <Card shadow="md" border="1px" borderColor="gray.200">
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <HStack justify="space-between">
                                            <Text fontSize="xl" fontWeight="bold">
                                                Historial Reciente
                                            </Text>
                                            <Button
                                                leftIcon={<FiRefreshCw />}
                                                onClick={loadTransactions}
                                                size="sm"
                                                variant="outline"
                                                isLoading={state.loading}
                                            >
                                                Actualizar
                                            </Button>
                                        </HStack>

                                        {state.loading ? (
                                            <Text textAlign="center" color="gray.500" py={8}>
                                                Cargando transacciones...
                                            </Text>
                                        ) : state.transactions.length === 0 ? (
                                            <VStack spacing={3} py={8} color="gray.500">
                                                <FiBarChart2 size={48} />
                                                <Text textAlign="center">
                                                    No hay transacciones registradas
                                                </Text>
                                                <Text fontSize="sm" textAlign="center">
                                                    Comienza agregando tu primera transacción
                                                </Text>
                                            </VStack>
                                        ) : (
                                            <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                                                {state.transactions.slice(0, 10).map((transaction, index) => (
                                                    <TransactionItem
                                                        key={transaction.id || index}
                                                        transaction={transaction}
                                                        onEdit={(tx) => {
                                                            setEditingTransaction(tx);
                                                            onOpen();
                                                        }}
                                                    />
                                                ))}
                                            </VStack>
                                        )}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </GridItem>
                    </Grid>
                </VStack>
            </Box>

            {/* MODAL DE EDICIÓN (SIMPLIFICADO) */}
            <Modal isOpen={isOpen} onClose={onClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Editar Transacción</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>Funcionalidad de edición en desarrollo...</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Cerrar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

// ✅ COMPONENTES AUXILIARES
const StatBadge = ({ label, value, colorScheme = "blue" }) => (
    <VStack spacing={1} align="center">
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
            {label}
        </Text>
        <Badge
            colorScheme={colorScheme}
            fontSize="md"
            px={3}
            py={1}
            borderRadius="full"
        >
            {value}
        </Badge>
    </VStack>
);

const TransactionItem = ({ transaction, onEdit }) => {
    const isIncome = transaction.transaction_type === 'IN';
    const amountColor = isIncome ? "green.600" : "red.600";
    const amountPrefix = isIncome ? "+" : "-";

    return (
        <Card
            size="sm"
            variant="outline"
            _hover={{ bg: 'gray.50', shadow: 'sm' }}
            transition="all 0.2s"
        >
            <CardBody py={2}>
                <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="medium" fontSize="sm">
                            {transaction.description || 'Sin descripción'}
                        </Text>
                        <HStack spacing={2}>
                            <Badge
                                colorScheme={isIncome ? "green" : "red"}
                                fontSize="2xs"
                            >
                                {isIncome ? "INGRESO" : "GASTO"}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                                {new Date(transaction.date).toLocaleDateString('es-ES')}
                            </Text>
                        </HStack>
                    </VStack>

                    <HStack spacing={2}>
                        <Text
                            fontWeight="bold"
                            color={amountColor}
                            fontSize="md"
                        >
                            {amountPrefix} S/ {Number(transaction.amount).toFixed(2)}
                        </Text>
                        <Tooltip label="Editar transacción">
                            <IconButton
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(transaction)}
                                aria-label="Editar"
                            />
                        </Tooltip>
                    </HStack>
                </HStack>
            </CardBody>
        </Card>
    );
};

export default Transactions;