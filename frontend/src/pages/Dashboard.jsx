// src/pages/Dashboard.jsx - VERSIÓN COMPLETA ACTUALIZADA CON SISTEMA DE 3 PLANES
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
    Box, Grid, GridItem, Button, Text, useToast, Spinner, Center,
    Card, CardBody, useDisclosure, VStack, HStack,
    Alert, AlertIcon, AlertTitle, AlertDescription,
    useBreakpointValue, IconButton, Tooltip,
    Tabs, TabList, TabPanels, Tab, TabPanel,
    Badge, Popover, PopoverTrigger, PopoverContent, PopoverBody,
    Flex, SimpleGrid, useColorModeValue,
    Input, InputGroup, InputLeftElement,
    Select, FormControl, FormLabel,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Table, Thead, Tbody, Tr, Th, Td,
    Textarea, Divider, Progress
} from '@chakra-ui/react';
import {
    FiRefreshCw, FiDownload, FiBarChart2, FiList, FiCalendar,
    FiUser, FiUsers, FiChevronDown, FiChevronUp,
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiArrowUp, FiArrowDown,
    FiAlertTriangle, FiEdit2, FiTrash2, FiSearch,
    FiPlus, FiMinus, FiBriefcase, FiPackage, FiFileText,
    FiStar, FiZap, FiLock
} from 'react-icons/fi';

// ✅ IMPORTACIONES DIRECTAS
import HeaderBar from '../components/layout/HeaderBar';
import GoalCard from '../components/ui/GoalCard';
import CategoryChart from '../components/charts/CategoryChart';
import EditTransactionModal from '../components/modals/EditTransactionModal';
import QuickAccounts from '../features/dashboard/components/QuickAccountsPanel/index';
import ExcelExporter from '../components/exports/ExcelExporter';

import { useAuth } from '../auth/AuthContext';
import api from '../lib/api';

// ✅ DATOS ESTÁTICOS PARA CATEGORÍAS
const CATEGORY_LABELS = {
    AL: 'Alimentación', TR: 'Transporte', SE: 'Servicios',
    VI: 'Vivienda', OC: 'Ocio', SA: 'Salud', ED: 'Educación', OT: 'Otros',
};

// ✅ CONFIGURACIÓN DE LÍMITES POR PLAN
const PLAN_LIMITS = {
    FREE: {
        maxTransactions: 100,
        maxQuickAccounts: 3,
        canExport: false,
        canAdvancedAnalytics: false,
        maxTransactionAmount: 10000,
        features: ['basic_dashboard', 'limited_transactions']
    },
    PREMIUM: {
        maxTransactions: 10000,
        maxQuickAccounts: 50,
        canExport: true,
        canAdvancedAnalytics: true,
        maxTransactionAmount: 1000000,
        features: ['unlimited_transactions', 'export_data', 'advanced_analytics', 'quick_accounts']
    },
    ENTERPRISE: {
        maxTransactions: 100000,
        maxQuickAccounts: 200,
        canExport: true,
        canAdvancedAnalytics: true,
        maxTransactionAmount: 5000000,
        features: ['unlimited_transactions', 'export_data', 'advanced_analytics', 'quick_accounts', 'enterprise_modules', 'api_access']
    }
};

// ✅ COMPONENTE DE INDICADOR DE PLAN
const PlanIndicator = ({ currentPlan, usage }) => {
    const getPlanColor = (plan) => {
        switch (plan) {
            case 'ENTERPRISE': return 'red';
            case 'PREMIUM': return 'purple';
            default: return 'gray';
        }
    };

    const getPlanDescription = (plan) => {
        switch (plan) {
            case 'ENTERPRISE': return 'Plan Empresarial - Todas las funciones';
            case 'PREMIUM': return 'Plan Premium - Funciones avanzadas';
            default: return 'Plan Free - Funciones básicas';
        }
    };

    return (
        <Tooltip label={getPlanDescription(currentPlan)}>
            <Badge
                colorScheme={getPlanColor(currentPlan)}
                variant="subtle"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="full"
            >
                <HStack spacing={1}>
                    {currentPlan === 'ENTERPRISE' && <FiBriefcase size={12} />}
                    {currentPlan === 'PREMIUM' && <FiStar size={12} />}
                    {currentPlan === 'FREE' && <FiUser size={12} />}
                    <Text>{currentPlan}</Text>
                </HStack>
            </Badge>
        </Tooltip>
    );
};

// ✅ COMPONENTE DE BARRA DE USO
const UsageBar = ({ current, max, label, colorScheme = 'blue' }) => {
    const percentage = max > 0 ? Math.min(100, (current / max) * 100) : 0;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <VStack spacing={1} align="stretch" w="full">
            <HStack justify="space-between" fontSize="sm">
                <Text color="gray.600">{label}</Text>
                <Text fontWeight="medium" color={isAtLimit ? 'red.600' : isNearLimit ? 'orange.600' : 'gray.600'}>
                    {current} / {max}
                </Text>
            </HStack>
            <Progress
                value={percentage}
                colorScheme={isAtLimit ? 'red' : isNearLimit ? 'orange' : colorScheme}
                size="sm"
                borderRadius="full"
                bg="gray.100"
            />
            {isNearLimit && (
                <Text fontSize="xs" color={isAtLimit ? 'red.600' : 'orange.600'} fontWeight="medium">
                    {isAtLimit ? 'Límite alcanzado' : 'Límite cercano'}
                </Text>
            )}
        </VStack>
    );
};

// ✅ COMPONENTE DE UPGRADE PROMOTION
const UpgradePromotion = ({ currentPlan, onUpgrade }) => {
    if (currentPlan === 'ENTERPRISE') return null;

    const getUpgradeMessage = (plan) => {
        switch (plan) {
            case 'FREE':
                return {
                    title: 'Mejora a Premium',
                    description: 'Desbloquea exportación, analíticas avanzadas y límites ampliados',
                    buttonText: 'Mejorar a Premium',
                    nextPlan: 'PREMIUM'
                };
            case 'PREMIUM':
                return {
                    title: 'Mejora a Enterprise',
                    description: 'Funciones empresariales, facturación y límites ilimitados',
                    buttonText: 'Mejorar a Enterprise',
                    nextPlan: 'ENTERPRISE'
                };
            default:
                return {
                    title: 'Mejora tu Plan',
                    description: 'Desbloquea más funciones y límites',
                    buttonText: 'Ver Planes',
                    nextPlan: 'PREMIUM'
                };
        }
    };

    const message = getUpgradeMessage(currentPlan);

    return (
        <Alert status="info" borderRadius="md" variant="left-accent">
            <AlertIcon />
            <Box flex="1">
                <Text fontWeight="medium">{message.title}</Text>
                <Text fontSize="sm">{message.description}</Text>
            </Box>
            <Button
                size="sm"
                colorScheme="blue"
                onClick={onUpgrade}
                rightIcon={<FiZap />}
            >
                {message.buttonText}
            </Button>
        </Alert>
    );
};

// ✅ COMPONENTE LOADING MEJORADO
const OptimizedLoading = ({ message = "Cargando..." }) => (
    <Center minH="60vh">
        <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="3px" speed="0.65s" emptyColor="gray.100" />
            <Text color="gray.600" fontSize="lg" fontWeight="medium">{message}</Text>
        </VStack>
    </Center>
);

// ✅ STAT CARD MINIMALISTA MEJORADA
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
    const isMobile = useBreakpointValue({ base: true, md: false });
    const cardBg = useColorModeValue('white', 'gray.750');
    const textColor = useColorModeValue('gray.800', 'white');
    const subtleTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Card
            bg={cardBg}
            border="1px"
            borderColor={useColorModeValue('gray.100', 'gray.600')}
            shadow="sm"
            _hover={{
                shadow: 'md',
                transform: 'translateY(-2px)',
            }}
            transition="all 0.2s ease"
            borderRadius="lg"
            overflow="hidden"
            position="relative"
        >
            <CardBody p={isMobile ? 3 : 4}>
                <VStack spacing={3} align="start" w="full">
                    <HStack justify="space-between" w="full">
                        <Box
                            p={2}
                            borderRadius="md"
                            bg={`${color}.50`}
                            color={`${color}.600`}
                        >
                            <Icon size={isMobile ? 16 : 18} />
                        </Box>
                        {trend && (
                            <Badge
                                colorScheme={trend > 0 ? "green" : "red"}
                                fontSize="xs"
                                borderRadius="full"
                                px={2}
                                variant="subtle"
                            >
                                {trend > 0 ? `+${trend}%` : `${trend}%`}
                            </Badge>
                        )}
                    </HStack>
                    <VStack spacing={1} align="start" w="full">
                        <Text
                            fontSize={isMobile ? "xl" : "2xl"}
                            fontWeight="bold"
                            color={textColor}
                            lineHeight="1"
                        >
                            {value}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color={subtleTextColor}>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text fontSize="xs" color={subtleTextColor} noOfLines={1}>
                                {subtitle}
                            </Text>
                        )}
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );
};

// ✅ DATE FILTER MEJORADO
const DateFilter = ({ period, onPeriodChange }) => {
    const PERIOD_OPTIONS = [
        { value: 'today', label: 'Hoy' },
        { value: 'yesterday', label: 'Ayer' },
        { value: 'week', label: 'Esta semana' },
        { value: 'last_week', label: 'Semana pasada' },
        { value: 'month', label: 'Este mes' },
        { value: 'last_month', label: 'Mes pasado' },
        { value: 'all', label: 'Todos' }
    ];

    const displayText = PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Periodo';
    const popoverBg = useColorModeValue('white', 'gray.750');
    const popoverBorderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Popover placement="bottom-start">
            <PopoverTrigger>
                <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FiCalendar />}
                    minW="140px"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{
                        borderColor: 'blue.300',
                        bg: useColorModeValue('gray.50', 'gray.700')
                    }}
                    bg={useColorModeValue('white', 'gray.750')}
                >
                    <Text isTruncated maxW="100px" fontSize="sm">
                        {displayText}
                    </Text>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                zIndex={9999}
                minW="180px"
                bg={popoverBg}
                borderColor={popoverBorderColor}
                shadow="lg"
                _focus={{ boxShadow: 'none' }}
            >
                <PopoverBody p={2}>
                    <VStack spacing={0} align="stretch">
                        {PERIOD_OPTIONS.map(option => (
                            <Button
                                key={option.value}
                                size="sm"
                                variant="ghost"
                                justifyContent="flex-start"
                                onClick={() => onPeriodChange(option.value)}
                                bg={period === option.value ? 'blue.50' : 'transparent'}
                                color={period === option.value ? 'blue.600' : useColorModeValue('gray.700', 'gray.300')}
                                _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                                fontWeight={period === option.value ? 'medium' : 'normal'}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </VStack>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

// ✅ SEARCH COMPONENT PARA MOVIMIENTOS
const SearchFilter = ({ onSearch, searchTerm }) => {
    const isMobile = useBreakpointValue({ base: true, md: false });
    const inputBg = useColorModeValue('white', 'gray.750');
    const inputBorderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <InputGroup maxW={isMobile ? "full" : "300px"} size="sm">
            <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" size={16} />
            </InputLeftElement>
            <Input
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                bg={inputBg}
                borderColor={inputBorderColor}
                fontSize="sm"
                _focus={{
                    borderColor: 'blue.300',
                    boxShadow: '0 0 0 1px blue.300'
                }}
            />
        </InputGroup>
    );
};

// ✅ TRANSACTION FORM CORREGIDO CON VERIFICACIÓN DE LÍMITES
const TransactionForm = ({ onSaved, userPlan, currentUsage, compact = false }) => {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'OT',
        transaction_type: 'OUT',
        date: new Date().toISOString().split('T')[0]
    });

    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const formBg = useColorModeValue('white', 'gray.750');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const inputBg = useColorModeValue('white', 'gray.700');
    const inputBorderColor = useColorModeValue('gray.300', 'gray.500');

    // ✅ OBTENER LÍMITES ACTUALES
    const currentLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.FREE;
    const hasReachedLimit = currentUsage >= currentLimits.maxTransactions;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ VERIFICAR LÍMITES
        if (hasReachedLimit) {
            toast({
                title: "Límite alcanzado",
                description: `Has alcanzado el límite de ${currentLimits.maxTransactions} transacciones. Mejora tu plan para continuar.`,
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // ✅ VERIFICAR MONTO MÁXIMO
        const amount = parseFloat(formData.amount);
        if (amount > currentLimits.maxTransactionAmount) {
            toast({
                title: "Monto excedido",
                description: `El monto máximo permitido es S/ ${currentLimits.maxTransactionAmount.toLocaleString()}.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Validaciones básicas
        if (!formData.amount || amount <= 0) {
            toast({
                title: "Error",
                description: "Por favor ingresa un monto válido mayor a 0",
                status: "error",
                duration: 3000,
            });
            return;
        }

        if (!formData.description?.trim()) {
            toast({
                title: "Error",
                description: "Por favor ingresa una descripción",
                status: "error",
                duration: 3000,
            });
            return;
        }

        setLoading(true);
        try {
            const transactionData = {
                amount: amount,
                description: formData.description.trim(),
                category: formData.category,
                transaction_type: formData.transaction_type,
                date: formData.date
            };

            console.log('Enviando transacción:', transactionData);
            await api.createTransaction(transactionData);

            toast({
                title: "¡Éxito!",
                description: `Transacción de ${formData.transaction_type === 'IN' ? 'ingreso' : 'gasto'} registrada correctamente`,
                status: "success",
                duration: 2000,
            });

            // Resetear formulario
            setFormData({
                amount: '',
                description: '',
                category: 'OT',
                transaction_type: 'OUT',
                date: new Date().toISOString().split('T')[0]
            });

            if (onSaved) onSaved();

        } catch (error) {
            console.error('Error creando transacción:', error);
            let errorMessage = "No se pudo registrar la transacción";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message?.includes('network')) {
                errorMessage = "Error de conexión. Verifica tu internet.";
            }

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isIncome = formData.transaction_type === 'IN';

    // ✅ ALERTA DE LÍMITES
    const renderLimitAlert = () => {
        if (hasReachedLimit) {
            return (
                <Alert status="warning" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="medium">Límite de transacciones alcanzado</Text>
                        <Text fontSize="xs">
                            {currentUsage}/{currentLimits.maxTransactions} transacciones usadas. Mejora tu plan para continuar.
                        </Text>
                    </Box>
                </Alert>
            );
        }

        const usagePercentage = (currentUsage / currentLimits.maxTransactions) * 100;
        if (usagePercentage >= 80) {
            return (
                <Alert status="info" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="medium">Límite cercano</Text>
                        <Text fontSize="xs">
                            {currentUsage}/{currentLimits.maxTransactions} transacciones usadas ({usagePercentage.toFixed(0)}%).
                        </Text>
                    </Box>
                </Alert>
            );
        }

        return null;
    };

    if (compact) {
        return (
            <Box
                bg={formBg}
                border="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={3}
                shadow="sm"
            >
                <VStack spacing={3} as="form" onSubmit={handleSubmit}>
                    {/* Alerta de límites */}
                    {renderLimitAlert()}

                    {/* Tipo de transacción */}
                    <HStack spacing={2} w="full">
                        <Button
                            size="sm"
                            flex={1}
                            leftIcon={<FiPlus />}
                            colorScheme="green"
                            variant={isIncome ? "solid" : "outline"}
                            onClick={() => handleChange('transaction_type', 'IN')}
                            type="button"
                            isDisabled={hasReachedLimit}
                        >
                            Ingreso
                        </Button>
                        <Button
                            size="sm"
                            flex={1}
                            leftIcon={<FiMinus />}
                            colorScheme="red"
                            variant={isIncome ? "outline" : "solid"}
                            onClick={() => handleChange('transaction_type', 'OUT')}
                            type="button"
                            isDisabled={hasReachedLimit}
                        >
                            Gasto
                        </Button>
                    </HStack>

                    {/* Monto y categoría */}
                    <HStack spacing={2} w="full">
                        <FormControl flex={2}>
                            <Input
                                size="sm"
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                bg={inputBg}
                                borderColor={inputBorderColor}
                                isDisabled={hasReachedLimit}
                                _focus={{
                                    borderColor: 'blue.300',
                                    boxShadow: '0 0 0 1px blue.300'
                                }}
                            />
                        </FormControl>
                        <FormControl flex={3}>
                            <Select
                                size="sm"
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                bg={inputBg}
                                borderColor={inputBorderColor}
                                isDisabled={hasReachedLimit}
                                _focus={{
                                    borderColor: 'blue.300',
                                    boxShadow: '0 0 0 1px blue.300'
                                }}
                            >
                                <option value="AL">Alimentación</option>
                                <option value="TR">Transporte</option>
                                <option value="SE">Servicios</option>
                                <option value="VI">Vivienda</option>
                                <option value="OC">Ocio</option>
                                <option value="SA">Salud</option>
                                <option value="ED">Educación</option>
                                <option value="OT">Otros</option>
                            </Select>
                        </FormControl>
                    </HStack>

                    {/* Fecha */}
                    <FormControl>
                        <Input
                            size="sm"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            isDisabled={hasReachedLimit}
                            _focus={{
                                borderColor: 'blue.300',
                                boxShadow: '0 0 0 1px blue.300'
                            }}
                        />
                    </FormControl>

                    {/* Descripción */}
                    <FormControl>
                        <Input
                            size="sm"
                            placeholder="Descripción de la transacción"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            isDisabled={hasReachedLimit}
                            _focus={{
                                borderColor: 'blue.300',
                                boxShadow: '0 0 0 1px blue.300'
                            }}
                        />
                    </FormControl>

                    {/* Botón de envío */}
                    <Button
                        size="sm"
                        colorScheme={isIncome ? "green" : "red"}
                        type="submit"
                        w="full"
                        isLoading={loading}
                        isDisabled={hasReachedLimit}
                        leftIcon={isIncome ? <FiPlus /> : <FiMinus />}
                    >
                        {hasReachedLimit ? 'Límite Alcanzado' : (isIncome ? 'Agregar Ingreso' : 'Agregar Gasto')}
                    </Button>
                </VStack>
            </Box>
        );
    }

    return (
        <Box
            bg={formBg}
            border="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={4}
            shadow="sm"
        >
            <VStack spacing={4} as="form" onSubmit={handleSubmit}>
                {/* Alerta de límites */}
                {renderLimitAlert()}

                {/* Tipo de transacción */}
                <HStack spacing={3} w="full">
                    <Button
                        flex={1}
                        leftIcon={<FiPlus />}
                        colorScheme="green"
                        variant={isIncome ? "solid" : "outline"}
                        onClick={() => handleChange('transaction_type', 'IN')}
                        type="button"
                        isDisabled={hasReachedLimit}
                        borderColor={isIncome ? 'green.500' : 'gray.300'}
                    >
                        Ingreso
                    </Button>
                    <Button
                        flex={1}
                        leftIcon={<FiMinus />}
                        colorScheme="red"
                        variant={isIncome ? "outline" : "solid"}
                        onClick={() => handleChange('transaction_type', 'OUT')}
                        type="button"
                        isDisabled={hasReachedLimit}
                        borderColor={isIncome ? 'gray.300' : 'red.500'}
                    >
                        Gasto
                    </Button>
                </HStack>

                {/* Monto */}
                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">Monto (S/)</FormLabel>
                    <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        bg={inputBg}
                        borderColor={inputBorderColor}
                        isDisabled={hasReachedLimit}
                        _focus={{
                            borderColor: 'blue.300',
                            boxShadow: '0 0 0 1px blue.300'
                        }}
                    />
                </FormControl>

                {/* Descripción */}
                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">Descripción</FormLabel>
                    <Input
                        placeholder="Describe tu transacción..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        bg={inputBg}
                        borderColor={inputBorderColor}
                        isDisabled={hasReachedLimit}
                        _focus={{
                            borderColor: 'blue.300',
                            boxShadow: '0 0 0 1px blue.300'
                        }}
                    />
                </FormControl>

                {/* Categoría y Fecha */}
                <HStack spacing={3} w="full">
                    <FormControl flex={2}>
                        <FormLabel fontSize="sm" fontWeight="medium">Categoría</FormLabel>
                        <Select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            isDisabled={hasReachedLimit}
                            _focus={{
                                borderColor: 'blue.300',
                                boxShadow: '0 0 0 1px blue.300'
                            }}
                        >
                            <option value="AL">Alimentación</option>
                            <option value="TR">Transporte</option>
                            <option value="SE">Servicios</option>
                            <option value="VI">Vivienda</option>
                            <option value="OC">Ocio</option>
                            <option value="SA">Salud</option>
                            <option value="ED">Educación</option>
                            <option value="OT">Otros</option>
                        </Select>
                    </FormControl>

                    <FormControl flex={1}>
                        <FormLabel fontSize="sm" fontWeight="medium">Fecha</FormLabel>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            isDisabled={hasReachedLimit}
                            _focus={{
                                borderColor: 'blue.300',
                                boxShadow: '0 0 0 1px blue.300'
                            }}
                        />
                    </FormControl>
                </HStack>

                {/* Botón de envío */}
                <Button
                    colorScheme={isIncome ? "green" : "red"}
                    type="submit"
                    w="full"
                    isLoading={loading}
                    isDisabled={hasReachedLimit}
                    size="lg"
                    leftIcon={isIncome ? <FiPlus /> : <FiMinus />}
                >
                    {hasReachedLimit ? 'Límite Alcanzado' : (isIncome ? 'Agregar Ingreso' : 'Agregar Gasto')}
                </Button>
            </VStack>
        </Box>
    );
};

// ✅ ENHANCED HISTORY LIST
const EnhancedHistoryList = ({ items, onEdit, onDelete, searchTerm = '', isMobile = false }) => {
    const cardBg = useColorModeValue('white', 'gray.750');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const subtleTextColor = useColorModeValue('gray.500', 'gray.400');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.amount?.toString().includes(searchTerm)
        );
    }, [items, searchTerm]);

    const handleDelete = async (item) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
            await onDelete(item);
        }
    };

    if (!filteredItems || filteredItems.length === 0) {
        return (
            <Center py={8}>
                <VStack spacing={3}>
                    <FiAlertTriangle size={24} color={subtleTextColor} />
                    <Text color={subtleTextColor} fontSize="sm">
                        {searchTerm ? 'No hay transacciones que coincidan con la búsqueda' : 'No hay transacciones en este periodo'}
                    </Text>
                </VStack>
            </Center>
        );
    }

    return (
        <VStack spacing={2} align="stretch">
            {filteredItems.map((item, index) => {
                const isIncome = item.transaction_type === 'IN';
                const amount = Number(item.amount) || 0;

                return (
                    <Card
                        key={item.id || index}
                        variant="unstyled"
                        bg={cardBg}
                        border="1px"
                        borderColor={borderColor}
                        _hover={{
                            shadow: 'xs',
                            borderColor: useColorModeValue('gray.300', 'gray.500'),
                        }}
                        transition="all 0.2s"
                        borderRadius="lg"
                        cursor="pointer"
                        shadow="none"
                    >
                        <CardBody py={3} px={3}>
                            <Flex justify="space-between" align="start">
                                {/* COLUMNA IZQUIERDA: CONTENIDO PRINCIPAL */}
                                <VStack align="start" spacing={1} flex="1" minW={0}>
                                    {/* LÍNEA 1: DESCRIPCIÓN Y MONTO */}
                                    <HStack spacing={2} w="full" justify="space-between">
                                        <HStack spacing={2} flex="1" minW={0}>
                                            <Box
                                                p={2}
                                                borderRadius="md"
                                                bg={isIncome ? 'green.50' : 'red.50'}
                                                color={isIncome ? 'green.600' : 'red.600'}
                                                flexShrink={0}
                                            >
                                                {isIncome ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                                            </Box>
                                            <Text
                                                fontWeight="medium"
                                                color={textColor}
                                                noOfLines={1}
                                                fontSize="sm"
                                                flex="1"
                                            >
                                                {item.description || 'Sin descripción'}
                                            </Text>
                                        </HStack>

                                        {/* MONTO MÁS GRANDE */}
                                        <Text
                                            fontWeight="bold"
                                            color={isIncome ? 'green.600' : 'red.600'}
                                            fontSize="md"
                                            flexShrink={0}
                                            ml={2}
                                        >
                                            {isIncome ? '+' : '-'}S/ {amount.toFixed(2)}
                                        </Text>
                                    </HStack>

                                    {/* LÍNEA 2: FECHA Y CATEGORÍA */}
                                    <HStack spacing={3}>
                                        <Text fontSize="xs" color={subtleTextColor}>
                                            {new Date(item.date || item.created_at).toLocaleDateString('es-ES')}
                                        </Text>
                                        {item.category && (
                                            <>
                                                <Text fontSize="xs" color={subtleTextColor}>•</Text>
                                                <Badge
                                                    fontSize="2xs"
                                                    colorScheme="gray"
                                                    variant="subtle"
                                                    borderRadius="sm"
                                                >
                                                    {CATEGORY_LABELS[item.category] || item.category}
                                                </Badge>
                                            </>
                                        )}
                                    </HStack>
                                </VStack>

                                {/* COLUMNA DERECHA: ACCIONES ALINEADAS CON CATEGORÍA/FECHA */}
                                <HStack spacing={1} ml={2} align="center">
                                    <IconButton
                                        icon={<FiEdit2 size={12} />}
                                        size="xs"
                                        variant="ghost"
                                        color="blue.500"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(item);
                                        }}
                                        aria-label="Editar transacción"
                                        _hover={{
                                            bg: 'blue.50',
                                        }}
                                    />
                                    <IconButton
                                        icon={<FiTrash2 size={12} />}
                                        size="xs"
                                        variant="ghost"
                                        color="red.500"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item);
                                        }}
                                        aria-label="Eliminar transacción"
                                        _hover={{
                                            bg: 'red.50',
                                        }}
                                    />
                                </HStack>
                            </Flex>
                        </CardBody>
                    </Card>
                );
            })}
        </VStack>
    );
};

// ✅ COMPONENTE DE GESTIÓN DE PRODUCTOS
const ProductManager = ({ isOpen, onClose, onProductSelect }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sku: '',
        stock: ''
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const toast = useToast();

    const cardBg = useColorModeValue('white', 'gray.750');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const loadProducts = async () => {
        try {
            setLoading(true);

            // ✅ VERIFICAR SI EL USUARIO TIENE ACCESO EMPRESARIAL PRIMERO
            const userData = await api.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                toast({
                    title: "Plan requerido",
                    description: "Esta función requiere un plan Enterprise",
                    status: "warning",
                    duration: 3000,
                });
                setProducts([]);
                return;
            }

            // ✅ INTENTAR CARGAR PRODUCTOS CON MANEJO DE ERRORES
            try {
                const response = await api.getEnterpriseProducts();
                setProducts(response.data || []);
            } catch (apiError) {
                console.log('ℹ️ Endpoint de productos no disponible aún');
                // ✅ DATOS DE EJEMPLO PARA DESARROLLO
                setProducts([
                    {
                        id: 1,
                        name: "Producto Ejemplo",
                        description: "Descripción del producto",
                        price: 99.99,
                        sku: "PROD-001",
                        stock: 10
                    }
                ]);
            }

        } catch (error) {
            console.error('Error loading products:', error);
            toast({
                title: "Info",
                description: "Los productos estarán disponibles pronto",
                status: "info",
                duration: 3000,
            });
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!formData.name || !formData.price) {
            toast({
                title: "Error",
                description: "Nombre y precio son obligatorios",
                status: "error",
                duration: 3000,
            });
            return;
        }

        try {
            // ✅ SIMULAR GUARDADO EN DESARROLLO
            const newProduct = {
                id: editingProduct ? editingProduct.id : Date.now(),
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                sku: formData.sku,
                stock: parseInt(formData.stock) || 0
            };

            if (editingProduct) {
                // Actualizar producto existente
                setProducts(prev => prev.map(p =>
                    p.id === editingProduct.id ? newProduct : p
                ));
                toast({
                    title: "Producto actualizado",
                    status: "success",
                    duration: 2000,
                });
            } else {
                // Agregar nuevo producto
                setProducts(prev => [...prev, newProduct]);
                toast({
                    title: "Producto creado",
                    status: "success",
                    duration: 2000,
                });
            }

            resetForm();

        } catch (error) {
            toast({
                title: "Info",
                description: "La función de guardado estará disponible pronto",
                status: "info",
                duration: 3000,
            });
        }
    };

    const handleDeleteProduct = async (product) => {
        if (window.confirm(`¿Eliminar producto ${product.name}?`)) {
            try {
                // ✅ SIMULAR ELIMINACIÓN EN DESARROLLO
                setProducts(prev => prev.filter(p => p.id !== product.id));
                toast({
                    title: "Producto eliminado",
                    status: "success",
                    duration: 2000,
                });
            } catch (error) {
                toast({
                    title: "Info",
                    description: "La función de eliminación estará disponible pronto",
                    status: "info",
                    duration: 3000,
                });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            sku: '',
            stock: ''
        });
        setEditingProduct(null);
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            sku: product.sku || '',
            stock: product.stock?.toString() || ''
        });
        setEditingProduct(product);
    };

    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={2}>
                        <FiPackage />
                        <Text>Gestión de Productos</Text>
                        <Badge colorScheme="purple" fontSize="xs">
                            ENTERPRISE
                        </Badge>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Alert status="info" mb={4} fontSize="sm">
                        <AlertIcon />
                        <Box>
                            <Text fontWeight="medium">Función en desarrollo</Text>
                            <Text fontSize="xs">Los datos se guardan localmente por ahora</Text>
                        </Box>
                    </Alert>

                    <Grid templateColumns="1fr 2fr" gap={6}>
                        {/* Formulario */}
                        <Card bg={cardBg} border="1px" borderColor={borderColor}>
                            <CardBody>
                                <VStack spacing={4}>
                                    <Text fontWeight="bold" fontSize="lg">
                                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                    </Text>

                                    <FormControl>
                                        <FormLabel>Nombre del Producto *</FormLabel>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ej: Laptop Dell XPS"
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Descripción</FormLabel>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Descripción breve"
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>SKU/Código</FormLabel>
                                        <Input
                                            value={formData.sku}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                            placeholder="Código interno"
                                        />
                                    </FormControl>

                                    <HStack spacing={3} w="full">
                                        <FormControl>
                                            <FormLabel>Precio (S/) *</FormLabel>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                                placeholder="0.00"
                                            />
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>Stock</FormLabel>
                                            <Input
                                                type="number"
                                                value={formData.stock}
                                                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                                placeholder="0"
                                            />
                                        </FormControl>
                                    </HStack>

                                    <Button
                                        colorScheme="blue"
                                        w="full"
                                        onClick={handleSaveProduct}
                                        isLoading={loading}
                                    >
                                        {editingProduct ? 'Actualizar' : 'Guardar'} Producto
                                    </Button>

                                    {editingProduct && (
                                        <Button
                                            variant="outline"
                                            w="full"
                                            onClick={resetForm}
                                        >
                                            Cancelar Edición
                                        </Button>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* Lista de Productos */}
                        <Card bg={cardBg} border="1px" borderColor={borderColor}>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold" fontSize="lg">
                                            Productos ({products.length})
                                        </Text>
                                        <Button
                                            size="sm"
                                            leftIcon={<FiPlus />}
                                            onClick={() => onProductSelect && onProductSelect(products)}
                                            isDisabled={products.length === 0}
                                        >
                                            Usar en Venta
                                        </Button>
                                    </HStack>

                                    {products.length === 0 ? (
                                        <Alert status="info">
                                            <AlertIcon />
                                            No hay productos registrados
                                        </Alert>
                                    ) : (
                                        <Box overflowX="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Producto</Th>
                                                        <Th>Precio</Th>
                                                        <Th>Stock</Th>
                                                        <Th>Acciones</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {products.map(product => (
                                                        <Tr key={product.id}>
                                                            <Td>
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="medium">{product.name}</Text>
                                                                    {product.description && (
                                                                        <Text fontSize="xs" color="gray.500">
                                                                            {product.description}
                                                                        </Text>
                                                                    )}
                                                                </VStack>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme="green">
                                                                    S/ {parseFloat(product.price).toFixed(2)}
                                                                </Badge>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme={product.stock > 0 ? "blue" : "red"}>
                                                                    {product.stock || 0}
                                                                </Badge>
                                                            </Td>
                                                            <Td>
                                                                <HStack spacing={1}>
                                                                    <IconButton
                                                                        icon={<FiEdit2 />}
                                                                        size="sm"
                                                                        onClick={() => handleEdit(product)}
                                                                        aria-label="Editar"
                                                                    />
                                                                    <IconButton
                                                                        icon={<FiTrash2 />}
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        onClick={() => handleDeleteProduct(product)}
                                                                        aria-label="Eliminar"
                                                                    />
                                                                </HStack>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </Box>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

// ✅ COMPONENTE DE FACTURACIÓN EMPRESARIAL
const EnterpriseInvoice = ({ products = [], compact = false }) => {
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [clientInfo, setClientInfo] = useState({
        name: '',
        ruc: '',
        address: '',
        email: ''
    });
    const toast = useToast();

    const cardBg = useColorModeValue('white', 'gray.750');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const addProductToInvoice = () => {
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        const existingItem = invoiceItems.find(item => item.productId === product.id);

        if (existingItem) {
            setInvoiceItems(prev => prev.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            setInvoiceItems(prev => [...prev, {
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: quantity,
                total: parseFloat(product.price) * quantity
            }]);
        }

        setSelectedProduct('');
        setQuantity(1);
    };

    const removeItem = (productId) => {
        setInvoiceItems(prev => prev.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;

        setInvoiceItems(prev => prev.map(item =>
            item.productId === productId
                ? {
                    ...item,
                    quantity: newQuantity,
                    total: item.price * newQuantity
                }
                : item
        ));
    };

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const igv = subtotal * 0.18; // 18% IGV
    const total = subtotal + igv;

    const generateInvoice = async () => {
        if (invoiceItems.length === 0) {
            toast({
                title: "Error",
                description: "Agrega productos a la factura",
                status: "error",
                duration: 3000,
            });
            return;
        }

        try {
            const invoiceData = {
                client: clientInfo,
                items: invoiceItems,
                subtotal,
                igv,
                total,
                date: new Date().toISOString()
            };

            await api.createEnterpriseInvoice(invoiceData);

            toast({
                title: "Factura generada",
                description: "La factura se ha creado correctamente",
                status: "success",
                duration: 3000,
            });

            // Resetear formulario
            setInvoiceItems([]);
            setClientInfo({ name: '', ruc: '', address: '', email: '' });
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo generar la factura",
                status: "error",
                duration: 3000,
            });
        }
    };

    if (compact) {
        return (
            <VStack spacing={3} align="stretch">
                <Text fontWeight="semibold">Facturación Rápida</Text>

                <FormControl size="sm">
                    <FormLabel fontSize="sm">Producto</FormLabel>
                    <Select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        placeholder="Seleccionar producto"
                        size="sm"
                    >
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} - S/ {parseFloat(product.price).toFixed(2)}
                            </option>
                        ))}
                    </Select>
                </FormControl>

                <HStack spacing={2}>
                    <FormControl>
                        <FormLabel fontSize="sm">Cantidad</FormLabel>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            size="sm"
                        />
                    </FormControl>
                    <Button
                        onClick={addProductToInvoice}
                        isDisabled={!selectedProduct}
                        colorScheme="blue"
                        size="sm"
                        mt={6}
                    >
                        Agregar
                    </Button>
                </HStack>

                {invoiceItems.length > 0 && (
                    <VStack spacing={2} align="stretch" mt={3}>
                        <Text fontSize="sm" fontWeight="medium">Items: {invoiceItems.length}</Text>
                        <Text fontSize="sm">Total: S/ {total.toFixed(2)}</Text>
                        <Button
                            colorScheme="green"
                            size="sm"
                            onClick={generateInvoice}
                            leftIcon={<FiFileText />}
                        >
                            Generar Factura
                        </Button>
                    </VStack>
                )}
            </VStack>
        );
    }

    return (
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
                <VStack spacing={6} align="stretch">
                    {/* Información del Cliente */}
                    <Box>
                        <Text fontWeight="bold" mb={3}>Información del Cliente</Text>
                        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                            <FormControl>
                                <FormLabel fontSize="sm">Nombre/Razón Social</FormLabel>
                                <Input
                                    value={clientInfo.name}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Cliente o Empresa"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">RUC/DNI</FormLabel>
                                <Input
                                    value={clientInfo.ruc}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, ruc: e.target.value }))}
                                    placeholder="Número de documento"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Dirección</FormLabel>
                                <Input
                                    value={clientInfo.address}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Dirección del cliente"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Email</FormLabel>
                                <Input
                                    type="email"
                                    value={clientInfo.email}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@cliente.com"
                                    size="sm"
                                />
                            </FormControl>
                        </Grid>
                    </Box>

                    {/* Agregar Productos */}
                    <Box>
                        <Text fontWeight="bold" mb={3}>Agregar Productos</Text>
                        <HStack spacing={3}>
                            <Select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                placeholder="Seleccionar producto"
                                flex={2}
                                size="sm"
                            >
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} - S/ {parseFloat(product.price).toFixed(2)}
                                    </option>
                                ))}
                            </Select>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                min="1"
                                max="1000"
                                width="100px"
                                size="sm"
                            />
                            <Button
                                leftIcon={<FiPlus />}
                                onClick={addProductToInvoice}
                                isDisabled={!selectedProduct}
                                colorScheme="blue"
                                size="sm"
                            >
                                Agregar
                            </Button>
                        </HStack>
                    </Box>

                    {/* Items de la Factura */}
                    {invoiceItems.length > 0 && (
                        <Box>
                            <Text fontWeight="bold" mb={3}>Detalle de la Factura</Text>
                            <Box overflowX="auto">
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Producto</Th>
                                            <Th>Precio Unit.</Th>
                                            <Th>Cantidad</Th>
                                            <Th>Total</Th>
                                            <Th>Acciones</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {invoiceItems.map(item => (
                                            <Tr key={item.productId}>
                                                <Td>{item.name}</Td>
                                                <Td>S/ {item.price.toFixed(2)}</Td>
                                                <Td>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        width="80px"
                                                        size="sm"
                                                    />
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="green">
                                                        S/ {item.total.toFixed(2)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <IconButton
                                                        icon={<FiTrash2 />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        onClick={() => removeItem(item.productId)}
                                                        aria-label="Eliminar"
                                                    />
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>

                            {/* Totales */}
                            <Box mt={4} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <VStack spacing={2} align="stretch">
                                    <Flex justify="space-between">
                                        <Text fontSize="sm">Subtotal:</Text>
                                        <Text fontSize="sm">S/ {subtotal.toFixed(2)}</Text>
                                    </Flex>
                                    <Flex justify="space-between">
                                        <Text fontSize="sm">IGV (18%):</Text>
                                        <Text fontSize="sm">S/ {igv.toFixed(2)}</Text>
                                    </Flex>
                                    <Divider />
                                    <Flex justify="space-between" fontWeight="bold">
                                        <Text>Total:</Text>
                                        <Text color="green.500">S/ {total.toFixed(2)}</Text>
                                    </Flex>
                                </VStack>
                            </Box>
                        </Box>
                    )}

                    {/* Acciones */}
                    <HStack justify="flex-end" spacing={3}>
                        <Button variant="outline" isDisabled={invoiceItems.length === 0} size="sm">
                            <FiDownload />
                            <Text ml={2}>Exportar PDF</Text>
                        </Button>
                        <Button colorScheme="green" onClick={generateInvoice} isDisabled={invoiceItems.length === 0} size="sm">
                            <FiFileText />
                            <Text ml={2}>Generar Factura</Text>
                        </Button>
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
    );
};

// ✅ HOOK DE TRANSACCIONES OPTIMIZADO
const useTransactionsManager = (auth) => {
    const [state, setState] = useState({
        transactions: [],
        filteredTransactions: [],
        loading: false,
        refreshing: false,
        failed: false,
        error: null
    });

    const dataLoadedRef = useRef(false);

    const loadTransactions = useCallback(async (forceRefresh = false) => {
        if (state.loading && !forceRefresh) return;
        if (dataLoadedRef.current && !forceRefresh) return;
        if (!auth.user) return;

        setState(prev => ({
            ...prev,
            loading: !forceRefresh,
            refreshing: forceRefresh,
            failed: false,
            error: null
        }));

        try {
            // ✅ USAR DATOS DE EJEMPLO SI LA API NO ESTÁ DISPONIBLE
            let validTransactions = [];

            try {
                const response = await api.getTransactions({
                    limit: 100,
                    offset: 0
                });

                if (Array.isArray(response)) {
                    validTransactions = response;
                } else if (response?.data) {
                    validTransactions = Array.isArray(response.data) ? response.data : [];
                }

                console.log('✅ [Dashboard] Transacciones cargadas:', validTransactions.length);

            } catch (apiError) {
                console.log('⚠️ [Dashboard] API no disponible, usando datos de ejemplo');
                // ✅ DATOS DE EJEMPLO PARA DESARROLLO
                validTransactions = [
                    {
                        id: 1,
                        amount: 150.00,
                        description: "Supermercado",
                        category: "AL",
                        transaction_type: "OUT",
                        date: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 2,
                        amount: 2500.00,
                        description: "Salario",
                        category: "OT",
                        transaction_type: "IN",
                        date: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 3,
                        amount: 80.00,
                        description: "Transporte",
                        category: "TR",
                        transaction_type: "OUT",
                        date: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    }
                ];
            }

            setState({
                transactions: validTransactions,
                filteredTransactions: validTransactions,
                loading: false,
                refreshing: false,
                failed: false,
                error: null
            });

            dataLoadedRef.current = true;

        } catch (error) {
            console.error('❌ ERROR en loadTransactions:', error);

            setState(prev => ({
                ...prev,
                loading: false,
                refreshing: false,
                failed: true,
                error: 'Error temporal al cargar transacciones'
            }));
        }
    }, [auth.user, state.loading]);

    return {
        ...state,
        loadTransactions
    };
};

// ✅ HOOK PARA DISTRIBUCIÓN DE GASTOS
const useExpenseDistribution = (transactions, period) => {
    const [distribution, setDistribution] = useState([]);

    useEffect(() => {
        if (!transactions || transactions.length === 0) {
            setDistribution([]);
            return;
        }

        const expenses = transactions.filter(tx =>
            tx.transaction_type === 'OUT' || tx.type === 'OUT'
        );

        const categoryTotals = {};

        expenses.forEach(expense => {
            const category = expense.category || 'OT';
            const amount = Number(expense.amount) || 0;

            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += amount;
        });

        const distributionData = Object.entries(categoryTotals).map(([category, amount]) => ({
            category,
            name: CATEGORY_LABELS[category] || category,
            value: amount,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }));

        setDistribution(distributionData);
    }, [transactions, period]);

    return distribution;
};

export default function Dashboard() {
    const auth = useAuth();
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ USAR EL AUTH CONTEXT ACTUALIZADO
    const {
        getCurrentPlan,
        isPremium,
        isEnterprise,
        isFree,
        canExport,
        canUseAdvancedAnalytics,
        getPlanLimits
    } = auth;

    const initialLoadRef = useRef(false);
    const dataLoadRef = useRef({
        loaded: false,
        timestamp: 0,
        profile: null
    });

    const {
        transactions,
        filteredTransactions: txFiltered,
        loading: txLoading,
        refreshing: txRefreshing,
        failed: txFailed,
        error: txError,
        loadTransactions
    } = useTransactionsManager(auth);

    const [state, setState] = useState({
        loading: true,
        refreshing: false,
        failed: false,
        profile: null,
        mobileTabIndex: 0,
        editingTx: null,
        filterPeriod: 'month',
        quickAccountsExpanded: localStorage.getItem('quickAccountsExpanded') === 'true' || false,
        hasQuickAccounts: localStorage.getItem('hasQuickAccounts') === 'true' || false,
        quickAccountsData: [],
        quickAccountsCount: 0,
        searchTerm: '',
        // ✅ NUEVOS ESTADOS PARA LÍMITES
        userLimits: null,
        usageStats: {
            transactions: 0,
            quickAccounts: 0
        },
        enterpriseProducts: []
    });

    const { isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit } = useDisclosure();
    const { isOpen: isProductsOpen, onOpen: onOpenProducts, onClose: onCloseProducts } = useDisclosure();

    // ✅ OBTENER INFORMACIÓN DEL PLAN ACTUAL
    const currentPlan = getCurrentPlan();
    const userIsEnterprise = isEnterprise();
    const userIsPremium = isPremium();
    const userIsFree = isFree();
    const userLimits = getPlanLimits();

    // ✅ OBTENER DISTRIBUCIÓN DE GASTOS
    const expenseDistribution = useExpenseDistribution(transactions, state.filterPeriod);

    // ✅ COLORES MEJORADOS
    const pageBg = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const subtleTextColor = useColorModeValue('gray.500', 'gray.400');

    // ✅ ACTUALIZAR ESTADO OPTIMIZADO
    const updateState = useCallback((updates) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // ✅ FILTRAR TRANSACCIONES
    const filterTransactions = useCallback((transactions, period) => {
        if (!transactions || transactions.length === 0) return [];
        if (period === 'all' || !period) return transactions;

        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last_week':
                startDate = new Date(now.setDate(now.getDate() - now.getDay() - 7));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                return transactions;
        }

        return transactions.filter(tx => {
            const txDate = new Date(tx.date || tx.created_at);
            return txDate >= startDate && txDate <= endDate;
        });
    }, []);

    // ✅ CARGA DE LÍMITES Y USO
    const loadLimitsAndUsage = useCallback(async () => {
        try {
            // Usar límites del AuthContext en lugar de la API
            const limits = userLimits; // ← Esto viene de getPlanLimits()

            updateState({
                userLimits: limits,
                usageStats: {
                    transactions: transactions.length,
                    quickAccounts: 0 // Puedes obtener esto de tu API si es necesario
                }
            });
        } catch (error) {
            console.error('Error cargando límites:', error);
            // Usar límites por defecto basados en el plan
            updateState({
                userLimits: userLimits,
                usageStats: {
                    transactions: transactions.length,
                    quickAccounts: 0
                }
            });
        }
    }, [currentPlan, transactions.length, updateState, userLimits]);

    // ✅ CARGA DE PERFIL Y DATOS ACTUALIZADA
    const loadProfileData = useCallback(async (forceRefresh = false) => {
        const now = Date.now();

        if (!forceRefresh && dataLoadRef.current.loaded && (now - dataLoadRef.current.timestamp) < 30000) {
            return;
        }

        try {
            const profileData = await api.getProfile();
            console.log('✅ [Dashboard] Perfil cargado:', profileData);

            dataLoadRef.current = {
                loaded: true,
                timestamp: now,
                profile: profileData
            };

            updateState({
                profile: profileData,
                loading: false,
                refreshing: false
            });

            // Cargar límites después del perfil
            await loadLimitsAndUsage();

        } catch (error) {
            console.error('❌ Error cargando perfil:', error);

            // ✅ USAR DATOS POR DEFECTO SI FALLA LA CARGA
            const defaultProfile = {
                name: 'Usuario',
                subscription: 'FREE',
                email: auth.user?.email || 'usuario@ejemplo.com'
            };

            updateState({
                profile: defaultProfile,
                failed: false, // No marcar como fallido completamente
                loading: false,
                refreshing: false
            });

            // Cargar límites con perfil por defecto
            await loadLimitsAndUsage();
        }
    }, [updateState, loadLimitsAndUsage, auth.user]);

    // ✅ CARGA COMPLETA DE DATOS ACTUALIZADA
    const loadAllData = useCallback(async (forceRefresh = false) => {
        updateState({ loading: !forceRefresh, refreshing: forceRefresh });

        try {
            await Promise.all([
                loadProfileData(forceRefresh),
                loadTransactions(forceRefresh)
            ]);
        } catch (error) {
            console.error('❌ Error en carga completa:', error);
        }
    }, [loadProfileData, loadTransactions, updateState]);

    // ✅ EFECTOS PRINCIPALES ACTUALIZADOS
    useEffect(() => {
        const shouldLoad = auth.ready && auth.user && !auth.loading && !initialLoadRef.current;

        if (shouldLoad) {
            initialLoadRef.current = true;
            console.log('🔄 [Dashboard] Iniciando carga de datos...');
            loadAllData();
        }
    }, [auth.ready, auth.user, auth.loading, loadAllData]);

    // ✅ CARGAR LÍMITES CUANDO CAMBIE EL PLAN
    useEffect(() => {
        if (auth.user && currentPlan) {
            loadLimitsAndUsage();
        }
    }, [auth.user, currentPlan, loadLimitsAndUsage]);

    // ✅ CÁLCULOS MEMOIZADOS MEJORADOS
    const { income, expense, balance, transactionStats, filteredTransactions } = useMemo(() => {
        const currentTransactions = filterTransactions(transactions, state.filterPeriod);

        if (!currentTransactions || currentTransactions.length === 0) {
            return {
                income: 0,
                expense: 0,
                balance: 0,
                transactionStats: {
                    periodCount: 0,
                    periodAmount: 0,
                    recentTransactions: []
                },
                filteredTransactions: []
            };
        }

        let inc = 0, out = 0;
        for (let i = 0; i < currentTransactions.length; i++) {
            const tx = currentTransactions[i];
            const amt = Number(tx.amount) || 0;
            const type = tx.transaction_type || tx.type || 'OUT';

            if (type === 'IN' || type === 'INCOME') inc += amt;
            else out += amt;
        }

        return {
            income: inc,
            expense: out,
            balance: inc - out,
            transactionStats: {
                periodCount: currentTransactions.length,
                periodAmount: inc + out,
                recentTransactions: currentTransactions
            },
            filteredTransactions: currentTransactions
        };
    }, [transactions, state.filterPeriod, filterTransactions]);

    // ✅ HANDLERS MEJORADOS
    const handleRefresh = useCallback(() => {
        updateState({ refreshing: true });
        loadAllData(true);
        toast({
            title: "Actualizando datos...",
            status: "info",
            duration: 1500,
            position: isMobile ? "bottom" : "top-right",
            variant: "subtle"
        });
    }, [loadAllData, updateState, toast, isMobile]);

    const handleSaved = useCallback(async () => {
        await loadAllData(true);
        await loadLimitsAndUsage(); // ✅ ACTUALIZAR LÍMITES DESPUÉS DE GUARDAR
        toast({
            title: '¡Listo!',
            description: 'Transacción guardada correctamente',
            status: "success",
            duration: 2000,
        });
    }, [loadAllData, loadLimitsAndUsage, toast]);

    const handleEditTx = useCallback((tx) => {
        console.log('Editando transacción:', tx);
        updateState({ editingTx: tx });
        onOpenEdit();
    }, [onOpenEdit, updateState]);

    const handleEditSuccess = useCallback(() => {
        loadAllData(true);
        onCloseEdit();
        updateState({ editingTx: null });
        toast({
            title: 'Actualizado',
            description: 'Transacción actualizada correctamente',
            status: "success",
            duration: 2000,
        });
    }, [loadAllData, onCloseEdit, updateState, toast]);

    const handleDeleteTx = useCallback(async (tx) => {
        console.log('Eliminando transacción:', tx);
        try {
            await api.deleteTransaction(tx.id);
            await loadAllData(true);
            await loadLimitsAndUsage(); // ✅ ACTUALIZAR LÍMITES DESPUÉS DE ELIMINAR
            toast({
                title: 'Eliminado',
                description: 'Movimiento eliminado correctamente',
                status: "success",
                duration: 2000,
                isClosable: true
            });
        } catch (error) {
            console.error('❌ Error eliminando transacción:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el movimiento',
                status: "error",
                duration: 3000,
                isClosable: true
            });
        }
    }, [loadAllData, loadLimitsAndUsage, toast]);

    const handlePeriodChange = useCallback((newPeriod) => {
        updateState({ filterPeriod: newPeriod });
    }, [updateState]);

    const setMobileTabIndex = useCallback((index) => {
        updateState({ mobileTabIndex: index });
    }, [updateState]);

    const handleSearch = useCallback((term) => {
        updateState({ searchTerm: term });
    }, [updateState]);

    // ✅ HANDLERS PARA CUENTAS RÁPIDAS
    const toggleQuickAccounts = useCallback(() => {
        const newState = !state.quickAccountsExpanded;
        localStorage.setItem('quickAccountsExpanded', newState.toString());
        updateState({ quickAccountsExpanded: newState });
    }, [state.quickAccountsExpanded, updateState]);

    const handleQuickAccountsChange = useCallback((hasData, accounts = []) => {
        localStorage.setItem('hasQuickAccounts', hasData.toString());
        updateState({
            hasQuickAccounts: hasData,
            quickAccountsData: accounts,
            quickAccountsCount: accounts.length
        });
    }, [updateState]);

    // ✅ HANDLER PARA ACTUALIZAR META DE AHORRO
    const handleGoalUpdate = useCallback(async () => {
        try {
            console.log('🔄 Recargando datos después de actualizar meta...');
            await loadAllData(true);
            toast({
                title: "¡Datos actualizados!",
                description: "La información se ha sincronizado correctamente",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            console.error('❌ Error recargando datos:', error);
            toast({
                title: "Error",
                description: "No se pudieron actualizar los datos",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    }, [loadAllData, toast]);

    // ✅ HANDLER PARA PRODUCTOS EMPRESARIALES
    const handleProductSelect = useCallback((products) => {
        updateState({ enterpriseProducts: products });
        onCloseProducts();
    }, [updateState, onCloseProducts]);

    // ✅ HANDLER PARA UPGRADE
    const handleUpgrade = useCallback(() => {
        toast({
            title: "Mejorar Plan",
            description: "Redirigiendo a la página de planes...",
            status: "info",
            duration: 3000,
        });
        // Aquí iría la navegación a /upgrade
    }, [toast]);

    // ✅ RENDERIZADO CONDICIONAL MEJORADO
    if (!auth.ready || auth.loading || (state.loading && !state.refreshing)) {
        return (
            <Box minH="100vh" bg={pageBg}>
                <HeaderBar />
                <OptimizedLoading message="Cargando tu información financiera..." />
            </Box>
        );
    }

    if (!auth.user) {
        return (
            <Box minH="100vh" bg={pageBg}>
                <HeaderBar />
                <Center py={16} px={4}>
                    <Alert status="warning" borderRadius="xl" maxW="md" variant="subtle">
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Sesión no válida</AlertTitle>
                            <AlertDescription>
                                Por favor, inicia sesión nuevamente.
                            </AlertDescription>
                        </Box>
                    </Alert>
                </Center>
            </Box>
        );
    }

    if (txFailed) {
        return (
            <Box minH="100vh" bg={pageBg}>
                <HeaderBar />
                <Center py={16} px={4}>
                    <VStack spacing={6} textAlign="center" maxW="md">
                        <Alert status="info" borderRadius="xl" variant="subtle">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>Funcionalidad en desarrollo</AlertTitle>
                                <AlertDescription>
                                    {txError || "Las transacciones estarán disponibles pronto."}
                                </AlertDescription>
                            </Box>
                        </Alert>
                        <Text color={subtleTextColor} fontSize="sm" textAlign="center">
                            El dashboard está funcionando correctamente. Las transacciones se activarán en la próxima actualización.
                        </Text>
                        <Button
                            onClick={handleRefresh}
                            colorScheme="blue"
                            size={isMobile ? "md" : "lg"}
                            leftIcon={<FiRefreshCw />}
                            isLoading={state.refreshing}
                            variant="solid"
                        >
                            Reintentar
                        </Button>
                    </VStack>
                </Center>
            </Box>
        );
    }

    // ✅ CONTENIDO PRINCIPAL MEJORADO
    return (
        <Box minH="100vh" bg={pageBg}>
            <HeaderBar />

            {/* CONTENEDOR PRINCIPAL CON ANCHO MÁXIMO */}
            <Box
                maxW="1200px"
                mx="auto"
                px={{ base: 3, md: 6 }}
                py={{ base: 3, md: 6 }}
            >
                {isMobile ? (
                    // ✅ VERSIÓN MÓVIL MEJORADA CON LÍMITES
                    <Box>
                        {/* INDICADOR DE PLAN Y USO */}
                        <VStack spacing={2} align="stretch" mb={3}>
                            <HStack justify="space-between">
                                <PlanIndicator currentPlan={currentPlan} usage={state.usageStats.transactions} />
                                <IconButton
                                    icon={<FiRefreshCw size={14} />}
                                    onClick={handleRefresh}
                                    isLoading={state.refreshing}
                                    variant="ghost"
                                    size="xs"
                                    aria-label="Actualizar"
                                />
                            </HStack>

                            {/* BARRA DE USO */}
                            {state.userLimits && (
                                <UsageBar
                                    current={state.usageStats.transactions}
                                    max={state.userLimits.maxTransactions}
                                    label="Transacciones"
                                />
                            )}

                            {/* PROMOCIÓN DE UPGRADE */}
                            {userIsFree && (
                                <UpgradePromotion currentPlan={currentPlan} onUpgrade={handleUpgrade} />
                            )}
                        </VStack>

                        {/* ESTADÍSTICAS */}
                        <SimpleGrid columns={3} spacing={2} mb={3}>
                            <StatCard
                                title="Ingresos"
                                value={`S/ ${income.toFixed(0)}`}
                                icon={FiTrendingUp}
                                color="green"
                                subtitle="Entradas"
                            />
                            <StatCard
                                title="Gastos"
                                value={`S/ ${expense.toFixed(0)}`}
                                icon={FiTrendingDown}
                                color="red"
                                subtitle="Salidas"
                            />
                            <StatCard
                                title="Balance"
                                value={`S/ ${balance.toFixed(0)}`}
                                icon={FiDollarSign}
                                color={balance >= 0 ? "green" : "red"}
                                subtitle="Neto"
                            />
                        </SimpleGrid>

                        <Tabs index={state.mobileTabIndex} onChange={setMobileTabIndex} colorScheme="blue" isFitted mb={4}>
                            <TabList bg={cardBg} borderRadius="lg" p={1} shadow="sm" border="1px" borderColor={borderColor}>
                                <Tab _selected={{ bg: 'blue.50', color: 'blue.600' }} borderRadius="md" py={2} fontSize="sm">
                                    <HStack spacing={1}>
                                        <FiList size={14} />
                                        <Text fontSize="xs" fontWeight="medium">Movimientos</Text>
                                    </HStack>
                                </Tab>
                                <Tab _selected={{ bg: 'blue.50', color: 'blue.600' }} borderRadius="md" py={2} fontSize="sm">
                                    <HStack spacing={1}>
                                        <FiBarChart2 size={14} />
                                        <Text fontSize="xs" fontWeight="medium">Análisis</Text>
                                    </HStack>
                                </Tab>
                                <Tab _selected={{ bg: 'blue.50', color: 'blue.600' }} borderRadius="md" py={2} fontSize="sm">
                                    <HStack spacing={1}>
                                        <FiUsers size={14} />
                                        <Text fontSize="xs" fontWeight="medium">Cuentas</Text>
                                    </HStack>
                                </Tab>
                                {/* ✅ PESTAÑA EMPRESA SOLO PARA ENTERPRISE */}
                                {userIsEnterprise && (
                                    <Tab _selected={{ bg: 'purple.50', color: 'purple.600' }} borderRadius="md" py={2} fontSize="sm">
                                        <HStack spacing={1}>
                                            <FiBriefcase size={14} />
                                            <Text fontSize="xs" fontWeight="medium">Empresa</Text>
                                        </HStack>
                                    </Tab>
                                )}
                            </TabList>

                            <TabPanels>
                                {/* PESTAÑA 1: MOVIMIENTOS */}
                                <TabPanel px={0} pt={3}>
                                    <VStack spacing={3} align="stretch">
                                        <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                            <CardBody p={3}>
                                                <VStack spacing={3} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                                            Nueva Transacción
                                                        </Text>
                                                    </HStack>
                                                    <TransactionForm
                                                        onSaved={handleSaved}
                                                        userPlan={currentPlan}
                                                        currentUsage={state.usageStats.transactions}
                                                        compact={true}
                                                    />
                                                </VStack>
                                            </CardBody>
                                        </Card>

                                        <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                            <CardBody p={3}>
                                                <VStack spacing={3} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                                            Movimientos ({filteredTransactions.length})
                                                        </Text>
                                                        {/* ✅ EXPORT SOLO SI ESTÁ PERMITIDO */}
                                                        {canExport() && (
                                                            <ExcelExporter
                                                                data={filteredTransactions}
                                                                type="transactions"
                                                                period={state.filterPeriod}
                                                                size="sm"
                                                            />
                                                        )}
                                                    </HStack>
                                                    <SearchFilter
                                                        onSearch={handleSearch}
                                                        searchTerm={state.searchTerm}
                                                    />
                                                    <EnhancedHistoryList
                                                        items={filteredTransactions}
                                                        onEdit={handleEditTx}
                                                        onDelete={handleDeleteTx}
                                                        searchTerm={state.searchTerm}
                                                        isMobile={true}
                                                    />
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    </VStack>
                                </TabPanel>

                                {/* PESTAÑA 2: ANÁLISIS */}
                                <TabPanel px={0} pt={3}>
                                    <VStack spacing={3} align="stretch">
                                        <GoalCard
                                            profile={state.profile}
                                            balance={balance}
                                            onUpdated={handleGoalUpdate}
                                            compact={true}
                                        />

                                        <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                            <CardBody p={3}>
                                                <VStack spacing={3} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                                            Distribución de Gastos
                                                        </Text>
                                                        <DateFilter
                                                            period={state.filterPeriod}
                                                            onPeriodChange={handlePeriodChange}
                                                        />
                                                    </HStack>
                                                    <CategoryChart
                                                        data={expenseDistribution}
                                                        compact={true}
                                                    />
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    </VStack>
                                </TabPanel>

                                {/* PESTAÑA 3: CUENTAS RÁPIDAS */}
                                <TabPanel px={0} pt={3}>
                                    <QuickAccounts
                                        onDataChange={handleQuickAccountsChange}
                                        userPlan={currentPlan}
                                        currentUsage={state.usageStats.quickAccounts}
                                        compact={true}
                                    />
                                </TabPanel>

                                {/* ✅ PESTAÑA 4: EMPRESA */}
                                {userIsEnterprise && (
                                    <TabPanel px={0} pt={3}>
                                        <VStack spacing={3} align="stretch">
                                            <Alert status="info" fontSize="sm">
                                                <AlertIcon />
                                                Modo Empresa activado
                                            </Alert>

                                            <Button
                                                leftIcon={<FiPackage />}
                                                onClick={onOpenProducts}
                                                colorScheme="purple"
                                                size="sm"
                                            >
                                                Gestionar Productos
                                            </Button>

                                            <EnterpriseInvoice
                                                products={state.enterpriseProducts}
                                                compact={true}
                                            />
                                        </VStack>
                                    </TabPanel>
                                )}
                            </TabPanels>
                        </Tabs>
                    </Box>
                ) : (
                    // ✅ VERSIÓN DESKTOP MEJORADA CON LÍMITES
                    <>
                        {/* HEADER CON INFORMACIÓN DE PLAN */}
                        <VStack spacing={4} align="stretch" mb={6}>
                            <Flex justify="space-between" align="start" wrap="wrap" gap={3}>
                                <VStack align="start" spacing={2}>
                                    <HStack spacing={3}>
                                        <Box p={1} borderRadius="md" bg="blue.50" color="blue.600">
                                            <FiUser size={16} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <HStack spacing={2}>
                                                <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                                                    Hola, {state.profile?.name || 'Usuario'}
                                                </Text>
                                                <PlanIndicator currentPlan={currentPlan} />
                                            </HStack>
                                            <Text color={subtleTextColor} fontSize="sm">
                                                {transactionStats.periodCount} movimientos en el periodo
                                            </Text>
                                        </VStack>
                                    </HStack>

                                    {/* BARRAS DE USO */}
                                    {state.userLimits && (
                                        <HStack spacing={4} mt={2}>
                                            <Box minW="200px">
                                                <UsageBar
                                                    current={state.usageStats.transactions}
                                                    max={state.userLimits.maxTransactions}
                                                    label="Transacciones"
                                                />
                                            </Box>
                                            <Box minW="200px">
                                                <UsageBar
                                                    current={state.usageStats.quickAccounts}
                                                    max={state.userLimits.maxQuickAccounts}
                                                    label="Cuentas Rápidas"
                                                    colorScheme="purple"
                                                />
                                            </Box>
                                        </HStack>
                                    )}
                                </VStack>

                                <VStack align="end" spacing={2}>
                                    <HStack spacing={2}>
                                        <DateFilter
                                            period={state.filterPeriod}
                                            onPeriodChange={handlePeriodChange}
                                        />
                                        {/* ✅ EXPORT SOLO SI ESTÁ PERMITIDO */}
                                        {canExport() && (
                                            <ExcelExporter
                                                data={filteredTransactions}
                                                type="transactions"
                                                period={state.filterPeriod}
                                                size="sm"
                                            />
                                        )}
                                        <Tooltip label="Actualizar datos">
                                            <IconButton
                                                icon={<FiRefreshCw size={14} />}
                                                onClick={handleRefresh}
                                                isLoading={state.refreshing}
                                                variant="outline"
                                                size="sm"
                                                aria-label="Actualizar"
                                            />
                                        </Tooltip>
                                    </HStack>

                                    {/* PROMOCIÓN DE UPGRADE */}
                                    {!userIsEnterprise && (
                                        <UpgradePromotion currentPlan={currentPlan} onUpgrade={handleUpgrade} />
                                    )}
                                </VStack>
                            </Flex>

                            {/* ESTADÍSTICAS COMPACTAS */}
                            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
                                <StatCard
                                    title="Balance Total"
                                    value={`S/ ${balance.toFixed(2)}`}
                                    icon={FiDollarSign}
                                    color={balance >= 0 ? "green" : "red"}
                                    trend={balance >= 0 ? 12 : -5}
                                    subtitle="Saldo actual"
                                />
                                <StatCard
                                    title="Ingresos"
                                    value={`S/ ${income.toFixed(2)}`}
                                    icon={FiTrendingUp}
                                    color="green"
                                    trend={8}
                                    subtitle="Total de entradas"
                                />
                                <StatCard
                                    title="Gastos"
                                    value={`S/ ${expense.toFixed(2)}`}
                                    icon={FiTrendingDown}
                                    color="red"
                                    trend={-3}
                                    subtitle="Total de salidas"
                                />
                                <StatCard
                                    title="Movimientos"
                                    value={transactionStats.periodCount.toString()}
                                    icon={FiList}
                                    color="blue"
                                    trend={15}
                                    subtitle="Total registradas"
                                />
                            </SimpleGrid>
                        </VStack>

                        {/* META DE AHORRO COMPACTA */}
                        <Box mb={4}>
                            <GoalCard
                                profile={state.profile}
                                balance={balance}
                                onUpdated={handleGoalUpdate}
                            />
                        </Box>

                        {/* FORMULARIO Y GRÁFICO EN GRID COMPACTO */}
                        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4} mb={4}>
                            <GridItem>
                                <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                    <CardBody p={4}>
                                        <VStack spacing={3} align="stretch">
                                            <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                                Nueva Transacción
                                            </Text>
                                            <TransactionForm
                                                onSaved={handleSaved}
                                                userPlan={currentPlan}
                                                currentUsage={state.usageStats.transactions}
                                            />
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </GridItem>

                            <GridItem>
                                <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                    <CardBody p={4}>
                                        <VStack spacing={3} align="stretch">
                                            <HStack justify="space-between">
                                                <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                                    Distribución de Gastos
                                                </Text>
                                                <DateFilter
                                                    period={state.filterPeriod}
                                                    onPeriodChange={handlePeriodChange}
                                                />
                                            </HStack>
                                            <CategoryChart data={expenseDistribution} />
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </GridItem>
                        </Grid>

                        {/* CUENTAS RÁPIDAS SIMPLIFICADAS */}
                        <Box mb={4}>
                            <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                <CardBody p={0}>
                                    <Flex
                                        p={3}
                                        borderBottom={state.quickAccountsExpanded ? "1px" : "0"}
                                        borderColor={borderColor}
                                        justify="space-between"
                                        align="center"
                                        cursor="pointer"
                                        onClick={toggleQuickAccounts}
                                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                    >
                                        <HStack spacing={2}>
                                            <Box
                                                p={1}
                                                borderRadius="md"
                                                bg="blue.50"
                                                color="blue.500"
                                            >
                                                <FiUsers size={14} />
                                            </Box>
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                                    Cuentas Rápidas
                                                </Text>
                                                <Text fontSize="xs" color={subtleTextColor}>
                                                    {state.quickAccountsCount} cuenta{state.quickAccountsCount !== 1 ? 's' : ''} activa{state.quickAccountsCount !== 1 ? 's' : ''}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <HStack spacing={2}>
                                            {canExport() && (
                                                <ExcelExporter
                                                    data={state.quickAccountsData}
                                                    type="accounts"
                                                    size="sm"
                                                />
                                            )}
                                            <IconButton
                                                icon={state.quickAccountsExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                                variant="ghost"
                                                size="xs"
                                                aria-label={state.quickAccountsExpanded ? "Minimizar" : "Expandir"}
                                                color={subtleTextColor}
                                            />
                                        </HStack>
                                    </Flex>
                                    {state.quickAccountsExpanded && (
                                        <Box p={3}>
                                            <QuickAccounts
                                                onDataChange={handleQuickAccountsChange}
                                                userPlan={currentPlan}
                                                currentUsage={state.usageStats.quickAccounts}
                                                onExport={() => { }}
                                            />
                                        </Box>
                                    )}
                                </CardBody>
                            </Card>
                        </Box>

                        {/* HISTORIAL CON BÚSQUEDA */}
                        <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                            <CardBody p={4}>
                                <VStack spacing={3} align="stretch">
                                    <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                                        <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                            Movimientos del Periodo
                                        </Text>
                                        <HStack spacing={2}>
                                            <SearchFilter
                                                onSearch={handleSearch}
                                                searchTerm={state.searchTerm}
                                            />
                                            <Badge colorScheme="blue" fontSize="xs" px={2} py={1} variant="subtle">
                                                {filteredTransactions.length} transacciones
                                            </Badge>
                                        </HStack>
                                    </Flex>
                                    <EnhancedHistoryList
                                        items={filteredTransactions}
                                        onEdit={handleEditTx}
                                        onDelete={handleDeleteTx}
                                        searchTerm={state.searchTerm}
                                    />
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* ✅ MÓDULO EMPRESARIAL - SOLO PARA USUARIOS ENTERPRISE */}
                        {userIsEnterprise && (
                            <Box mt={6}>
                                <Card shadow="sm" border="1px" borderColor={borderColor} bg={cardBg}>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <HStack justify="space-between">
                                                <HStack spacing={3}>
                                                    <Box p={2} borderRadius="md" bg="purple.50" color="purple.600">
                                                        <FiBriefcase size={20} />
                                                    </Box>
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="bold" fontSize="lg">
                                                            Módulo Empresarial
                                                        </Text>
                                                        <Text fontSize="sm" color={subtleTextColor}>
                                                            Facturación y gestión de productos
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                                <Button
                                                    leftIcon={<FiPackage />}
                                                    onClick={onOpenProducts}
                                                    colorScheme="purple"
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Gestionar Productos
                                                </Button>
                                            </HStack>

                                            <EnterpriseInvoice products={state.enterpriseProducts} />
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* MODAL DE EDICIÓN */}
            <EditTransactionModal
                isOpen={isEditOpen}
                onClose={onCloseEdit}
                transaction={state.editingTx}
                onSuccess={handleEditSuccess}
            />

            {/* ✅ MODAL DE GESTIÓN DE PRODUCTOS */}
            <ProductManager
                isOpen={isProductsOpen}
                onClose={onCloseProducts}
                onProductSelect={handleProductSelect}
            />
        </Box>
    );
}