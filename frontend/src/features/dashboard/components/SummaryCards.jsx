// src/features/dashboard/components/SummaryCards.jsx - VERSIÓN CORREGIDA Y SIMPLIFICADA
import React, { useMemo } from 'react';
import {
    HStack, Text, Box, useColorModeValue, VStack,
    useBreakpointValue, Badge, Tooltip, Skeleton,
    Fade, ScaleFade
} from '@chakra-ui/react';
import {
    FiArrowUpRight,
    FiArrowDownRight,
    FiDollarSign,
    FiTrendingUp,
    FiTrendingDown,
    FiInfo,
    FiTarget
} from 'react-icons/fi';

// ✅ CONFIGURACIÓN CENTRALIZADA
const CARD_CONFIG = {
    currency: {
        locale: 'es-PE',
        currency: 'PEN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    },
    formats: {
        million: 1000000,
        thousand: 1000
    }
};

// ✅ HOOKS PERSONALIZADOS
const useSummaryCardStyles = () => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const subtleTextColor = useColorModeValue('gray.600', 'gray.400');

    return {
        bgColor,
        borderColor,
        subtleTextColor
    };
};

const useCurrencyFormatter = () => {
    const formatter = useMemo(() =>
        new Intl.NumberFormat(
            CARD_CONFIG.currency.locale,
            CARD_CONFIG.currency
        ), []);

    const formatValue = (val) => {
        const absVal = Math.abs(val);

        if (absVal >= CARD_CONFIG.formats.million) {
            return `S/ ${(val / CARD_CONFIG.formats.million).toFixed(1)}M`;
        } else if (absVal >= CARD_CONFIG.formats.thousand) {
            return `S/ ${(val / CARD_CONFIG.formats.thousand).toFixed(1)}K`;
        }
        return formatter.format(val);
    };

    return { formatValue };
};

// ✅ COMPONENTES DE ESTADO
const LoadingSkeleton = ({ isMobile }) => {
    const { bgColor, borderColor } = useSummaryCardStyles();

    if (isMobile) {
        return (
            <HStack spacing={2} w="full" justify="space-between" px={1} py={2}>
                {[1, 2, 3].map(i => (
                    <VStack
                        key={i}
                        spacing={1}
                        align="center"
                        flex="1"
                        minW="0"
                        p={2}
                        bg={bgColor}
                        borderRadius="lg"
                        border="1px"
                        borderColor={borderColor}
                    >
                        <Skeleton height="14px" width="40px" />
                        <Skeleton height="20px" width="60px" />
                    </VStack>
                ))}
            </HStack>
        );
    }

    return (
        <HStack spacing={4} w="full" align="stretch">
            {[1, 2, 3].map(i => (
                <Box
                    key={i}
                    flex="1"
                    bg={bgColor}
                    p={6}
                    borderRadius="xl"
                    border="1px"
                    borderColor={borderColor}
                >
                    <VStack spacing={3} align="start">
                        <Skeleton height="20px" width="100px" />
                        <Skeleton height="32px" width="120px" />
                        <Skeleton height="16px" width="80px" />
                    </VStack>
                </Box>
            ))}
        </HStack>
    );
};

const TrendIndicator = ({ trend, isMobile }) => {
    if (trend === null || trend === undefined) return null;

    const isPositive = trend > 0;
    const colorScheme = isPositive ? 'green' : 'red';
    const IconComponent = isPositive ? FiTrendingUp : FiTrendingDown;

    return (
        <Badge
            colorScheme={colorScheme}
            variant="subtle"
            fontSize={isMobile ? "2xs" : "xs"}
            px={2}
            py={1}
            display="flex"
            alignItems="center"
            gap={1}
        >
            <IconComponent size={isMobile ? 10 : 12} />
            {Math.abs(trend)}%
        </Badge>
    );
};

const BalanceStatus = ({ value, isMobile }) => {
    if (value >= 0) {
        return (
            <Badge
                colorScheme="green"
                variant="subtle"
                fontSize={isMobile ? "2xs" : "xs"}
                px={2}
                py={1}
                borderRadius="full"
            >
                {isMobile ? '✅' : '✅ Saludable'}
            </Badge>
        );
    }

    return (
        <Badge
            colorScheme="orange"
            variant="subtle"
            fontSize={isMobile ? "2xs" : "xs"}
            px={2}
            py={1}
            borderRadius="full"
        >
            {isMobile ? '⚠️' : '⚠️ Por mejorar'}
        </Badge>
    );
};

// ✅ COMPONENTE DE TARJETA MEJORADO
const SummaryCard = React.memo(({
    label,
    value,
    color,
    icon: Icon,
    isMobile,
    trend = null,
    description = null,
    isLoading = false,
    index = 0,
    onClick
}) => {
    const { bgColor, borderColor, subtleTextColor } = useSummaryCardStyles();
    const { formatValue } = useCurrencyFormatter();

    const cardStyles = {
        flex: "1",
        bg: bgColor,
        borderRadius: isMobile ? "lg" : "xl",
        border: "1px",
        borderColor: borderColor,
        shadow: "md",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.3s ease-in-out",
        _hover: onClick ? {
            shadow: "lg",
            transform: "translateY(-2px)"
        } : {}
    };

    const mobileStyles = isMobile ? {
        minW: "0",
        p: 2
    } : {
        p: 6
    };

    // ✅ RENDERIZADO MÓVIL
    if (isMobile) {
        return (
            <Tooltip label={description || label} hasArrow isDisabled={isLoading}>
                <VStack
                    {...cardStyles}
                    {...mobileStyles}
                    spacing={1}
                    align="center"
                    onClick={onClick}
                >
                    {isLoading ? (
                        <>
                            <Skeleton height="14px" width="40px" />
                            <Skeleton height="20px" width="60px" />
                        </>
                    ) : (
                        <>
                            {/* ICONO Y LABEL */}
                            <HStack spacing={1}>
                                <Icon size={14} color={color} />
                                <Text
                                    fontSize="xs"
                                    color={subtleTextColor}
                                    fontWeight="medium"
                                    noOfLines={1}
                                >
                                    {label}
                                </Text>
                            </HStack>

                            {/* VALOR PRINCIPAL */}
                            <Text
                                fontSize="lg"
                                fontWeight="bold"
                                color={color}
                                noOfLines={1}
                                textAlign="center"
                            >
                                {formatValue(value)}
                            </Text>

                            {/* INDICADORES */}
                            <HStack spacing={1}>
                                {label === 'Balance' && <BalanceStatus value={value} isMobile={true} />}
                                <TrendIndicator trend={trend} isMobile={true} />
                            </HStack>
                        </>
                    )}
                </VStack>
            </Tooltip>
        );
    }

    // ✅ RENDERIZADO DESKTOP
    return (
        <ScaleFade in={!isLoading} delay={index * 0.1}>
            <Box
                {...cardStyles}
                {...mobileStyles}
                onClick={onClick}
            >
                {/* ELEMENTO DECORATIVO SUPERIOR */}
                <Box
                    position="absolute"
                    top="0"
                    left="0"
                    w="full"
                    h="1"
                    bg={color}
                    opacity="0.8"
                />

                {isLoading ? (
                    <VStack spacing={3} align="start">
                        <Skeleton height="20px" width="100px" />
                        <Skeleton height="32px" width="120px" />
                        <Skeleton height="16px" width="80px" />
                    </VStack>
                ) : (
                    <VStack spacing={3} align="start">
                        {/* HEADER CON ICONO Y LABEL */}
                        <HStack spacing={2} w="full" justify="space-between">
                            <HStack spacing={2}>
                                <Box
                                    p={2}
                                    borderRadius="lg"
                                    bg={`${color.replace('.500', '.100')}`}
                                    color={color}
                                >
                                    <Icon size={18} />
                                </Box>
                                <Text
                                    fontSize="md"
                                    color={subtleTextColor}
                                    fontWeight="semibold"
                                >
                                    {label}
                                </Text>
                                {description && (
                                    <Tooltip label={description} hasArrow>
                                        <Box>
                                            <FiInfo size={14} color={subtleTextColor} />
                                        </Box>
                                    </Tooltip>
                                )}
                            </HStack>

                            <TrendIndicator trend={trend} isMobile={false} />
                        </HStack>

                        {/* VALOR PRINCIPAL */}
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color={color}
                            lineHeight="1.2"
                        >
                            {formatValue(value)}
                        </Text>

                        {/* INDICADORES ADICIONALES */}
                        {label === 'Balance' && (
                            <BalanceStatus value={value} isMobile={false} />
                        )}

                        {/* META O OBJETIVO (OPCIONAL) */}
                        {label === 'Ingresos' && value > 0 && (
                            <Text fontSize="xs" color={subtleTextColor}>
                                <FiTarget size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                {value >= 5000 ? '¡Meta superada! 🎯' : 'En camino a la meta'}
                            </Text>
                        )}
                    </VStack>
                )}
            </Box>
        </ScaleFade>
    );
});

// ✅ COMPONENTE PRINCIPAL MEJORADO
export default function SummaryCards({
    income = 0,
    expense = 0,
    balance = 0,
    trends = {},
    isLoading = false,
    onCardClick,
    showGoals = false
}) {
    const isMobile = useBreakpointValue({ base: true, md: false });
    const containerBg = useColorModeValue('transparent', 'transparent');

    // ✅ DATOS MEJORADOS CON MÁS INFORMACIÓN
    const items = useMemo(() => [
        {
            label: 'Ingresos',
            value: income,
            color: 'green.500',
            icon: FiArrowUpRight,
            trend: trends.income,
            description: showGoals && income > 0
                ? `Meta: S/ 5,000 | Progreso: ${((income / 5000) * 100).toFixed(0)}%`
                : 'Total de ingresos este periodo'
        },
        {
            label: 'Gastos',
            value: expense,
            color: 'red.500',
            icon: FiArrowDownRight,
            trend: trends.expense,
            description: expense > 0 ? `Promedio diario: S/ ${(expense / 30).toFixed(0)}` : 'Sin gastos registrados'
        },
        {
            label: 'Balance',
            value: balance,
            color: balance >= 0 ? 'blue.500' : 'orange.500',
            icon: FiDollarSign,
            trend: trends.balance,
            description: balance >= 0 ? 'Finanzas positivas 🎉' : 'Revisa tus gastos 📊'
        },
    ], [income, expense, balance, trends, showGoals]);

    if (isLoading) {
        return <LoadingSkeleton isMobile={isMobile} />;
    }

    return (
        <Fade in={!isLoading}>
            <Box bg={containerBg} w="full">
                {isMobile ? (
                    <HStack spacing={2} w="full" justify="space-between" px={1} py={2}>
                        {items.map((item, index) => (
                            <SummaryCard
                                key={item.label}
                                {...item}
                                isMobile={true}
                                index={index}
                                onClick={() => onCardClick?.(item.label)}
                            />
                        ))}
                    </HStack>
                ) : (
                    <HStack spacing={4} w="full" align="stretch">
                        {items.map((item, index) => (
                            <SummaryCard
                                key={item.label}
                                {...item}
                                isMobile={false}
                                index={index}
                                onClick={() => onCardClick?.(item.label)}
                            />
                        ))}
                    </HStack>
                )}
            </Box>
        </Fade>
    );
}

// ✅ PROPS POR DEFECTO MEJORADOS
SummaryCards.defaultProps = {
    income: 0,
    expense: 0,
    balance: 0,
    trends: {
        income: null,
        expense: null,
        balance: null
    },
    isLoading: false,
    showGoals: false,
    onCardClick: null
};

// ✅ COMPONENTES ADICIONALES PARA REUTILIZACIÓN
export const IncomeCard = ({ value, trend, isLoading, onClick }) => (
    <SummaryCard
        label="Ingresos"
        value={value}
        color="green.500"
        icon={FiArrowUpRight}
        trend={trend}
        description="Total de ingresos"
        isLoading={isLoading}
        onClick={onClick}
    />
);

export const ExpenseCard = ({ value, trend, isLoading, onClick }) => (
    <SummaryCard
        label="Gastos"
        value={value}
        color="red.500"
        icon={FiArrowDownRight}
        trend={trend}
        description="Total de gastos"
        isLoading={isLoading}
        onClick={onClick}
    />
);

export const BalanceCard = ({ value, trend, isLoading, onClick }) => (
    <SummaryCard
        label="Balance"
        value={value}
        color={value >= 0 ? 'blue.500' : 'orange.500'}
        icon={FiDollarSign}
        trend={trend}
        description={value >= 0 ? 'Finanzas positivas' : 'Revisa tus gastos'}
        isLoading={isLoading}
        onClick={onClick}
    />
);