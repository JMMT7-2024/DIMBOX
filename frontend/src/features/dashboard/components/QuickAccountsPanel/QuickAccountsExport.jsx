// src/components/dashboard/QuickAccountsPanel/QuickAccountsExport.jsx - VERSIÓN MEJORADA
import React, { useMemo } from 'react';
import {
    Button, Text, Popover, PopoverTrigger, PopoverContent, PopoverBody,
    VStack, Card, CardBody, Badge, useDisclosure, HStack,
    Tooltip, Box, Icon, Alert, AlertIcon, Flex
} from '@chakra-ui/react';
import {
    FiDownload,
    FiFileText,
    FiActivity,
    FiDollarSign,
    FiCalendar,
    FiStar,
    FiLock
} from 'react-icons/fi';

const QuickAccountsExport = ({
    onExport,
    accountsCount = 0,
    userName = "",
    isPremium = false,
    hasActiveAccounts = false,
    isLoading = false
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    // ✅ OPCIONES DE EXPORTACIÓN CON ICONOS Y PERMISOS
    const exportOptions = useMemo(() => [
        {
            label: 'Lista Completa de Cuentas',
            description: 'Exporta todas las cuentas rápidas con detalles completos',
            type: 'all_accounts',
            icon: FiFileText,
            available: true, // Disponible para todos
            premiumFeature: false
        },
        {
            label: 'Cuentas Activas',
            description: 'Solo cuentas con saldo pendiente y actividad reciente',
            type: 'active_accounts',
            icon: FiActivity,
            available: hasActiveAccounts,
            premiumFeature: false
        },
        {
            label: 'Resumen de Saldos',
            description: 'Resumen ejecutivo de cuentas por estado y categoría',
            type: 'balance_summary',
            icon: FiDollarSign,
            available: accountsCount > 0,
            premiumFeature: true
        },
        {
            label: 'Próximos Vencimientos',
            description: 'Cuentas con fechas próximas a vencer y recordatorios',
            type: 'upcoming_due',
            icon: FiCalendar,
            available: true,
            premiumFeature: true
        },
        {
            label: 'Reporte Ejecutivo Premium',
            description: 'Análisis completo con gráficos y tendencias',
            type: 'executive_report',
            icon: FiStar,
            available: isPremium,
            premiumFeature: true
        }
    ], [accountsCount, hasActiveAccounts, isPremium]);

    // ✅ CALCULAR SI ESTÁ DESHABILITADO
    const isDisabled = useMemo(() => {
        if (isLoading) return true;
        if (!isPremium && accountsCount === 0) return true;
        return false;
    }, [isLoading, isPremium, accountsCount]);

    // ✅ MANEJAR SELECCIÓN DE EXPORTACIÓN
    const handleExportSelection = (option) => {
        if (!option.available) return;

        onExport(option.type, {
            userName,
            accountsCount,
            isPremium,
            timestamp: new Date().toISOString()
        });
        onClose();
    };

    // ✅ RENDERIZAR TARJETA DE OPCIÓN
    const renderExportOption = (option) => {
        const isOptionDisabled = !option.available;
        const isPremiumLocked = option.premiumFeature && !isPremium;

        return (
            <Tooltip
                key={option.type}
                label={
                    isOptionDisabled
                        ? option.premiumFeature
                            ? "Función Premium - Actualiza tu cuenta para acceder"
                            : "No hay datos disponibles para esta exportación"
                        : `Exportar ${option.label}`
                }
                placement="top"
                hasArrow
            >
                <Card
                    variant="outline"
                    cursor={isOptionDisabled ? 'not-allowed' : 'pointer'}
                    opacity={isOptionDisabled ? 0.6 : 1}
                    _hover={
                        isOptionDisabled
                            ? {}
                            : {
                                bg: 'blue.50',
                                borderColor: 'blue.200',
                                transform: 'translateY(-2px)',
                                shadow: 'sm'
                            }
                    }
                    transition="all 0.2s"
                    onClick={() => !isOptionDisabled && handleExportSelection(option)}
                >
                    <CardBody p={3}>
                        <VStack align="start" spacing={2}>
                            <HStack justify="space-between" width="100%">
                                <HStack spacing={2}>
                                    <Icon as={option.icon} color="blue.500" boxSize={4} />
                                    <Text fontWeight="medium" fontSize="sm">
                                        {option.label}
                                    </Text>
                                </HStack>

                                {/* BADGES DE ESTADO */}
                                <HStack spacing={1}>
                                    {option.premiumFeature && (
                                        <Badge
                                            colorScheme={isPremium ? "purple" : "gray"}
                                            fontSize="2xs"
                                            variant={isPremium ? "solid" : "subtle"}
                                        >
                                            {isPremium ? "⭐" : <FiLock size={8} />}
                                        </Badge>
                                    )}
                                    {!option.available && (
                                        <Badge colorScheme="gray" fontSize="2xs">
                                            No disponible
                                        </Badge>
                                    )}
                                </HStack>
                            </HStack>

                            <Text fontSize="xs" color="gray.500" lineHeight="1.3">
                                {option.description}
                            </Text>

                            {/* INDICADOR PREMIUM */}
                            {option.premiumFeature && !isPremium && (
                                <Badge colorScheme="purple" variant="outline" fontSize="2xs">
                                    Función Premium
                                </Badge>
                            )}
                        </VStack>
                    </CardBody>
                </Card>
            </Tooltip>
        );
    };

    // ✅ RENDERIZAR INFORMACIÓN DEL ESTADO
    const renderStatusInfo = () => (
        <Alert status="info" size="sm" borderRadius="md" fontSize="xs">
            <AlertIcon boxSize={3} />
            <Box>
                <Text fontWeight="medium">
                    {accountsCount === 0
                        ? "No hay cuentas para exportar"
                        : `${accountsCount} cuenta${accountsCount !== 1 ? 's' : ''} disponible${accountsCount !== 1 ? 's' : ''}`
                    }
                </Text>
                {userName && (
                    <Text fontSize="2xs" opacity={0.8}>
                        Usuario: {userName}
                    </Text>
                )}
            </Box>
        </Alert>
    );

    return (
        <Popover
            isOpen={isOpen}
            onClose={onClose}
            placement="bottom-start"
            isLazy
            lazyBehavior="keepMounted"
        >
            <PopoverTrigger>
                <Box display="inline-block">
                    <Tooltip
                        label={
                            isDisabled
                                ? accountsCount === 0
                                    ? "No hay cuentas para exportar"
                                    : "Función no disponible"
                                : "Exportar datos de cuentas rápidas"
                        }
                        hasArrow
                    >
                        <Button
                            leftIcon={<FiDownload />}
                            onClick={onOpen}
                            variant="outline"
                            size="sm"
                            colorScheme="blue"
                            isDisabled={isDisabled}
                            isLoading={isLoading}
                            loadingText="Cargando..."
                        >
                            <HStack spacing={1}>
                                <Text>Exportar</Text>
                                {isPremium && (
                                    <Badge colorScheme="purple" fontSize="2xs" ml={1}>
                                        PREMIUM
                                    </Badge>
                                )}
                            </HStack>
                        </Button>
                    </Tooltip>
                </Box>
            </PopoverTrigger>

            <PopoverContent
                zIndex={9999}
                minW="360px"
                maxW="400px"
                shadow="xl"
                borderColor="blue.100"
            >
                <PopoverBody p={4}>
                    <VStack spacing={4} align="stretch">
                        {/* HEADER */}
                        <VStack spacing={2} align="start">
                            <HStack spacing={2}>
                                <Icon as={FiDownload} color="blue.500" boxSize={5} />
                                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                    Exportar Cuentas
                                </Text>
                                {isPremium && (
                                    <Badge colorScheme="purple" fontSize="xs">
                                        PREMIUM
                                    </Badge>
                                )}
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                                {isPremium
                                    ? "Exporta todos tus datos con funciones avanzadas de análisis"
                                    : "Selecciona el formato de reporte para tus cuentas"
                                }
                            </Text>
                        </VStack>

                        {/* INFORMACIÓN DE ESTADO */}
                        {renderStatusInfo()}

                        {/* OPCIONES DE EXPORTACIÓN */}
                        <VStack spacing={2} align="stretch">
                            {exportOptions.map(renderExportOption)}
                        </VStack>

                        {/* FOOTER INFORMATIVO */}
                        {!isPremium && (
                            <Alert status="warning" size="sm" borderRadius="md" fontSize="xs">
                                <AlertIcon boxSize={3} />
                                <Box flex="1">
                                    <Text fontWeight="medium">Actualiza a Premium</Text>
                                    <Text fontSize="2xs">
                                        Desbloquea todas las funciones de exportación avanzada
                                    </Text>
                                </Box>
                            </Alert>
                        )}
                    </VStack>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

// ✅ PROPS POR DEFECTO
QuickAccountsExport.defaultProps = {
    onExport: (type, metadata) => {
        console.log('Exportando:', type, metadata);
        // Implementación por defecto
    },
    accountsCount: 0,
    userName: "",
    isPremium: false,
    hasActiveAccounts: false,
    isLoading: false
};

export default QuickAccountsExport;