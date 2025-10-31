import React, { useMemo } from 'react';
import {
    Box, VStack, HStack, Text, useColorModeValue,
    Progress, Tooltip, SimpleGrid, Flex
} from '@chakra-ui/react';
import { FiTrendingUp, FiPieChart, FiBarChart2 } from 'react-icons/fi';

// ✅ MOVER FUERA DEL COMPONENTE PARA EVITAR RECREACIONES
const PEN = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

// ✅ PALETA DE COLORES CONSTANTE
const PROFESSIONAL_COLORS = [
    '#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c',
    '#0891b2', '#ca8a04', '#475569', '#db2777', '#65a30d',
    '#7e22ce', '#e11d48', '#0f766e', '#4338ca', '#ca8a04'
];

// ✅ FUNCIÓN HELPER PARA VALIDACIÓN
const isValidDataItem = (item) => {
    return item &&
        typeof item === 'object' &&
        item.name &&
        typeof item.name === 'string' &&
        (typeof item.value === 'number' || typeof item.value === 'string') &&
        !isNaN(Number(item.value)) &&
        Number(item.value) > 0;
};

export default function CategoryChart({ data = [], showHeader = true, maxItems = 8 }) {
    // ✅ TODOS LOS HOOKS AL INICIO - CORRECTO
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
    const mutedBg = useColorModeValue('gray.50', 'gray.700');
    const otherCategoryColor = useColorModeValue('gray.400', 'gray.500');

    // ✅ CÁLCULOS OPTIMIZADOS CON VALIDACIÓN ROBUSTA
    const { total, sortedData, otherCategoriesTotal } = useMemo(() => {
        try {
            // Validación exhaustiva de datos de entrada
            if (!data || !Array.isArray(data)) {
                return { total: 0, sortedData: [], otherCategoriesTotal: 0 };
            }

            const validData = data.filter(isValidDataItem);

            if (validData.length === 0) {
                return { total: 0, sortedData: [], otherCategoriesTotal: 0 };
            }

            const totalValue = validData.reduce((sum, item) => {
                return sum + Number(item.value);
            }, 0);

            const sorted = [...validData]
                .sort((a, b) => Number(b.value) - Number(a.value));

            const otherTotal = sorted.slice(maxItems)
                .reduce((sum, item) => sum + Number(item.value), 0);

            return {
                total: totalValue,
                sortedData: sorted,
                otherCategoriesTotal: otherTotal
            };
        } catch (error) {
            console.error('Error processing chart data:', error);
            return { total: 0, sortedData: [], otherCategoriesTotal: 0 };
        }
    }, [data, maxItems]);

    // ✅ ESTADO VACÍO MEJORADO
    const isEmptyState = useMemo(() => {
        return sortedData.length === 0 || total === 0;
    }, [sortedData.length, total]);

    // ✅ DATOS A MOSTRAR
    const displayData = useMemo(() => {
        if (isEmptyState) return [];

        const mainData = sortedData.slice(0, maxItems);

        // Agregar categoría "Otras" si hay más elementos
        if (sortedData.length > maxItems && otherCategoriesTotal > 0) {
            return [
                ...mainData,
                {
                    name: 'Otras categorías',
                    value: otherCategoriesTotal,
                    isOther: true
                }
            ];
        }

        return mainData;
    }, [sortedData, maxItems, otherCategoriesTotal, isEmptyState]);

    // ✅ FUNCIÓN PARA OBTENER COLOR - SEGURA
    const getItemColor = (item, index) => {
        if (item.isOther) {
            return otherCategoryColor;
        }
        return PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length];
    };

    // ✅ RENDERIZADO DE ESTADO VACÍO
    if (isEmptyState) {
        return (
            <Box
                bg={cardBg}
                border="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={8}
                textAlign="center"
                height="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="200px"
            >
                <VStack spacing={4} color={subtleTextColor}>
                    <Box transform="scale(1.2)" opacity={0.7}>
                        <FiBarChart2 size={32} />
                    </Box>
                    <VStack spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                            Sin datos de gastos
                        </Text>
                        <Text fontSize="xs" maxW="200px" textAlign="center" opacity={0.8}>
                            Los gastos registrados aparecerán en este análisis
                        </Text>
                    </VStack>
                </VStack>
            </Box>
        );
    }

    // ✅ RENDERIZADO PRINCIPAL
    return (
        <VStack spacing={4} align="stretch" height="full">
            {/* HEADER PROFESIONAL MEJORADO */}
            {showHeader && (
                <Flex
                    justify="space-between"
                    align="center"
                    pb={3}
                    borderBottom="1px"
                    borderColor={borderColor}
                >
                    <HStack spacing={3}>
                        <Box
                            p={2}
                            borderRadius="md"
                            bg="blue.50"
                            color="blue.600"
                        >
                            <FiTrendingUp size={16} />
                        </Box>
                        <VStack spacing={0} align="start">
                            <Text fontWeight="bold" fontSize="sm" color={textColor}>
                                DISTRIBUCIÓN DE GASTOS
                            </Text>
                            <Text fontSize="xs" color={subtleTextColor}>
                                {sortedData.length} categoría{sortedData.length !== 1 ? 's' : ''}
                            </Text>
                        </VStack>
                    </HStack>

                    <Tooltip label={`Total gastado: ${PEN.format(total)}`}>
                        <VStack spacing={0} align="end">
                            <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                {PEN.format(total)}
                            </Text>
                            <Text fontSize="xs" color={subtleTextColor}>
                                Total
                            </Text>
                        </VStack>
                    </Tooltip>
                </Flex>
            )}

            {/* GRÁFICO DE BARRAS OPTIMIZADO */}
            <VStack spacing={4} align="stretch" flex="1">
                {displayData.map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    const color = getItemColor(item, index);

                    return (
                        <Box key={item.name || `item-${index}`}>
                            {/* Información de la categoría */}
                            <Flex justify="space-between" align="center" mb={2}>
                                <HStack spacing={3} flex="1" minW="0">
                                    <Box
                                        w="3"
                                        h="3"
                                        borderRadius="sm"
                                        bg={color}
                                        flexShrink={0}
                                        opacity={item.isOther ? 0.7 : 1}
                                    />
                                    <VStack spacing={0} align="start" minW="0" flex="1">
                                        <Text
                                            fontSize="sm"
                                            fontWeight={item.isOther ? "medium" : "semibold"}
                                            color={item.isOther ? subtleTextColor : textColor}
                                            noOfLines={1}
                                            flex="1"
                                        >
                                            {item.name}
                                        </Text>
                                        {!item.isOther && (
                                            <Text fontSize="xs" color={subtleTextColor}>
                                                {percentage.toFixed(1)}%
                                            </Text>
                                        )}
                                    </VStack>
                                </HStack>

                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color={item.isOther ? subtleTextColor : textColor}
                                    minW="80px"
                                    textAlign="right"
                                >
                                    {PEN.format(item.value)}
                                </Text>
                            </Flex>

                            {/* Barra de progreso */}
                            <Tooltip
                                label={`${item.name}: ${PEN.format(item.value)} (${percentage.toFixed(1)}% del total)`}
                                placement="top"
                            >
                                <Progress
                                    value={percentage}
                                    height="8px"
                                    bg={mutedBg}
                                    borderRadius="full"
                                    sx={{
                                        '& > div': {
                                            backgroundColor: color,
                                            borderRadius: 'full',
                                            transition: 'all 0.3s ease',
                                            opacity: item.isOther ? 0.8 : 1,
                                        }
                                    }}
                                />
                            </Tooltip>
                        </Box>
                    );
                })}
            </VStack>

            {/* FOOTER INFORMATIVO */}
            <Box pt={3} borderTop="1px" borderColor={borderColor}>
                <SimpleGrid columns={2} spacing={3} fontSize="xs">
                    <VStack spacing={1} align="start">
                        <Text color={subtleTextColor} fontWeight="medium">
                            Categorías principales
                        </Text>
                        <HStack spacing={1}>
                            {PROFESSIONAL_COLORS.slice(0, 3).map((color, i) => (
                                <Box
                                    key={i}
                                    w="2"
                                    h="2"
                                    bg={color}
                                    borderRadius="sm"
                                    opacity={0.8}
                                />
                            ))}
                        </HStack>
                    </VStack>

                    <VStack spacing={1} align="end">
                        <Text color={subtleTextColor}>
                            {sortedData.length} de {data.length} mostradas
                        </Text>
                        {sortedData.length > maxItems && (
                            <Text color={subtleTextColor} fontSize="xs">
                                +{sortedData.length - maxItems} en "Otras"
                            </Text>
                        )}
                    </VStack>
                </SimpleGrid>
            </Box>
        </VStack>
    );
}