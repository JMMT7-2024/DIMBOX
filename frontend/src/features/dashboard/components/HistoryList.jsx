// src/features/dashboard/components/HistoryList.jsx - VERSIÓN MEJORADA
import React, { useMemo, useCallback } from 'react';
import {
    Box,
    Stack,
    HStack,
    VStack,
    Text,
    Badge,
    IconButton,
    Tooltip,
    Divider,
    useColorModeValue,
    Skeleton,
    Alert,
    AlertIcon,
    useBreakpointValue,
    Fade,
    Collapse
} from '@chakra-ui/react';
import {
    FiEdit2,
    FiTrash2,
    FiAlertCircle,
    FiTrendingUp,
    FiTrendingDown,
    FiMoreVertical,
    FiCopy
} from 'react-icons/fi';

// 🎯 CONSTANTES Y CONFIGURACIÓN MEJORADA
const TRANSACTION_CONFIG = {
    types: {
        IN: {
            colorScheme: 'green',
            label: 'Ingreso',
            icon: FiTrendingUp,
            prefix: '+'
        },
        OUT: {
            colorScheme: 'red',
            label: 'Gasto',
            icon: FiTrendingDown,
            prefix: '-'
        },
        TRANSFER: {
            colorScheme: 'blue',
            label: 'Transferencia',
            icon: FiCopy,
            prefix: '→'
        }
    },
    currency: {
        locale: 'es-PE',
        currency: 'PEN',
        minimumFractionDigits: 2
    },
    dateFormat: {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }
};

// 🎯 FUNCIONES UTILITARIAS MEJORADAS
const getTypeConfig = (type) =>
    TRANSACTION_CONFIG.types[type] || {
        colorScheme: 'gray',
        label: 'Desconocido',
        icon: FiAlertCircle,
        prefix: ''
    };

const formatCurrency = (amount, type = 'OUT') => {
    const config = getTypeConfig(type);
    const formatted = new Intl.NumberFormat(
        TRANSACTION_CONFIG.currency.locale,
        TRANSACTION_CONFIG.currency
    ).format(Math.abs(Number(amount || 0)));

    return `${config.prefix} S/ ${formatted}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(
            TRANSACTION_CONFIG.currency.locale,
            TRANSACTION_CONFIG.dateFormat
        ).format(date);
    } catch {
        return dateString;
    }
};

const getAmountColor = (type) =>
    type === 'IN' ? 'green.600' : type === 'TRANSFER' ? 'blue.600' : 'red.600';

// 🎯 HOOKS PERSONALIZADOS MEJORADOS
export const useTransactionStyles = () => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const mutedColor = useColorModeValue('gray.600', 'gray.300');
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    return {
        cardBg,
        borderColor,
        mutedColor,
        textColor,
        hoverBg
    };
};

const useTransactionActions = (onEdit, onDelete, onDuplicate) => {
    const handleEdit = useCallback((transaction) => {
        onEdit?.(transaction);
    }, [onEdit]);

    const handleDelete = useCallback((transaction) => {
        if (window.confirm(`¿Estás seguro de eliminar "${transaction.description || 'esta transacción'}"?`)) {
            onDelete?.(transaction);
        }
    }, [onDelete]);

    const handleDuplicate = useCallback((transaction) => {
        onDuplicate?.(transaction);
    }, [onDuplicate]);

    return {
        handleEdit,
        handleDelete,
        handleDuplicate
    };
};

// 🎯 COMPONENTES DE INTERFAZ MEJORADOS
const EmptyState = ({ message = "No hay movimientos aún", action }) => {
    const { mutedColor, borderColor, cardBg } = useTransactionStyles();

    return (
        <Fade in>
            <Box
                p={8}
                textAlign="center"
                borderWidth="1px"
                borderRadius="lg"
                bg={cardBg}
                borderColor={borderColor}
            >
                <VStack spacing={4}>
                    <FiAlertCircle size={40} color={mutedColor} />
                    <VStack spacing={1}>
                        <Text color={mutedColor} fontSize="lg" fontWeight="medium">
                            {message}
                        </Text>
                        <Text color={mutedColor} fontSize="sm">
                            Comienza agregando tu primera transacción
                        </Text>
                    </VStack>
                    {action && (
                        <Box pt={2}>
                            {action}
                        </Box>
                    )}
                </VStack>
            </Box>
        </Fade>
    );
};

const ErrorState = ({ message = "Error al cargar los movimientos", onRetry }) => {
    return (
        <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box flex="1">
                <Text>{message}</Text>
                {onRetry && (
                    <Button size="sm" onClick={onRetry} mt={2}>
                        Reintentar
                    </Button>
                )}
            </Box>
        </Alert>
    );
};

const LoadingSkeleton = ({ count = 5 }) => {
    const isMobile = useBreakpointValue({ base: true, md: false });

    return (
        <Stack spacing={3}>
            {Array.from({ length: count }, (_, i) => (
                <Box
                    key={i}
                    borderWidth="1px"
                    borderRadius="lg"
                    p={4}
                >
                    <HStack align="flex-start" justify="space-between">
                        <VStack align="flex-start" spacing={2} flex="1">
                            <HStack spacing={2} wrap="wrap">
                                <Skeleton height="20px" width="60px" />
                                <Skeleton height="20px" width="80px" />
                                {!isMobile && <Skeleton height="16px" width="70px" />}
                            </HStack>
                            <Skeleton height="16px" width={isMobile ? "150px" : "200px"} />
                        </VStack>
                        <VStack align="flex-end" spacing={2}>
                            <Skeleton height="24px" width="100px" />
                            {!isMobile && (
                                <HStack spacing={1}>
                                    <Skeleton height="32px" width="32px" borderRadius="md" />
                                    <Skeleton height="32px" width="32px" borderRadius="md" />
                                </HStack>
                            )}
                        </VStack>
                    </HStack>
                </Box>
            ))}
        </Stack>
    );
};

const TransactionBadges = ({ type, category, categoryLabel, date, isRecurring }) => {
    const { mutedColor } = useTransactionStyles();
    const typeConfig = getTypeConfig(type);
    const isMobile = useBreakpointValue({ base: true, md: false });

    return (
        <HStack spacing={2} wrap="wrap">
            <Badge
                colorScheme={typeConfig.colorScheme}
                fontSize="xs"
                display="flex"
                alignItems="center"
                gap={1}
            >
                <typeConfig.icon size={12} />
                {typeConfig.label}
            </Badge>

            {category && (
                <Badge variant="subtle" colorScheme="purple" fontSize="xs">
                    {categoryLabel || category}
                </Badge>
            )}

            {isRecurring && (
                <Badge variant="outline" colorScheme="orange" fontSize="2xs">
                    🔄
                </Badge>
            )}

            <Text fontSize="sm" color={mutedColor}>
                {isMobile ? formatDate(date).split(' ')[0] : formatDate(date)}
            </Text>
        </HStack>
    );
};

const TransactionActions = ({
    onEdit,
    onDelete,
    onDuplicate,
    disableActions,
    transaction,
    isCompact = false
}) => {
    const { handleEdit, handleDelete, handleDuplicate } = useTransactionActions(onEdit, onDelete, onDuplicate);

    if (disableActions) return null;

    if (isCompact) {
        return (
            <Tooltip label="Más opciones" hasArrow>
                <IconButton
                    aria-label="Opciones de transacción"
                    size="sm"
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    colorScheme="gray"
                />
            </Tooltip>
        );
    }

    return (
        <HStack spacing={1}>
            <Tooltip label="Editar movimiento" hasArrow>
                <IconButton
                    aria-label="Editar transacción"
                    size="sm"
                    icon={<FiEdit2 />}
                    onClick={() => handleEdit(transaction)}
                    variant="ghost"
                    colorScheme="blue"
                />
            </Tooltip>

            {onDuplicate && (
                <Tooltip label="Duplicar transacción" hasArrow>
                    <IconButton
                        aria-label="Duplicar transacción"
                        size="sm"
                        icon={<FiCopy />}
                        onClick={() => handleDuplicate(transaction)}
                        variant="ghost"
                        colorScheme="green"
                    />
                </Tooltip>
            )}

            <Tooltip label="Eliminar movimiento" hasArrow>
                <IconButton
                    aria-label="Eliminar transacción"
                    size="sm"
                    icon={<FiTrash2 />}
                    onClick={() => handleDelete(transaction)}
                    variant="ghost"
                    colorScheme="red"
                />
            </Tooltip>
        </HStack>
    );
};

const TransactionItem = ({
    transaction,
    onEdit,
    onDelete,
    onDuplicate,
    disableActions,
    showDivider = false,
    isCompact = false
}) => {
    const { cardBg, borderColor, hoverBg } = useTransactionStyles();
    const amountColor = getAmountColor(transaction.transaction_type);
    const isMobile = useBreakpointValue({ base: true, md: false });

    return (
        <Fade in>
            <Box
                borderWidth="1px"
                borderRadius="lg"
                bg={cardBg}
                borderColor={borderColor}
                px={4}
                py={3}
                transition="all 0.2s"
                _hover={{
                    shadow: 'sm',
                    transform: 'translateY(-1px)',
                    bg: hoverBg
                }}
            >
                <HStack align="flex-start" justify="space-between" spacing={3}>
                    {/* Información de la transacción */}
                    <VStack align="flex-start" spacing={2} flex="1" minW={0}>
                        <TransactionBadges
                            type={transaction.transaction_type}
                            category={transaction.category}
                            categoryLabel={transaction.category_label}
                            date={transaction.date}
                            isRecurring={transaction.is_recurring}
                        />

                        {transaction.description && (
                            <Text
                                fontSize="sm"
                                noOfLines={isMobile ? 1 : 2}
                                fontWeight="medium"
                            >
                                {transaction.description}
                            </Text>
                        )}

                        {transaction.note && !isMobile && (
                            <Text
                                fontSize="xs"
                                color="gray.500"
                                fontStyle="italic"
                                noOfLines={1}
                            >
                                {transaction.note}
                            </Text>
                        )}
                    </VStack>

                    {/* Monto y acciones */}
                    <VStack spacing={2} align="flex-end" minW={isCompact ? "auto" : "120px"}>
                        <Text
                            fontWeight="bold"
                            fontSize={isMobile ? "md" : "lg"}
                            color={amountColor}
                            textAlign="right"
                        >
                            {formatCurrency(transaction.amount, transaction.transaction_type)}
                        </Text>

                        <TransactionActions
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            disableActions={disableActions}
                            transaction={transaction}
                            isCompact={isCompact || isMobile}
                        />
                    </VStack>
                </HStack>

                {showDivider && <Divider mt={3} opacity={0.3} />}
            </Box>
        </Fade>
    );
};

// 🎯 COMPONENTE PRINCIPAL MEJORADO
export default function HistoryList({
    items = [],
    onEdit,
    onDelete,
    onDuplicate,
    disableActions = false,
    isLoading = false,
    error = null,
    onRetry,
    loadingCount = 5,
    emptyMessage = "No hay movimientos aún",
    emptyAction,
    isCompact = false,
    maxHeight,
    virtualized = false
}) {
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [items]);

    // 🎯 Estados de renderizado
    if (error) {
        return <ErrorState message={error} onRetry={onRetry} />;
    }

    if (isLoading) {
        return <LoadingSkeleton count={loadingCount} />;
    }

    if (!sortedItems.length) {
        return <EmptyState message={emptyMessage} action={emptyAction} />;
    }

    const containerProps = maxHeight ? {
        maxHeight,
        overflowY: 'auto',
        css: {
            '&::-webkit-scrollbar': {
                width: '4px',
            },
            '&::-webkit-scrollbar-track': {
                width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
                background: useColorModeValue('gray.300', 'gray.600'),
                borderRadius: '24px',
            },
        }
    } : {};

    return (
        <Stack spacing={3} {...containerProps}>
            {sortedItems.map((transaction, index) => (
                <TransactionItem
                    key={transaction.id || `tx-${index}`}
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    disableActions={disableActions}
                    showDivider={index < sortedItems.length - 1}
                    isCompact={isCompact}
                />
            ))}
        </Stack>
    );
}

// 🎯 COMPONENTES ADICIONALES PARA REUTILIZACIÓN
export const TransactionTypeBadge = ({ type, size = "sm", showIcon = true }) => {
    const badgeConfig = getTypeConfig(type);
    return (
        <Badge
            colorScheme={badgeConfig.colorScheme}
            size={size}
            display="flex"
            alignItems="center"
            gap={1}
        >
            {showIcon && <badgeConfig.icon size={12} />}
            {badgeConfig.label}
        </Badge>
    );
};

export const TransactionAmount = ({ amount, type, size = "lg", showColor = true }) => {
    const amountColor = showColor ? getAmountColor(type) : 'inherit';
    return (
        <Text
            fontWeight="bold"
            fontSize={size}
            color={amountColor}
        >
            {formatCurrency(amount, type)}
        </Text>
    );
};

// 🎯 HOOK PARA ESTADÍSTICAS DE TRANSACCIONES
export const useTransactionStats = (transactions) => {
    return useMemo(() => {
        const stats = {
            totalIncome: 0,
            totalExpenses: 0,
            netAmount: 0,
            transactionCount: transactions.length,
            incomeCount: 0,
            expenseCount: 0
        };

        transactions.forEach(transaction => {
            const amount = Number(transaction.amount || 0);

            if (transaction.transaction_type === 'IN') {
                stats.totalIncome += amount;
                stats.incomeCount++;
            } else {
                stats.totalExpenses += amount;
                stats.expenseCount++;
            }
        });

        stats.netAmount = stats.totalIncome - stats.totalExpenses;

        return stats;
    }, [transactions]);
};