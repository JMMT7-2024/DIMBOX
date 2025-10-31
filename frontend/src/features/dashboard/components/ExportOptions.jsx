// src/features/dashboard/components/ExportOptions.jsx - VERSIÓN MEJORADA
import React, { useMemo, useCallback } from 'react';
import {
    Menu, MenuButton, MenuList, MenuItem, useToast,
    IconButton, Tooltip, useDisclosure,
    Badge, HStack, Text, VStack, Box,
    MenuGroup, MenuDivider, Alert, AlertIcon,
    useBreakpointValue
} from '@chakra-ui/react';
import {
    FiDownload,
    FiFileText,
    FiDollarSign,
    FiPieChart,
    FiUser,
    FiTrendingUp,
    FiTrendingDown,
    FiBarChart2,
    FiCalendar,
    FiLock,
    FiStar
} from 'react-icons/fi';

const ExportOptions = ({
    onExport,
    transactionsCount = 0,
    isPremium = false,
    isLoading = false,
    availableFormats = ['csv', 'pdf'],
    userName = "",
    size = "sm",
    variant = "outline"
}) => {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ OPCIONES DE EXPORTACIÓN MEJORADAS
    const exportOptions = useMemo(() => [
        {
            type: 'full',
            label: 'Reporte Completo',
            description: 'Todas las transacciones con detalles completos',
            icon: FiFileText,
            premium: false,
            formats: ['csv', 'pdf'],
            colorScheme: 'blue'
        },
        {
            type: 'income',
            label: 'Solo Ingresos',
            description: 'Exportar únicamente transacciones de ingresos',
            icon: FiTrendingUp,
            premium: true,
            formats: ['csv', 'pdf'],
            colorScheme: 'green'
        },
        {
            type: 'expenses',
            label: 'Solo Gastos',
            description: 'Exportar únicamente transacciones de gastos',
            icon: FiTrendingDown,
            premium: true,
            formats: ['csv', 'pdf'],
            colorScheme: 'red'
        },
        {
            type: 'categories',
            label: 'Análisis por Categoría',
            description: 'Reporte agrupado por categorías con análisis',
            icon: FiPieChart,
            premium: true,
            formats: ['csv', 'pdf'],
            colorScheme: 'purple'
        },
        {
            type: 'monthly',
            label: 'Resumen Mensual',
            description: 'Resumen ejecutivo por meses',
            icon: FiCalendar,
            premium: true,
            formats: ['pdf'],
            colorScheme: 'orange'
        },
        {
            type: 'trends',
            label: 'Análisis de Tendencias',
            description: 'Análisis avanzado de tendencias financieras',
            icon: FiBarChart2,
            premium: true,
            formats: ['pdf'],
            colorScheme: 'teal'
        }
    ], []);

    // ✅ MANEJAR EXPORTACIÓN
    const handleExport = useCallback((type, format = 'csv') => {
        // Validar si hay datos
        if (transactionsCount === 0) {
            toast({
                title: '📭 Sin datos',
                description: 'No hay transacciones para exportar',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Validar premium
        const option = exportOptions.find(opt => opt.type === type);
        if (option?.premium && !isPremium) {
            toast({
                title: '⭐ Función Premium',
                description: 'Actualiza tu cuenta para acceder a exportaciones avanzadas',
                status: 'info',
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        // Validar formato disponible
        if (!option?.formats.includes(format)) {
            toast({
                title: 'Formato no disponible',
                description: `El formato ${format} no está disponible para este reporte`,
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Ejecutar exportación
        onExport?.(type, {
            format,
            userName,
            timestamp: new Date().toISOString(),
            transactionCount: transactionsCount,
            isPremium
        });

        onClose();

        // Feedback de éxito
        toast({
            title: '📥 Exportación iniciada',
            description: `Generando ${option.label} en formato ${format.toUpperCase()}`,
            status: 'info',
            duration: 2000,
            isClosable: true,
        });
    }, [transactionsCount, isPremium, exportOptions, onExport, userName, toast, onClose]);

    // ✅ RENDERIZAR BADGE PREMIUM
    const renderPremiumBadge = (option) => {
        if (!option.premium) return null;

        return (
            <Badge
                colorScheme="purple"
                variant={isPremium ? "solid" : "outline"}
                fontSize="2xs"
                ml={2}
            >
                <HStack spacing={1}>
                    {isPremium ? <FiStar size={8} /> : <FiLock size={8} />}
                    {!isMobile && <Text>Premium</Text>}
                </HStack>
            </Badge>
        );
    };

    // ✅ RENDERIZAR FORMATOS DISPONIBLES
    const renderFormatOptions = (option) => (
        <HStack spacing={1} mt={1}>
            {option.formats.map(format => (
                <Badge
                    key={format}
                    colorScheme="gray"
                    variant="subtle"
                    fontSize="2xs"
                    cursor="pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleExport(option.type, format);
                    }}
                    _hover={{ bg: 'gray.200' }}
                >
                    {format.toUpperCase()}
                </Badge>
            ))}
        </HStack>
    );

    // ✅ RENDERIZAR MENÚ PRINCIPAL
    const renderMenuContent = () => (
        <MenuList
            zIndex="modal"
            minW="280px"
            maxW="320px"
            py={2}
        >
            {/* HEADER INFORMATIVO */}
            <MenuGroup title="📊 Opciones de Exportación">
                <VStack spacing={1} px={3} pb={2} align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.600">
                            Transacciones disponibles:
                        </Text>
                        <Badge
                            colorScheme={transactionsCount > 0 ? "blue" : "gray"}
                            variant="subtle"
                            fontSize="2xs"
                        >
                            {transactionsCount}
                        </Badge>
                    </HStack>

                    {userName && (
                        <Text fontSize="2xs" color="gray.500">
                            Usuario: {userName}
                        </Text>
                    )}
                </VStack>
            </MenuGroup>

            <MenuDivider />

            {/* OPCIONES DE EXPORTACIÓN */}
            {exportOptions.map((option) => {
                const isDisabled = (option.premium && !isPremium) || transactionsCount === 0;

                return (
                    <Tooltip
                        key={option.type}
                        label={
                            isDisabled
                                ? option.premium && !isPremium
                                    ? "Función Premium - Actualiza tu cuenta"
                                    : "No hay transacciones para exportar"
                                : option.description
                        }
                        placement="left"
                        hasArrow
                    >
                        <MenuItem
                            icon={<option.icon />}
                            onClick={() => !isDisabled && handleExport(option.type)}
                            isDisabled={isDisabled}
                            py={2}
                            _hover={!isDisabled ? { bg: `${option.colorScheme}.50` } : {}}
                        >
                            <VStack align="start" spacing={0} flex={1}>
                                <HStack justify="space-between" width="100%">
                                    <Text fontSize="sm" fontWeight="medium">
                                        {option.label}
                                    </Text>
                                    {renderPremiumBadge(option)}
                                </HStack>

                                <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                    {option.description}
                                </Text>

                                {!isDisabled && renderFormatOptions(option)}
                            </VStack>
                        </MenuItem>
                    </Tooltip>
                );
            })}

            {/* ALERTA PARA USUARIOS NO PREMIUM */}
            {!isPremium && (
                <>
                    <MenuDivider />
                    <Box px={3} py={2}>
                        <Alert status="info" size="sm" borderRadius="md">
                            <AlertIcon boxSize={3} />
                            <Box flex="1">
                                <Text fontSize="2xs" fontWeight="bold">
                                    Actualiza a Premium
                                </Text>
                                <Text fontSize="2xs">
                                    Desbloquea todas las funciones de exportación
                                </Text>
                            </Box>
                        </Alert>
                    </Box>
                </>
            )}
        </MenuList>
    );

    return (
        <Menu
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            placement="bottom-end"
            isLazy
        >
            <Tooltip
                label={
                    transactionsCount === 0
                        ? "No hay transacciones para exportar"
                        : "Exportar reportes y análisis"
                }
                hasArrow
            >
                <MenuButton
                    as={IconButton}
                    icon={<FiDownload />}
                    variant={variant}
                    size={size}
                    aria-label="Opciones de exportación"
                    isLoading={isLoading}
                    isDisabled={transactionsCount === 0}
                    colorScheme="blue"
                    _hover={{
                        bg: variant === 'outline' ? 'blue.50' : 'blue.100',
                        transform: 'translateY(-1px)'
                    }}
                    transition="all 0.2s"
                />
            </Tooltip>

            {renderMenuContent()}
        </Menu>
    );
};

// ✅ PROPS POR DEFECTO MEJORADOS
ExportOptions.defaultProps = {
    onExport: (type, metadata) => {
        console.log('Exportando:', type, metadata);
        // Implementación por defecto
    },
    transactionsCount: 0,
    isPremium: false,
    isLoading: false,
    availableFormats: ['csv', 'pdf'],
    userName: "",
    size: "sm",
    variant: "outline"
};

export default ExportOptions;