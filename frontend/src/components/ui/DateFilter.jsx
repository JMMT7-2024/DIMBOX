// src/components/DateFilter.jsx - VERSIÓN OPTIMIZADA
import React, { useMemo } from 'react';
import {
    HStack, Button, IconButton,
    Popover, PopoverTrigger, PopoverContent, PopoverBody,
    VStack, useDisclosure, Box, Text,
    useOutsideClick
} from '@chakra-ui/react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PERIOD_OPTIONS = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Esta semana' },
    { value: 'last_week', label: 'Semana pasada' },
    { value: 'month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: 'all', label: 'Todos' },
    { value: 'custom', label: 'Personalizado' }
];

const DateFilter = ({
    period = 'month',
    onPeriodChange,
    dateRange = { start: '', end: '' },
    onDateRangeChange
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const ref = React.useRef();

    // ✅ Cerrar al hacer click fuera
    useOutsideClick({
        ref: ref,
        handler: onClose,
    });

    const displayText = useMemo(() => {
        if (period === 'custom' && dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start).toLocaleDateString('es-ES');
            const end = new Date(dateRange.end).toLocaleDateString('es-ES');
            return `${start} - ${end}`;
        }
        return PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Seleccionar periodo';
    }, [period, dateRange]);

    // ✅ Manejo seguro de cambios
    const handlePeriodChange = (newPeriod) => {
        if (onPeriodChange && typeof onPeriodChange === 'function') {
            onPeriodChange(newPeriod);
        }
        if (newPeriod !== 'custom') {
            onClose();
        }
    };

    const handleDateRangeChange = (newDateRange) => {
        if (onDateRangeChange && typeof onDateRangeChange === 'function') {
            onDateRangeChange(newDateRange);
        }
    };

    const handleApplyCustom = () => {
        if (dateRange.start && dateRange.end) {
            handlePeriodChange('custom');
            onClose();
        }
    };

    return (
        <HStack spacing={2} position="relative" ref={ref}>
            <Button
                size="sm"
                variant="outline"
                leftIcon={<FiCalendar />}
                onClick={onOpen}
                minW="160px"
                justifyContent="flex-start"
                bg="white"
                _hover={{ bg: 'gray.50' }}
            >
                <Text isTruncated maxW="130px" fontSize="sm">
                    {displayText}
                </Text>
            </Button>

            {isOpen && (
                <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    mt={2}
                    zIndex={1500}
                    bg="white"
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    shadow="xl"
                    p={3}
                    minW="220px"
                >
                    <VStack spacing={3} align="stretch">
                        <Text fontSize="sm" fontWeight="bold" color="gray.700">
                            Filtrar por periodo
                        </Text>

                        {/* Opciones predefinidas */}
                        <VStack spacing={1} align="stretch" maxH="200px" overflowY="auto">
                            {PERIOD_OPTIONS.filter(opt => opt.value !== 'custom').map(option => (
                                <Button
                                    key={option.value}
                                    size="sm"
                                    variant={period === option.value ? "solid" : "ghost"}
                                    colorScheme={period === option.value ? "blue" : "gray"}
                                    justifyContent="flex-start"
                                    onClick={() => handlePeriodChange(option.value)}
                                    _hover={{ bg: 'gray.50' }}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </VStack>

                        {/* Selector de fecha personalizado */}
                        <Box pt={3} borderTop="1px" borderColor="gray.100">
                            <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.700">
                                Rango personalizado
                            </Text>
                            <VStack spacing={3}>
                                <Box width="100%">
                                    <Text fontSize="xs" color="gray.600" mb={1} fontWeight="medium">
                                        Desde:
                                    </Text>
                                    <input
                                        type="date"
                                        value={dateRange.start || ''}
                                        onChange={(e) => handleDateRangeChange({
                                            ...dateRange,
                                            start: e.target.value
                                        })}
                                        style={{
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '6px',
                                            padding: '6px 8px',
                                            fontSize: '13px',
                                            width: '100%',
                                            backgroundColor: '#fafafa'
                                        }}
                                    />
                                </Box>
                                <Box width="100%">
                                    <Text fontSize="xs" color="gray.600" mb={1} fontWeight="medium">
                                        Hasta:
                                    </Text>
                                    <input
                                        type="date"
                                        value={dateRange.end || ''}
                                        onChange={(e) => handleDateRangeChange({
                                            ...dateRange,
                                            end: e.target.value
                                        })}
                                        style={{
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '6px',
                                            padding: '6px 8px',
                                            fontSize: '13px',
                                            width: '100%',
                                            backgroundColor: '#fafafa'
                                        }}
                                    />
                                </Box>
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={handleApplyCustom}
                                    isDisabled={!dateRange.start || !dateRange.end}
                                    width="100%"
                                    mt={2}
                                >
                                    Aplicar rango
                                </Button>
                            </VStack>
                        </Box>
                    </VStack>
                </Box>
            )}
        </HStack>
    );
};

export default DateFilter;