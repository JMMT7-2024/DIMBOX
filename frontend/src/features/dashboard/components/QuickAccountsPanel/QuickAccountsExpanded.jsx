// src/components/dashboard/QuickAccountsPanel/QuickAccountsExpanded.jsx - VERSIÓN MEJORADA
import React, { useMemo } from 'react';
import {
    Card, CardBody, Flex, HStack, VStack, Box, Text,
    Badge, IconButton, Tooltip
} from '@chakra-ui/react';
import { FiUsers, FiChevronUp, FiStar, FiActivity } from 'react-icons/fi';

// ✅ IMPORTAR DIRECTAMENTE EL COMPONENTE PRINCIPAL
import QuickAccountsMinimized from './QuickAccountsMinimized';

const QuickAccountsExpanded = ({
    onMinimize,
    hasActiveAccounts = false,
    accountsCount = 0,
    onExport,
    isPremium = false,
    accountsData = [],
    userName = "",
    onDataChange,
    isLoading = false
}) => {

    // ✅ CALCULAR ESTADÍSTICAS PARA EL HEADER
    const headerStats = useMemo(() => {
        const activeAccounts = accountsData.filter(account =>
            account.entries?.length > 0 || account.expenses?.length > 0
        ).length;

        const totalEntries = accountsData.reduce((sum, account) =>
            sum + (account.entries?.length || 0), 0
        );

        const totalExpenses = accountsData.reduce((sum, account) =>
            sum + (account.expenses?.length || 0), 0
        );

        return {
            activeAccounts,
            totalEntries,
            totalExpenses
        };
    }, [accountsData]);

    // ✅ RENDERIZAR BADGES DINÁMICOS
    const renderStatusBadges = () => (
        <HStack spacing={2}>
            {/* Badge de cantidad de cuentas */}
            {accountsCount > 0 && (
                <Tooltip label={`${accountsCount} cuenta${accountsCount !== 1 ? 's' : ''} en total`}>
                    <Badge colorScheme="blue" fontSize="xs" cursor="help">
                        {accountsCount} {accountsCount === 1 ? 'cuenta' : 'cuentas'}
                    </Badge>
                </Tooltip>
            )}

            {/* Badge de actividad */}
            {hasActiveAccounts && (
                <Tooltip label="Cuentas con actividad reciente">
                    <Badge colorScheme="green" fontSize="xs" cursor="help">
                        <HStack spacing={1}>
                            <FiActivity size={10} />
                            <Text>Activo</Text>
                        </HStack>
                    </Badge>
                </Tooltip>
            )}

            {/* Badge premium */}
            {isPremium && (
                <Tooltip label="Cuenta Premium con funciones avanzadas">
                    <Badge colorScheme="purple" fontSize="xs" cursor="help">
                        <HStack spacing={1}>
                            <FiStar size={10} />
                            <Text>Premium</Text>
                        </HStack>
                    </Badge>
                </Tooltip>
            )}

            {/* Badge de estadísticas si hay datos */}
            {headerStats.activeAccounts > 0 && (
                <Tooltip label={`${headerStats.totalEntries} ingresos y ${headerStats.totalExpenses} gastos registrados`}>
                    <Badge colorScheme="gray" fontSize="xs" cursor="help">
                        {headerStats.totalEntries + headerStats.totalExpenses} movimientos
                    </Badge>
                </Tooltip>
            )}
        </HStack>
    );

    // ✅ RENDERIZAR INFORMACIÓN DEL USUARIO
    const renderUserInfo = () => {
        if (!userName) return null;

        return (
            <Text fontSize="xs" color="gray.500" mt={1}>
                Usuario: {userName}
                {isPremium && " ⭐"}
            </Text>
        );
    };

    return (
        <Card
            shadow="md"
            border="1px"
            borderColor="gray.200"
            role="region"
            aria-label="Panel expandido de cuentas rápidas"
        >
            <CardBody p={0}>
                {/* ✅ HEADER MEJORADO */}
                <Flex
                    p={4}
                    borderBottom="1px"
                    borderColor="gray.200"
                    justify="space-between"
                    align={{ base: 'flex-start', md: 'center' }}
                    cursor="pointer"
                    onClick={onMinimize}
                    _hover={{ bg: 'gray.50' }}
                    bg="gray.50"
                    flexDirection={{ base: 'column', md: 'row' }}
                    gap={3}
                >
                    {/* Lado izquierdo: Información principal */}
                    <HStack spacing={3} align="flex-start" flex={1}>
                        <Box
                            p={2}
                            borderRadius="md"
                            bg="blue.50"
                            color="blue.500"
                            flexShrink={0}
                        >
                            <FiUsers size={18} />
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                            <HStack spacing={2} align="center">
                                <Text fontWeight="bold" color="gray.800" fontSize="lg">
                                    Cuentas Rápidas
                                </Text>
                                {isPremium && (
                                    <Badge colorScheme="purple" fontSize="xs">
                                        PREMIUM
                                    </Badge>
                                )}
                            </HStack>
                            <Text fontSize="sm" color="gray.600" lineHeight="1.4">
                                {isPremium
                                    ? "Todas las funciones avanzadas habilitadas 🚀 - Gestión completa de ingresos y gastos"
                                    : "Gestiona cuotas, eventos y cobros temporales de forma rápida y sencilla"
                                }
                            </Text>
                            {renderUserInfo()}
                        </VStack>
                    </HStack>

                    {/* Lado derecho: Badges y botón */}
                    <HStack
                        spacing={3}
                        align="center"
                        justify={{ base: 'space-between', md: 'flex-end' }}
                        width={{ base: '100%', md: 'auto' }}
                    >
                        {renderStatusBadges()}

                        <Tooltip label="Minimizar panel">
                            <IconButton
                                icon={<FiChevronUp />}
                                variant="ghost"
                                size="sm"
                                aria-label="Minimizar panel de cuentas rápidas"
                                color="gray.500"
                                _hover={{ bg: 'gray.200' }}
                            />
                        </Tooltip>
                    </HStack>
                </Flex>

                {/* ✅ CONTENIDO PRINCIPAL */}
                <Box p={4}>
                    {/* ✅ CARGAR DIRECTAMENTE EL COMPONENTE PRINCIPAL */}
                    <QuickAccountsPanel
                        onDataChange={onDataChange}
                        isPremium={isPremium}
                    />
                </Box>
            </CardBody>
        </Card>
    );
};

// ✅ PROPS POR DEFECTO MEJORADOS
QuickAccountsExpanded.defaultProps = {
    hasActiveAccounts: false,
    accountsCount: 0,
    accountsData: [],
    userName: "",
    isLoading: false,
    onDataChange: () => { },
    onMinimize: () => { },
    onExport: () => { }
};

export default QuickAccountsExpanded;