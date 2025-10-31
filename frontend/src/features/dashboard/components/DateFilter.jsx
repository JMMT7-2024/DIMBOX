// src/features/dashboard/components/DateFilter.jsx - VERSIÓN MEJORADA
import React, { useMemo, useCallback } from 'react';
import {
    Button,
    Text,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    VStack,
    HStack,
    Badge,
    Tooltip,
    useBreakpointValue,
    Icon
} from '@chakra-ui/react';
import {
    FiCalendar,
    FiChevronDown,
    FiClock,
    FiTrendingUp,
    FiFilter
} from 'react-icons/fi';

const DateFilter = ({
    period = 'month',
    onPeriodChange,
    transactionCount = 0,
    showCount = false,
    size = "sm",
    variant = "outline",
    isDisabled = false
}) => {
    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ OPCIONES DE PERIODO MEJORADAS
    const PERIOD_OPTIONS = useMemo(() => [
        {
            value: 'today',
            label: 'Hoy',
            description: 'Transacciones de hoy',
            icon: FiClock,
            shortLabel: 'Hoy'
        },
        {
            value: 'yesterday',
            label: 'Ayer',
            description: 'Transacciones de ayer',
            icon: FiClock,
            shortLabel: 'Ayer'
        },
        {
            value: 'week',
            label: 'Esta semana',
            description: 'Transacciones de esta semana',
            icon: FiTrendingUp,
            shortLabel: 'Semana'
        },
        {
            value: 'last_week',
            label: 'Semana pasada',
            description: 'Transacciones de la semana pasada',
            icon: FiTrendingUp,
            shortLabel: 'Sem. pasada'
        },
        {
            value: 'month',
            label: 'Este mes',
            description: 'Transacciones de este mes',
            icon: FiCalendar,
            shortLabel: 'Mes'
        },
        {
            value: 'last_month',
            label: 'Mes pasado',
            description: 'Transacciones del mes pasado',
            icon: FiCalendar,
            shortLabel: 'Mes pasado'
        },
        {
            value: 'quarter',
            label: 'Este trimestre',
            description: 'Transacciones de este trimestre',
            icon: FiFilter,
            shortLabel: 'Trimestre'
        },
        {
            value: 'all',
            label: 'Todos los periodos',
            description: 'Todas las transacciones',
            icon: FiFilter,
            shortLabel: 'Todos'
        }
    ], []);

    // ✅ TEXTO PARA MOSTRAR
    const displayConfig = useMemo(() => {
        const option = PERIOD_OPTIONS.find(opt => opt.value === period);
        return {
            label: isMobile ? option?.shortLabel : option?.label,
            icon: option?.icon || FiCalendar,
            description: option?.description
        };
    }, [period, PERIOD_OPTIONS, isMobile]);

    // ✅ MANEJAR CAMBIO DE PERIODO
    const handlePeriodChange = useCallback((newPeriod) => {
        onPeriodChange?.(newPeriod);
    }, [onPeriodChange]);

    // ✅ RENDERIZAR BOTÓN PRINCIPAL
    const renderTriggerButton = () => (
        <Tooltip
            label={displayConfig.description}
            hasArrow
            placement="top"
            isDisabled={isDisabled}
        >
            <Button
                size={size}
                variant={variant}
                leftIcon={<Icon as={displayConfig.icon} />}
                rightIcon={<FiChevronDown />}
                minW={isMobile ? "140px" : "180px"}
                isDisabled={isDisabled}
                colorScheme="blue"
                _hover={{
                    bg: variant === 'outline' ? 'blue.50' : 'blue.100',
                    transform: 'translateY(-1px)'
                }}
                transition="all 0.2s"
            >
                <HStack spacing={2} flex={1} justify="space-between">
                    <Text
                        fontSize="sm"
                        fontWeight="medium"
                        noOfLines={1}
                        flex={1}
                        textAlign="left"
                    >
                        {displayConfig.label}
                    </Text>

                    {/* CONTADOR DE TRANSACCIONES */}
                    {showCount && transactionCount > 0 && (
                        <Badge
                            colorScheme="blue"
                            variant="solid"
                            fontSize="2xs"
                            minW={6}
                            textAlign="center"
                        >
                            {transactionCount}
                        </Badge>
                    )}
                </HStack>
            </Button>
        </Tooltip>
    );

    // ✅ RENDERIZAR OPCIONES DEL POPOVER
    const renderPeriodOptions = () => (
        <VStack spacing={1} align="stretch">
            {/* HEADER INFORMATIVO */}
            <HStack justify="space-between" align="center" pb={2} borderBottom="1px" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    Filtrar por período
                </Text>
                {showCount && transactionCount > 0 && (
                    <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                        {transactionCount} transacciones
                    </Badge>
                )}
            </HStack>

            {/* OPCIONES DE PERIODO */}
            {PERIOD_OPTIONS.map(option => {
                const isSelected = period === option.value;
                return (
                    <Tooltip
                        key={option.value}
                        label={option.description}
                        placement="left"
                        hasArrow
                    >
                        <Button
                            size="sm"
                            variant={isSelected ? "solid" : "ghost"}
                            colorScheme={isSelected ? "green" : "gray"}
                            justifyContent="flex-start"
                            onClick={() => handlePeriodChange(option.value)}
                            leftIcon={<Icon as={option.icon} />}
                            _hover={{
                                bg: isSelected ? 'green.100' : 'gray.50',
                                transform: 'translateX(2px)'
                            }}
                            transition="all 0.2s"
                        >
                            <HStack justify="space-between" width="100%">
                                <Text fontSize="sm">{option.label}</Text>
                                {isSelected && (
                                    <Badge colorScheme="green" variant="subtle" fontSize="2xs">
                                        ✓
                                    </Badge>
                                )}
                            </HStack>
                        </Button>
                    </Tooltip>
                );
            })}

            {/* FOOTER INFORMATIVO */}
            <Text fontSize="xs" color="gray.500" pt={2} borderTop="1px" borderColor="gray.100">
                Los datos se filtran en tiempo real
            </Text>
        </VStack>
    );

    return (
        <Popover
            placement="bottom-start"
            isLazy
            lazyBehavior="keepMounted"
        >
            <PopoverTrigger>
                {renderTriggerButton()}
            </PopoverTrigger>

            <PopoverContent
                zIndex={9999}
                minW="250px"
                maxW="300px"
                shadow="xl"
                borderColor="blue.100"
            >
                <PopoverBody p={3}>
                    {renderPeriodOptions()}
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

// ✅ PROPS POR DEFECTO
DateFilter.defaultProps = {
    period: 'month',
    onPeriodChange: (period) => console.log('Periodo cambiado:', period),
    transactionCount: 0,
    showCount: false,
    size: "sm",
    variant: "outline",
    isDisabled: false
};

export default DateFilter;