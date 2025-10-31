// src/components/dashboard/QuickAccountsPanel/index.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    Box, Button, Card, CardBody, VStack, HStack, Text, Input,
    Table, Thead, Tbody, Tr, Th, Td, useToast, IconButton,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, useDisclosure, Textarea,
    Badge, Flex, Alert, AlertIcon, AlertTitle, AlertDescription,
    Tooltip, Grid, GridItem, NumberInput, NumberInputField,
    NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Select, FormControl, FormLabel, Tabs, TabList, TabPanels, Tab, TabPanel,
    SimpleGrid
} from '@chakra-ui/react';
import {
    FiPlus, FiTrash2, FiShare2, FiDollarSign,
    FiCamera, FiCopy, FiCheck, FiEdit, FiX,
    FiTrendingUp, FiTrendingDown, FiCreditCard,
    FiStar
} from 'react-icons/fi';

// ✅ CONSTANTES Y CONFIGURACIÓN
const EXPENSE_CATEGORIES = {
    AL: 'Alimentación',
    TR: 'Transporte',
    SE: 'Servicios',
    MA: 'Materiales',
    AC: 'Actividades',
    SA: 'Salud',
    ED: 'Educación',
    EN: 'Entretenimiento',
    VI: 'Vivienda',
    OT: 'Otros Gastos'
};

const PREMIUM_CATEGORIES = {
    ...EXPENSE_CATEGORIES,
    IN: 'Inversiones',
    TA: 'Impuestos',
    SU: 'Suscripciones',
    DO: 'Donaciones',
    DE: 'Deudas',
    SE: 'Seguros'
};

const CURRENCIES = {
    PEN: { symbol: 'S/.', name: 'Soles' },
    USD: { symbol: '$', name: 'Dólares' },
    EUR: { symbol: '€', name: 'Euros' },
    GBP: { symbol: '£', name: 'Libras' }
};

const INITIAL_STATE = {
    quickAccount: { title: '', description: '', currency: 'PEN' },
    entries: [],
    expenses: [],
    currentEntry: { name: '', amount: '', type: 'income', note: '' },
    currentExpense: { concept: '', amount: '', category: 'OT', paid: false, note: '' }
};

// ✅ HOOK PARA PERSISTENCIA - CORREGIDO
const useQuickAccountsStorage = (isPremium = false) => {
    const [state, setState] = useState(INITIAL_STATE);
    const [isInitialized, setIsInitialized] = useState(false);

    // ✅ CORREGIDO: Cargar datos solo una vez al inicializar
    useEffect(() => {
        if (isInitialized) return;

        try {
            const saved = localStorage.getItem('quickAccountsData');
            if (saved) {
                const data = JSON.parse(saved);
                setState(prev => ({
                    ...prev,
                    quickAccount: data.quickAccount || prev.quickAccount,
                    entries: data.entries || prev.entries,
                    expenses: data.expenses || prev.expenses
                }));
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        } finally {
            setIsInitialized(true);
        }
    }, [isInitialized]);

    // ✅ CORREGIDO: Guardar datos solo cuando haya cambios reales
    const saveData = useCallback((newState) => {
        const dataToSave = {
            quickAccount: newState.quickAccount,
            entries: newState.entries,
            expenses: newState.expenses,
            timestamp: new Date().toISOString(),
            isPremium: isPremium
        };
        localStorage.setItem('quickAccountsData', JSON.stringify(dataToSave));
    }, [isPremium]);

    // ✅ CORREGIDO: Solo guardar cuando los arrays cambien (no en cada render)
    const stableSetState = useCallback((updater) => {
        setState(prevState => {
            const newState = typeof updater === 'function' ? updater(prevState) : updater;

            // Solo guardar si hay cambios reales en entries o expenses
            const entriesChanged = JSON.stringify(prevState.entries) !== JSON.stringify(newState.entries);
            const expensesChanged = JSON.stringify(prevState.expenses) !== JSON.stringify(newState.expenses);
            const accountChanged = JSON.stringify(prevState.quickAccount) !== JSON.stringify(newState.quickAccount);

            if (entriesChanged || expensesChanged || accountChanged) {
                saveData(newState);
            }

            return newState;
        });
    }, [saveData]);

    return [state, stableSetState, isInitialized];
};

// ✅ HOOK PARA OPERACIONES - CORREGIDO
const useQuickAccountsOperations = (state, setState, isPremium = false) => {
    const toast = useToast();

    // Funciones de validación
    const validateEntry = (entry) => {
        const errors = [];
        if (!entry.name?.trim()) errors.push('Nombre es requerido');
        if (!entry.amount || parseFloat(entry.amount) <= 0) errors.push('Monto debe ser mayor a 0');
        if (entry.amount > 1000000) errors.push('Monto demasiado grande');
        return errors;
    };

    const validateExpense = (expense) => {
        const errors = [];
        if (!expense.concept?.trim()) errors.push('Concepto es requerido');
        if (!expense.amount || parseFloat(expense.amount) <= 0) errors.push('Monto debe ser mayor a 0');
        if (expense.amount > 1000000) errors.push('Monto demasiado grande');
        return errors;
    };

    // ✅ CORREGIDO: useCallbacks estables
    const addEntry = useCallback(() => {
        const errors = validateEntry(state.currentEntry);
        if (errors.length > 0) {
            toast({
                title: 'Datos incompletos',
                description: errors.join(', '),
                status: 'warning',
                duration: 2000
            });
            return;
        }

        const newEntry = {
            id: Date.now().toString(),
            name: state.currentEntry.name.trim(),
            amount: Math.abs(parseFloat(state.currentEntry.amount)),
            type: 'income',
            note: state.currentEntry.note.trim(),
            date: new Date().toISOString(),
            isPremium: isPremium
        };

        setState(prev => ({
            ...prev,
            entries: [...prev.entries, newEntry],
            currentEntry: { name: '', amount: '', type: 'income', note: '' }
        }));

        toast({
            title: 'Ingreso agregado',
            status: 'success',
            duration: 1500
        });
    }, [state.currentEntry, toast, isPremium, setState]);

    const addExpense = useCallback(() => {
        const errors = validateExpense(state.currentExpense);
        if (errors.length > 0) {
            toast({
                title: 'Datos incompletos',
                description: errors.join(', '),
                status: 'warning',
                duration: 2000
            });
            return;
        }

        const newExpense = {
            id: Date.now().toString() + '-expense',
            concept: state.currentExpense.concept.trim(),
            amount: Math.abs(parseFloat(state.currentExpense.amount)),
            category: state.currentExpense.category,
            paid: state.currentExpense.paid,
            note: state.currentExpense.note.trim(),
            date: new Date().toISOString(),
            isPremium: isPremium
        };

        setState(prev => ({
            ...prev,
            expenses: [...prev.expenses, newExpense],
            currentExpense: { concept: '', amount: '', category: 'OT', paid: false, note: '' }
        }));

        toast({
            title: 'Gasto agregado',
            status: 'success',
            duration: 1500
        });
    }, [state.currentExpense, toast, isPremium, setState]);

    const removeEntry = useCallback((id) => {
        if (id.includes('-expense')) {
            setState(prev => ({
                ...prev,
                expenses: prev.expenses.filter(expense => expense.id !== id)
            }));
        } else {
            setState(prev => ({
                ...prev,
                entries: prev.entries.filter(entry => entry.id !== id)
            }));
        }
        toast({
            title: 'Eliminado',
            status: 'info',
            duration: 1500
        });
    }, [toast, setState]);

    const toggleExpensePaid = useCallback((id) => {
        setState(prev => ({
            ...prev,
            expenses: prev.expenses.map(expense =>
                expense.id === id ? { ...expense, paid: !expense.paid } : expense
            )
        }));
    }, [setState]);

    const clearAllData = useCallback(() => {
        setState(INITIAL_STATE);
        localStorage.removeItem('quickAccountsData');
        toast({
            title: '✅ Todo eliminado',
            description: 'Todos los registros han sido eliminados',
            status: 'info',
            duration: 3000,
        });
    }, [toast, setState]);

    return {
        addEntry,
        addExpense,
        removeEntry,
        toggleExpensePaid,
        clearAllData,
        validateEntry,
        validateExpense
    };
};

// ✅ COMPONENTE DE TABLA DE INGRESOS
const EntriesTable = ({ entries, onEdit, onDelete, currency, isPremium = false }) => {
    const currencySymbol = CURRENCIES[currency]?.symbol || '$';

    return (
        <Box overflowX="auto">
            <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th px={2} py={1}>Concepto</Th>
                        <Th px={2} py={1} textAlign="center">Monto</Th>
                        <Th px={2} py={1} textAlign="center">Nota</Th>
                        {isPremium && <Th px={2} py={1} textAlign="center">Premium</Th>}
                        <Th px={2} py={1} textAlign="center">Acciones</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {entries.map((entry) => (
                        <Tr key={entry.id} _hover={{ bg: 'gray.50' }}>
                            <Td px={2} py={1} fontWeight="medium">
                                <HStack spacing={2}>
                                    <Text>{entry.name}</Text>
                                    {entry.isPremium && (
                                        <Badge colorScheme="purple" fontSize="xs">
                                            ⭐
                                        </Badge>
                                    )}
                                </HStack>
                            </Td>
                            <Td px={2} py={1} textAlign="center" fontWeight="bold" color="green.600">
                                {currencySymbol} {entry.amount.toFixed(2)}
                            </Td>
                            <Td px={2} py={1} textAlign="center">
                                <Text fontSize="xs" color="gray.600">
                                    {entry.note || '-'}
                                </Text>
                            </Td>
                            {isPremium && (
                                <Td px={2} py={1} textAlign="center">
                                    {entry.isPremium ? (
                                        <Badge colorScheme="purple" fontSize="xs">
                                            PREMIUM
                                        </Badge>
                                    ) : (
                                        <Text fontSize="xs" color="gray.400">-</Text>
                                    )}
                                </Td>
                            )}
                            <Td px={2} py={1} textAlign="center">
                                <HStack spacing={1} justify="center">
                                    <Tooltip label="Editar">
                                        <IconButton
                                            icon={<FiEdit />}
                                            onClick={() => onEdit(entry)}
                                            variant="ghost"
                                            colorScheme="blue"
                                            size="xs"
                                            aria-label="Editar"
                                        />
                                    </Tooltip>
                                    <Tooltip label="Eliminar">
                                        <IconButton
                                            icon={<FiTrash2 />}
                                            onClick={() => onDelete(entry.id)}
                                            variant="ghost"
                                            colorScheme="red"
                                            size="xs"
                                            aria-label="Eliminar"
                                        />
                                    </Tooltip>
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

// ✅ COMPONENTE DE TABLA DE GASTOS
const ExpensesTable = ({ expenses, onEdit, onDelete, onTogglePaid, currency, isPremium = false }) => {
    const currencySymbol = CURRENCIES[currency]?.symbol || '$';
    const categories = isPremium ? PREMIUM_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <Box overflowX="auto">
            <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th px={2} py={1}>Concepto</Th>
                        <Th px={2} py={1} textAlign="center">Monto</Th>
                        <Th px={2} py={1} textAlign="center">Categoría</Th>
                        <Th px={2} py={1} textAlign="center">Estado</Th>
                        <Th px={2} py={1} textAlign="center">Nota</Th>
                        {isPremium && <Th px={2} py={1} textAlign="center">Premium</Th>}
                        <Th px={2} py={1} textAlign="center">Acciones</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {expenses.map((expense) => (
                        <Tr key={expense.id} _hover={{ bg: 'gray.50' }}>
                            <Td px={2} py={1} fontWeight="medium">
                                <HStack spacing={2}>
                                    <Text>{expense.concept}</Text>
                                    {expense.isPremium && (
                                        <Badge colorScheme="purple" fontSize="xs">
                                            ⭐
                                        </Badge>
                                    )}
                                </HStack>
                            </Td>
                            <Td px={2} py={1} textAlign="center" fontWeight="bold" color="red.600">
                                {currencySymbol} {expense.amount.toFixed(2)}
                            </Td>
                            <Td px={2} py={1} textAlign="center">
                                <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                                    {categories[expense.category] || expense.category}
                                </Badge>
                            </Td>
                            <Td px={2} py={1} textAlign="center">
                                <Badge
                                    colorScheme={expense.paid ? "green" : "orange"}
                                    cursor="pointer"
                                    onClick={() => onTogglePaid(expense.id)}
                                    _hover={{ opacity: 0.8 }}
                                    size="sm"
                                >
                                    {expense.paid ? "✅ Pagado" : "⏳ Pendiente"}
                                </Badge>
                            </Td>
                            <Td px={2} py={1} textAlign="center">
                                <Text fontSize="xs" color="gray.600">
                                    {expense.note || '-'}
                                </Text>
                            </Td>
                            {isPremium && (
                                <Td px={2} py={1} textAlign="center">
                                    {expense.isPremium ? (
                                        <Badge colorScheme="purple" fontSize="xs">
                                            PREMIUM
                                        </Badge>
                                    ) : (
                                        <Text fontSize="xs" color="gray.400">-</Text>
                                    )}
                                </Td>
                            )}
                            <Td px={2} py={1} textAlign="center">
                                <HStack spacing={1} justify="center">
                                    <Tooltip label="Editar">
                                        <IconButton
                                            icon={<FiEdit />}
                                            onClick={() => onEdit(expense)}
                                            variant="ghost"
                                            colorScheme="blue"
                                            size="xs"
                                            aria-label="Editar"
                                        />
                                    </Tooltip>
                                    <Tooltip label="Eliminar">
                                        <IconButton
                                            icon={<FiTrash2 />}
                                            onClick={() => onDelete(expense.id)}
                                            variant="ghost"
                                            colorScheme="red"
                                            size="xs"
                                            aria-label="Eliminar"
                                        />
                                    </Tooltip>
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

// ✅ COMPONENTE DE RESUMEN
const QuickSummary = ({ totals, currency, isPremium }) => {
    const currencySymbol = CURRENCIES[currency]?.symbol || '$';

    const metrics = [
        {
            label: 'INGRESOS',
            value: totals.totalIncome,
            color: 'green',
            icon: FiTrendingUp
        },
        {
            label: 'GASTOS',
            value: totals.totalExpenses,
            color: 'red',
            icon: FiTrendingDown
        },
        {
            label: 'NETO',
            value: totals.netBalance,
            color: totals.netBalance >= 0 ? 'green' : 'red',
            icon: FiDollarSign
        },
        {
            label: 'DISPONIBLE',
            value: totals.availableBalance,
            color: 'purple',
            icon: FiCreditCard,
            premium: true
        }
    ];

    const MetricCard = ({ metric }) => (
        <VStack spacing={1} align="center" p={2} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
            <Badge colorScheme={metric.color} variant="subtle" fontSize="xs">
                <HStack spacing={1}>
                    <metric.icon size={10} />
                    <Text>{metric.label}</Text>
                </HStack>
            </Badge>
            <Text fontWeight="bold" color={`${metric.color}.600`} fontSize="sm">
                {currencySymbol} {metric.value.toFixed(2)}
            </Text>
        </VStack>
    );

    return (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
            {metrics.filter(metric => !metric.premium || isPremium).map((metric, index) => (
                <MetricCard key={index} metric={metric} />
            ))}
        </SimpleGrid>
    );
};

// ✅ COMPONENTE PRINCIPAL - CORREGIDO
const QuickAccountsPanel = ({ onDataChange, isPremium = false }) => {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isSharing, setIsSharing] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    // ✅ CORREGIDO: Usar hooks corregidos
    const [state, setState, isInitialized] = useQuickAccountsStorage(isPremium);
    const {
        addEntry,
        addExpense,
        removeEntry,
        toggleExpensePaid,
        clearAllData
    } = useQuickAccountsOperations(state, setState, isPremium);

    const reportRef = useRef();
    const categories = isPremium ? PREMIUM_CATEGORIES : EXPENSE_CATEGORIES;

    // ✅ CORREGIDO: useEffect con dependencias controladas
    const lastDataRef = useRef({ entries: [], expenses: [] });

    useEffect(() => {
        if (!onDataChange || !isInitialized) return;

        const currentData = { entries: state.entries, expenses: state.expenses };
        const lastData = lastDataRef.current;

        // Solo notificar si hay cambios reales
        const entriesChanged = JSON.stringify(lastData.entries) !== JSON.stringify(currentData.entries);
        const expensesChanged = JSON.stringify(lastData.expenses) !== JSON.stringify(currentData.expenses);

        if (entriesChanged || expensesChanged) {
            const hasEntries = state.entries.length > 0 || state.expenses.length > 0;
            onDataChange(hasEntries, [...state.entries, ...state.expenses]);
            lastDataRef.current = currentData;
        }
    }, [state.entries, state.expenses, onDataChange, isInitialized]);

    // ✅ CORREGIDO: useMemo con lógica más eficiente
    const totals = useMemo(() => {
        if (!isInitialized) {
            return {
                totalIncome: 0,
                totalExpenses: 0,
                paidExpenses: 0,
                pendingExpenses: 0,
                netBalance: 0,
                availableBalance: 0,
                totalParticipants: 0,
                totalExpensesCount: 0,
                premiumEntries: 0,
                premiumExpenses: 0
            };
        }

        const totalIncome = state.entries.reduce((sum, entry) => sum + entry.amount, 0);
        const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const paidExpenses = state.expenses
            .filter(expense => expense.paid)
            .reduce((sum, expense) => sum + expense.amount, 0);
        const pendingExpenses = totalExpenses - paidExpenses;
        const netBalance = totalIncome - totalExpenses;
        const availableBalance = totalIncome - paidExpenses;

        return {
            totalIncome,
            totalExpenses,
            paidExpenses,
            pendingExpenses,
            netBalance,
            availableBalance,
            totalParticipants: state.entries.length,
            totalExpensesCount: state.expenses.length,
            premiumEntries: state.entries.filter(entry => entry.isPremium).length,
            premiumExpenses: state.expenses.filter(expense => expense.isPremium).length
        };
    }, [state.entries, state.expenses, isInitialized]);

    // ✅ MANEJO DE EDICIÓN MEJORADO
    const startEditEntry = useCallback((item) => {
        setEditingEntry({ ...item, amount: item.amount.toString() });
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingEntry(null);
    }, []);

    const updateEntry = useCallback(() => {
        if (!editingEntry || !editingEntry.name?.trim() || !editingEntry.amount) {
            toast({
                title: 'Datos incompletos',
                description: 'Nombre y monto son requeridos',
                status: 'warning',
                duration: 2000,
            });
            return;
        }

        if (editingEntry.id.includes('-expense')) {
            setState(prev => ({
                ...prev,
                expenses: prev.expenses.map(expense =>
                    expense.id === editingEntry.id
                        ? {
                            ...editingEntry,
                            amount: Math.abs(parseFloat(editingEntry.amount))
                        }
                        : expense
                )
            }));
        } else {
            setState(prev => ({
                ...prev,
                entries: prev.entries.map(entry =>
                    entry.id === editingEntry.id
                        ? {
                            ...editingEntry,
                            amount: Math.abs(parseFloat(editingEntry.amount))
                        }
                        : entry
                )
            }));
        }

        setEditingEntry(null);
        toast({
            title: 'Actualizado',
            status: 'success',
            duration: 1500,
        });
    }, [editingEntry, toast, setState]);

    // ✅ GENERACIÓN DE REPORTES
    const generateShareText = useCallback(() => {
        const currencySymbol = CURRENCIES[state.quickAccount.currency]?.symbol || '$';

        let text = `💵 *${state.quickAccount.title || 'Cuenta Rápida'}*\n`;
        if (state.quickAccount.description) {
            text += `📝 ${state.quickAccount.description}\n`;
        }

        if (isPremium) {
            text += `⭐ *Cuenta Premium - Funciones Avanzadas*\n`;
        }

        text += `\n`;
        text += `💰 *Total Recaudado:* ${currencySymbol} ${totals.totalIncome.toFixed(2)}\n`;
        text += `💳 *Total Gastos:* ${currencySymbol} ${totals.totalExpenses.toFixed(2)}\n`;
        text += `✅ *Gastos Pagados:* ${currencySymbol} ${totals.paidExpenses.toFixed(2)}\n`;
        text += `⏳ *Gastos Pendientes:* ${currencySymbol} ${totals.pendingExpenses.toFixed(2)}\n`;
        text += `⚖️ *Balance Neto:* ${currencySymbol} ${totals.netBalance.toFixed(2)}\n`;
        text += `💎 *Disponible:* ${currencySymbol} ${totals.availableBalance.toFixed(2)}\n`;
        text += `\n`;

        if (state.entries.length > 0) {
            text += `*INGRESOS (${state.entries.length}):*\n`;
            state.entries.forEach((entry, index) => {
                const premiumIndicator = entry.isPremium ? ' ⭐' : '';
                text += `${index + 1}. ${entry.name}: ${currencySymbol} ${entry.amount.toFixed(2)}${premiumIndicator}\n`;
                if (entry.note) {
                    text += `   📌 ${entry.note}\n`;
                }
            });
            text += `\n`;
        }

        if (state.expenses.length > 0) {
            text += `*GASTOS (${state.expenses.length}):*\n`;
            state.expenses.forEach((expense, index) => {
                const status = expense.paid ? '✅' : '❌';
                const premiumIndicator = expense.isPremium ? ' ⭐' : '';
                text += `${index + 1}. ${expense.concept}: ${currencySymbol} ${expense.amount.toFixed(2)} ${status}${premiumIndicator}\n`;
                if (expense.note) {
                    text += `   📌 ${expense.note}\n`;
                }
            });
        }

        text += `\n`;
        text += `_Generado con FinanzApp 📱_`;
        if (isPremium) {
            text += ` _| Cuenta Premium_`;
        }

        return text;
    }, [state.quickAccount, state.entries, state.expenses, totals, isPremium]);

    const shareViaWhatsApp = useCallback(() => {
        const text = generateShareText();
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }, [generateShareText]);

    const copyToClipboard = useCallback(async () => {
        try {
            const text = generateShareText();
            await navigator.clipboard.writeText(text);
            setHasCopied(true);
            toast({
                title: 'Copiado',
                description: 'Texto copiado al portapapeles',
                status: 'success',
                duration: 2000,
            });
            setTimeout(() => setHasCopied(false), 3000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo copiar al portapapeles',
                status: 'error',
                duration: 2000,
            });
        }
    }, [generateShareText, toast]);

    const generateImage = useCallback(async () => {
        toast({
            title: 'Función en desarrollo',
            description: 'La generación de imágenes estará disponible pronto',
            status: 'info',
            duration: 2000,
        });
    }, [toast]);

    // Si no está inicializado, mostrar loading
    if (!isInitialized) {
        return (
            <Box p={4} textAlign="center">
                <Text>Cargando cuenta rápida...</Text>
            </Box>
        );
    }

    const hasData = state.entries.length > 0 || state.expenses.length > 0;

    return (
        <Box p={0} m={0}>
            {/* ✅ Badge Premium */}
            {isPremium && (
                <Flex justify="flex-end" mb={3}>
                    <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                        <HStack spacing={1}>
                            <FiStar size={12} />
                            <Text>CUENTA PREMIUM</Text>
                        </HStack>
                    </Badge>
                </Flex>
            )}

            {/* Tarjeta Principal */}
            <Card shadow="none" border="none" bg="transparent">
                <CardBody p={0} m={0}>
                    <VStack spacing={4} align="stretch">
                        {/* Información de la Cuenta */}
                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
                                    Título de la cuenta
                                    {isPremium && (
                                        <Badge colorScheme="purple" ml={2} fontSize="xs">
                                            PREMIUM
                                        </Badge>
                                    )}
                                </FormLabel>
                                <Input
                                    value={state.quickAccount.title}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        quickAccount: {
                                            ...prev.quickAccount,
                                            title: e.target.value
                                        }
                                    }))}
                                    placeholder="Ej: Cuota Colegio Marzo 2024"
                                    size="sm"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
                                    Moneda
                                </FormLabel>
                                <Select
                                    value={state.quickAccount.currency}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        quickAccount: {
                                            ...prev.quickAccount,
                                            currency: e.target.value
                                        }
                                    }))}
                                    size="sm"
                                >
                                    <option value="PEN">Soles (S/.)</option>
                                    <option value="USD">Dólares ($)</option>
                                    {isPremium && <option value="EUR">Euros (€)</option>}
                                    {isPremium && <option value="GBP">Libras (£)</option>}
                                </Select>
                            </FormControl>
                        </Grid>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
                                Descripción (opcional)
                            </FormLabel>
                            <Textarea
                                value={state.quickAccount.description}
                                onChange={(e) => setState(prev => ({
                                    ...prev,
                                    quickAccount: {
                                        ...prev.quickAccount,
                                        description: e.target.value
                                    }
                                }))}
                                placeholder="Ej: Cuota mensual para materiales escolares..."
                                size="sm"
                                rows={2}
                            />
                        </FormControl>

                        {/* Tabs para Ingresos y Gastos */}
                        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="blue" size="sm">
                            <TabList>
                                <Tab fontSize="sm">
                                    <HStack spacing={2}>
                                        <FiTrendingUp size={14} />
                                        <Text>Ingresos ({state.entries.length})</Text>
                                        {isPremium && totals.premiumEntries > 0 && (
                                            <Badge colorScheme="purple" fontSize="xs">
                                                ⭐
                                            </Badge>
                                        )}
                                    </HStack>
                                </Tab>
                                <Tab fontSize="sm">
                                    <HStack spacing={2}>
                                        <FiTrendingDown size={14} />
                                        <Text>Gastos ({state.expenses.length})</Text>
                                        {isPremium && totals.premiumExpenses > 0 && (
                                            <Badge colorScheme="purple" fontSize="xs">
                                                ⭐
                                            </Badge>
                                        )}
                                    </HStack>
                                </Tab>
                            </TabList>

                            <TabPanels>
                                {/* Panel de INGRESOS */}
                                <TabPanel px={0} pt={4}>
                                    <Card variant="outline" size="sm" mb={4}>
                                        <CardBody p={3}>
                                            <VStack spacing={3} align="stretch">
                                                <Text fontWeight="medium" fontSize="sm">
                                                    {editingEntry ? 'Editar Ingreso' : 'Agregar Ingreso'}
                                                    {isPremium && (
                                                        <Badge colorScheme="purple" ml={2} fontSize="xs">
                                                            PREMIUM
                                                        </Badge>
                                                    )}
                                                </Text>

                                                <Grid templateColumns={{ base: '1fr', md: '2fr 1fr auto' }} gap={2}>
                                                    <Input
                                                        value={editingEntry ? editingEntry.name : state.currentEntry.name}
                                                        onChange={(e) => editingEntry
                                                            ? setEditingEntry(prev => ({ ...prev, name: e.target.value }))
                                                            : setState(prev => ({
                                                                ...prev,
                                                                currentEntry: {
                                                                    ...prev.currentEntry,
                                                                    name: e.target.value
                                                                }
                                                            }))
                                                        }
                                                        placeholder="Nombre o concepto del ingreso"
                                                        size="sm"
                                                    />

                                                    <NumberInput
                                                        value={editingEntry ? editingEntry.amount : state.currentEntry.amount}
                                                        onChange={(value) => editingEntry
                                                            ? setEditingEntry(prev => ({ ...prev, amount: value }))
                                                            : setState(prev => ({
                                                                ...prev,
                                                                currentEntry: {
                                                                    ...prev.currentEntry,
                                                                    amount: value
                                                                }
                                                            }))
                                                        }
                                                        min={0}
                                                        step={0.01}
                                                        size="sm"
                                                    >
                                                        <NumberInputField placeholder="Monto" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>

                                                    <Button
                                                        leftIcon={editingEntry ? <FiEdit /> : <FiPlus />}
                                                        onClick={editingEntry ? updateEntry : addEntry}
                                                        colorScheme={editingEntry ? "green" : "blue"}
                                                        size="sm"
                                                        flexShrink={0}
                                                    >
                                                        {editingEntry ? 'Actualizar' : 'Agregar'}
                                                    </Button>
                                                </Grid>

                                                <Input
                                                    value={editingEntry ? editingEntry.note : state.currentEntry.note}
                                                    onChange={(e) => editingEntry
                                                        ? setEditingEntry(prev => ({ ...prev, note: e.target.value }))
                                                        : setState(prev => ({
                                                            ...prev,
                                                            currentEntry: {
                                                                ...prev.currentEntry,
                                                                note: e.target.value
                                                            }
                                                        }))
                                                    }
                                                    placeholder="Nota adicional (opcional)"
                                                    size="sm"
                                                />

                                                {editingEntry && (
                                                    <Button
                                                        leftIcon={<FiX />}
                                                        onClick={cancelEdit}
                                                        variant="ghost"
                                                        size="xs"
                                                        colorScheme="gray"
                                                        alignSelf="flex-start"
                                                    >
                                                        Cancelar Edición
                                                    </Button>
                                                )}
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    {/* Tabla de Ingresos */}
                                    {state.entries.length > 0 ? (
                                        <EntriesTable
                                            entries={state.entries}
                                            onEdit={startEditEntry}
                                            onDelete={removeEntry}
                                            currency={state.quickAccount.currency}
                                            isPremium={isPremium}
                                        />
                                    ) : (
                                        <Alert status="info" borderRadius="md" size="sm">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle fontSize="sm">Sin ingresos registrados</AlertTitle>
                                                <AlertDescription fontSize="xs">
                                                    Agrega ingresos usando el formulario superior.
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </TabPanel>

                                {/* Panel de GASTOS */}
                                <TabPanel px={0} pt={4}>
                                    <Card variant="outline" size="sm" mb={4}>
                                        <CardBody p={3}>
                                            <VStack spacing={3} align="stretch">
                                                <Text fontWeight="medium" fontSize="sm">
                                                    {editingEntry ? 'Editar Gasto' : 'Agregar Gasto'}
                                                    {isPremium && (
                                                        <Badge colorScheme="purple" ml={2} fontSize="xs">
                                                            PREMIUM
                                                        </Badge>
                                                    )}
                                                </Text>

                                                <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr auto' }} gap={2}>
                                                    <Input
                                                        value={editingEntry ? editingEntry.concept : state.currentExpense.concept}
                                                        onChange={(e) => editingEntry
                                                            ? setEditingEntry(prev => ({ ...prev, concept: e.target.value }))
                                                            : setState(prev => ({
                                                                ...prev,
                                                                currentExpense: {
                                                                    ...prev.currentExpense,
                                                                    concept: e.target.value
                                                                }
                                                            }))
                                                        }
                                                        placeholder="Concepto del gasto"
                                                        size="sm"
                                                    />

                                                    <NumberInput
                                                        value={editingEntry ? editingEntry.amount : state.currentExpense.amount}
                                                        onChange={(value) => editingEntry
                                                            ? setEditingEntry(prev => ({ ...prev, amount: value }))
                                                            : setState(prev => ({
                                                                ...prev,
                                                                currentExpense: {
                                                                    ...prev.currentExpense,
                                                                    amount: value
                                                                }
                                                            }))
                                                        }
                                                        min={0}
                                                        step={0.01}
                                                        size="sm"
                                                    >
                                                        <NumberInputField placeholder="Monto" />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>

                                                    <Select
                                                        value={editingEntry ? editingEntry.category : state.currentExpense.category}
                                                        onChange={(e) => editingEntry
                                                            ? setEditingEntry(prev => ({ ...prev, category: e.target.value }))
                                                            : setState(prev => ({
                                                                ...prev,
                                                                currentExpense: {
                                                                    ...prev.currentExpense,
                                                                    category: e.target.value
                                                                }
                                                            }))
                                                        }
                                                        size="sm"
                                                    >
                                                        {Object.entries(categories).map(([key, label]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </Select>

                                                    <Select
                                                        value={editingEntry ? (editingEntry.paid ? 'paid' : 'pending') : (state.currentExpense.paid ? 'paid' : 'pending')}
                                                        onChange={(e) => editingEntry
                                                            ? setEditingEntry(prev => ({ ...prev, paid: e.target.value === 'paid' }))
                                                            : setState(prev => ({
                                                                ...prev,
                                                                currentExpense: {
                                                                    ...prev.currentExpense,
                                                                    paid: e.target.value === 'paid'
                                                                }
                                                            }))
                                                        }
                                                        size="sm"
                                                    >
                                                        <option value="pending">Pendiente</option>
                                                        <option value="paid">Pagado</option>
                                                    </Select>

                                                    <Button
                                                        leftIcon={editingEntry ? <FiEdit /> : <FiPlus />}
                                                        onClick={editingEntry ? updateEntry : addExpense}
                                                        colorScheme={editingEntry ? "green" : "red"}
                                                        size="sm"
                                                        flexShrink={0}
                                                    >
                                                        {editingEntry ? 'Actualizar' : 'Agregar'}
                                                    </Button>
                                                </Grid>

                                                <Input
                                                    value={editingEntry ? editingEntry.note : state.currentExpense.note}
                                                    onChange={(e) => editingEntry
                                                        ? setEditingEntry(prev => ({ ...prev, note: e.target.value }))
                                                        : setState(prev => ({
                                                            ...prev,
                                                            currentExpense: {
                                                                ...prev.currentExpense,
                                                                note: e.target.value
                                                            }
                                                        }))
                                                    }
                                                    placeholder="Nota adicional (opcional)"
                                                    size="sm"
                                                />

                                                {editingEntry && (
                                                    <Button
                                                        leftIcon={<FiX />}
                                                        onClick={cancelEdit}
                                                        variant="ghost"
                                                        size="xs"
                                                        colorScheme="gray"
                                                        alignSelf="flex-start"
                                                    >
                                                        Cancelar Edición
                                                    </Button>
                                                )}
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    {/* Tabla de Gastos */}
                                    {state.expenses.length > 0 ? (
                                        <ExpensesTable
                                            expenses={state.expenses}
                                            onEdit={startEditEntry}
                                            onDelete={removeEntry}
                                            onTogglePaid={toggleExpensePaid}
                                            currency={state.quickAccount.currency}
                                            isPremium={isPremium}
                                        />
                                    ) : (
                                        <Alert status="info" borderRadius="md" size="sm">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle fontSize="sm">Sin gastos registrados</AlertTitle>
                                                <AlertDescription fontSize="xs">
                                                    Agrega gastos usando el formulario superior.
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </TabPanel>
                            </TabPanels>
                        </Tabs>

                        {/* Resumen Rápido Mejorado */}
                        {hasData && (
                            <Card variant="outline" size="sm">
                                <CardBody p={3}>
                                    <VStack spacing={3} align="stretch">
                                        <Text fontWeight="medium" fontSize="sm">
                                            Resumen Rápido
                                        </Text>
                                        <QuickSummary
                                            totals={totals}
                                            currency={state.quickAccount.currency}
                                            isPremium={isPremium}
                                        />
                                    </VStack>
                                </CardBody>
                            </Card>
                        )}

                        {/* Botones de Acción */}
                        {hasData && (
                            <Card variant="outline" size="sm">
                                <CardBody p={3}>
                                    <VStack spacing={3} align="stretch">
                                        <Text fontWeight="medium" fontSize="sm">
                                            Compartir Reporte
                                        </Text>
                                        <HStack spacing={2} flexWrap="wrap">
                                            <Button
                                                leftIcon={<FiShare2 />}
                                                onClick={shareViaWhatsApp}
                                                colorScheme="whatsapp"
                                                size="sm"
                                                flex="1"
                                                minW="120px"
                                            >
                                                WhatsApp
                                            </Button>
                                            <Button
                                                leftIcon={hasCopied ? <FiCheck /> : <FiCopy />}
                                                onClick={copyToClipboard}
                                                colorScheme="blue"
                                                size="sm"
                                                flex="1"
                                                minW="120px"
                                            >
                                                {hasCopied ? 'Copiado!' : 'Copiar Texto'}
                                            </Button>
                                            <Button
                                                leftIcon={<FiCamera />}
                                                onClick={generateImage}
                                                isLoading={isSharing}
                                                loadingText="Generando..."
                                                colorScheme="purple"
                                                size="sm"
                                                flex="1"
                                                minW="120px"
                                            >
                                                Capturar Imagen
                                            </Button>
                                            <Button
                                                leftIcon={<FiTrash2 />}
                                                onClick={onOpen}
                                                colorScheme="red"
                                                variant="outline"
                                                size="sm"
                                                flex="1"
                                                minW="120px"
                                            >
                                                Limpiar Todo
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        )}
                    </VStack>
                </CardBody>
            </Card>

            {/* Modal de Confirmación para Limpiar Todo */}
            <Modal isOpen={isOpen} onClose={onClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirmar Eliminación</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={3} align="stretch">
                            <Alert status="warning" borderRadius="md">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>¿Estás seguro?</AlertTitle>
                                    <AlertDescription>
                                        Esta acción eliminará TODOS los registros de ingresos y gastos permanentemente.
                                        Esta acción no se puede deshacer.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                            <Text fontSize="sm" color="gray.600">
                                Se eliminarán:
                            </Text>
                            <VStack spacing={1} align="start" pl={4}>
                                <Text fontSize="sm">• {state.entries.length} ingresos registrados</Text>
                                <Text fontSize="sm">• {state.expenses.length} gastos registrados</Text>
                                <Text fontSize="sm">• Información de la cuenta rápida</Text>
                            </VStack>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <HStack spacing={3}>
                            <Button onClick={onClose} variant="ghost">
                                Cancelar
                            </Button>
                            <Button onClick={clearAllData} colorScheme="red">
                                Sí, Eliminar Todo
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default QuickAccountsPanel;