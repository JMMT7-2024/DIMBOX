// src/components/HistoryList.jsx - VERSIÓN REFACTORIZADA
import React from 'react';
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
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';

// 🎯 CONSTANTES Y CONFIGURACIÓN
const TRANSACTION_CONFIG = {
    types: {
        IN: { colorScheme: 'green', label: 'Ingreso' },
        OUT: { colorScheme: 'red', label: 'Gasto' }
    },
    currency: {
        locale: 'es-PE',
        currency: 'PEN',
        minimumFractionDigits: 2
    }
};

// 🎯 FUNCIONES UTILITARIAS
const getTypeBadge = (type) =>
    TRANSACTION_CONFIG.types[type] || { colorScheme: 'gray', label: 'Desconocido' };

const formatCurrency = (amount) =>
    new Intl.NumberFormat(
        TRANSACTION_CONFIG.currency.locale,
        TRANSACTION_CONFIG.currency
    ).format(Number(amount || 0));

const getAmountColor = (type) =>
    type === 'IN' ? 'green.600' : 'red.600';

// 🎯 COMPONENTES DE INTERFAZ
const EmptyState = () => {
    const mutedColor = useColorModeValue('gray.600', 'gray.300');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const bgColor = useColorModeValue('white', 'gray.800');

    return (
        <Box
            p={8}
            textAlign="center"
            borderWidth="1px"
            borderRadius="lg"
            bg={bgColor}
            borderColor={borderColor}
        >
            <VStack spacing={3}>
                <FiAlertCircle size={32} color={mutedColor} />
                <Text color={mutedColor} fontSize="lg">
                    No hay movimientos aún
                </Text>
                <Text color={mutedColor} fontSize="sm">
                    Comienza agregando tu primera transacción
                </Text>
            </VStack>
        </Box>
    );
};

const ErrorState = ({ message = "Error al cargar los movimientos" }) => (
    <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Text>{message}</Text>
    </Alert>
);

const LoadingSkeleton = ({ count = 5 }) => (
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
                        <HStack spacing={2}>
                            <Skeleton height="20px" width="60px" />
                            <Skeleton height="20px" width="80px" />
                            <Skeleton height="16px" width="70px" />
                        </HStack>
                        <Skeleton height="16px" width="200px" />
                    </VStack>
                    <VStack align="flex-end" spacing={2}>
                        <Skeleton height="24px" width="100px" />
                        <HStack spacing={1}>
                            <Skeleton height="32px" width="32px" borderRadius="md" />
                            <Skeleton height="32px" width="32px" borderRadius="md" />
                        </HStack>
                    </VStack>
                </HStack>
            </Box>
        ))}
    </Stack>
);

const TransactionBadges = ({ type, category, categoryLabel, date }) => {
    const mutedColor = useColorModeValue('gray.600', 'gray.300');
    const typeBadge = getTypeBadge(type);

    return (
        <HStack spacing={2} wrap="wrap">
            <Badge colorScheme={typeBadge.colorScheme} fontSize="xs">
                {typeBadge.label}
            </Badge>
            {category && (
                <Badge variant="subtle" colorScheme="purple" fontSize="xs">
                    {categoryLabel || category}
                </Badge>
            )}
            <Text fontSize="sm" color={mutedColor}>
                {date}
            </Text>
        </HStack>
    );
};

const TransactionActions = ({ onEdit, onDelete, disableActions, transaction }) => {
    if (disableActions) return null;

    return (
        <HStack spacing={1}>
            <Tooltip label="Editar movimiento" hasArrow>
                <IconButton
                    aria-label="Editar transacción"
                    size="sm"
                    icon={<FiEdit2 />}
                    onClick={() => onEdit?.(transaction)}
                    variant="ghost"
                    colorScheme="blue"
                />
            </Tooltip>
            <Tooltip label="Eliminar movimiento" hasArrow>
                <IconButton
                    aria-label="Eliminar transacción"
                    size="sm"
                    icon={<FiTrash2 />}
                    onClick={() => onDelete?.(transaction)}
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
    disableActions,
    showDivider = false
}) => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const amountColor = getAmountColor(transaction.transaction_type);

    return (
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
                transform: 'translateY(-1px)'
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
                    />

                    {transaction.description && (
                        <Text
                            fontSize="sm"
                            noOfLines={2}
                            color={useColorModeValue('gray.700', 'gray.200')}
                        >
                            {transaction.description}
                        </Text>
                    )}
                </VStack>

                {/* Monto y acciones */}
                <VStack spacing={2} align="flex-end" minW="120px">
                    <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color={amountColor}
                    >
                        {formatCurrency(transaction.amount)}
                    </Text>

                    <TransactionActions
                        onEdit={onEdit}
                        onDelete={onDelete}
                        disableActions={disableActions}
                        transaction={transaction}
                    />
                </VStack>
            </HStack>

            {showDivider && <Divider mt={3} opacity={0.3} />}
        </Box>
    );
};

// 🎯 COMPONENTE PRINCIPAL
export default function HistoryList({
    items = [],
    onEdit,
    onDelete,
    disableActions = false,
    isLoading = false,
    error = null,
    loadingCount = 5,
    emptyMessage = "No hay movimientos aún"
}) {
    // 🎯 Estados de renderizado
    if (error) {
        return <ErrorState message={error} />;
    }

    if (isLoading) {
        return <LoadingSkeleton count={loadingCount} />;
    }

    if (!items.length) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <Stack spacing={3}>
            {items.map((transaction, index) => (
                <TransactionItem
                    key={transaction.id || `tx-${index}`}
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disableActions={disableActions}
                    showDivider={index < items.length - 1}
                />
            ))}
        </Stack>
    );
}

// 🎯 COMPONENTES ADICIONALES PARA REUTILIZACIÓN
export const TransactionTypeBadge = ({ type, size = "sm" }) => {
    const badgeConfig = getTypeBadge(type);
    return (
        <Badge colorScheme={badgeConfig.colorScheme} size={size}>
            {badgeConfig.label}
        </Badge>
    );
};

export const TransactionAmount = ({ amount, type, size = "lg" }) => {
    const amountColor = getAmountColor(type);
    return (
        <Text
            fontWeight="bold"
            fontSize={size}
            color={amountColor}
        >
            {formatCurrency(amount)}
        </Text>
    );
};

// 🎯 HOOK PERSONALIZADO PARA ESTILOS
export const useTransactionStyles = () => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const mutedColor = useColorModeValue('gray.600', 'gray.300');
    const textColor = useColorModeValue('gray.700', 'gray.200');

    return {
        cardBg,
        borderColor,
        mutedColor,
        textColor
    };
};