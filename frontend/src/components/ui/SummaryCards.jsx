// src/components/SummaryCards.jsx - VERSIÓN MEJORADA Y OPTIMIZADA
import React from 'react';
import {
    HStack, Text, Box, useColorModeValue, VStack,
    useBreakpointValue, Badge, Tooltip
} from '@chakra-ui/react';
import {
    FiArrowUpRight,
    FiArrowDownRight,
    FiDollarSign,
    FiTrendingUp,
    FiTrendingDown
} from 'react-icons/fi';

// ✅ FORMATO DE MONEDA MEJORADO
const PEN = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

// ✅ COMPONENTE DE TARJETA INDIVIDUAL PARA MEJOR REUTILIZACIÓN
const SummaryCard = ({
    label,
    value,
    color,
    icon: Icon,
    isMobile,
    trend = null, // ✅ NUEVO: Indicador de tendencia
    description = null // ✅ NUEVO: Descripción adicional
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const subtleTextColor = useColorModeValue('gray.600', 'gray.400');

    // ✅ FORMATO CONDICIONAL PARA VALORES
    const formatValue = (val) => {
        if (Math.abs(val) >= 1000000) {
            return `S/ ${(val / 1000000).toFixed(1)}M`;
        } else if (Math.abs(val) >= 1000) {
            return `S/ ${(val / 1000).toFixed(1)}K`;
        }
        return PEN.format(val);
    };

    // ✅ RENDERIZADO MÓVIL MEJORADO
    if (isMobile) {
        return (
            <Tooltip label={description || label} hasArrow>
                <VStack
                    spacing={1}
                    align="center"
                    flex="1"
                    minW="0"
                    p={2}
                    bg={bgColor}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    shadow="sm"
                    _hover={{
                        shadow: 'md',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                    }}
                >
                    {/* ✅ ICONO Y LABEL */}
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

                    {/* ✅ VALOR PRINCIPAL */}
                    <Text
                        fontSize="lg" // ✅ MÁS GRANDE
                        fontWeight="bold"
                        color={color}
                        noOfLines={1}
                        textAlign="center"
                    >
                        {formatValue(value)}
                    </Text>

                    {/* ✅ INDICADOR DE TENDENCIA (OPCIONAL) */}
                    {trend && (
                        <Badge
                            colorScheme={trend > 0 ? 'green' : 'red'}
                            fontSize="2xs"
                            px={1}
                        >
                            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
                        </Badge>
                    )}
                </VStack>
            </Tooltip>
        );
    }

    // ✅ RENDERIZADO DESKTOP MEJORADO
    return (
        <Box
            flex="1"
            bg={bgColor}
            p={6}
            borderRadius="xl" // ✅ ESQUINAS MÁS REDONDEADAS
            border="1px"
            borderColor={borderColor}
            shadow="md" // ✅ SOMBRA MÁS PRONUNCIADA
            position="relative"
            overflow="hidden"
            _hover={{
                shadow: 'lg',
                transform: 'translateY(-4px)',
                transition: 'all 0.3s ease-in-out'
            }}
        >
            {/* ✅ ELEMENTO DECORATIVO */}
            <Box
                position="absolute"
                top="0"
                left="0"
                w="full"
                h="1"
                bg={`linear-gradient(90deg, ${color}, transparent)`}
                opacity="0.6"
            />

            <VStack spacing={3} align="start">
                {/* ✅ HEADER CON ICONO Y LABEL */}
                <HStack spacing={2} w="full" justify="space-between">
                    <HStack spacing={2}>
                        <Box
                            p={2}
                            borderRadius="lg"
                            bg={`${color}15`} // ✅ COLOR CON TRANSPARENCIA
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
                    </HStack>

                    {/* ✅ BADGE DE TENDENCIA */}
                    {trend && (
                        <Badge
                            colorScheme={trend > 0 ? 'green' : 'red'}
                            variant="subtle"
                            fontSize="xs"
                        >
                            {trend > 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                            {Math.abs(trend)}%
                        </Badge>
                    )}
                </HStack>

                {/* ✅ VALOR PRINCIPAL */}
                <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={color}
                    lineHeight="1.2"
                >
                    {formatValue(value)}
                </Text>

                {/* ✅ DESCRIPCIÓN ADICIONAL */}
                {description && (
                    <Text
                        fontSize="sm"
                        color={subtleTextColor}
                        noOfLines={2}
                    >
                        {description}
                    </Text>
                )}

                {/* ✅ INDICADOR VISUAL DE ESTADO */}
                {label === 'Balance' && (
                    <Badge
                        colorScheme={value >= 0 ? 'green' : 'orange'}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                    >
                        {value >= 0 ? '✅ Saludable' : '⚠️ Por mejorar'}
                    </Badge>
                )}
            </VStack>
        </Box>
    );
};

// ✅ COMPONENTE PRINCIPAL MEJORADO
export default function SummaryCards({
    income = 0,
    expense = 0,
    balance = 0,
    trends = {} // ✅ NUEVO: Tendencias opcionales
}) {
    const isMobile = useBreakpointValue({ base: true, md: false });
    const containerBg = useColorModeValue('transparent', 'transparent');

    // ✅ DATOS MEJORADOS CON DESCRIPCIONES
    const items = [
        {
            label: 'Ingresos',
            value: income,
            color: 'green.500',
            icon: FiArrowUpRight,
            trend: trends.income,
            description: 'Total de ingresos este periodo'
        },
        {
            label: 'Gastos',
            value: expense,
            color: 'red.500',
            icon: FiArrowDownRight,
            trend: trends.expense,
            description: 'Total de gastos este periodo'
        },
        {
            label: 'Balance',
            value: balance,
            color: balance >= 0 ? 'blue.500' : 'orange.500',
            icon: FiDollarSign,
            trend: trends.balance,
            description: balance >= 0 ? 'Finanzas positivas 🎉' : 'Revisa tus gastos 📊'
        },
    ];

    // ✅ CONTENEDOR MEJORADO
    return (
        <Box bg={containerBg} w="full">
            {isMobile ? (
                // ✅ DISEÑO MÓVIL MEJORADO
                <HStack
                    spacing={2}
                    w="full"
                    justify="space-between"
                    px={1}
                    py={2}
                >
                    {items.map((item) => (
                        <SummaryCard
                            key={item.label}
                            {...item}
                            isMobile={true}
                        />
                    ))}
                </HStack>
            ) : (
                // ✅ DISEÑO DESKTOP MEJORADO
                <HStack
                    spacing={4}
                    w="full"
                    align="stretch"
                >
                    {items.map((item) => (
                        <SummaryCard
                            key={item.label}
                            {...item}
                            isMobile={false}
                        />
                    ))}
                </HStack>
            )}
        </Box>
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
    }
};