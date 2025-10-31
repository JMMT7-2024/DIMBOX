// src/components/dashboard/QuickAccountsPanel/QuickAccountsMinimized.jsx - VERSIÓN MEJORADA
import React, { useMemo } from 'react';
import {
    Card, CardBody, Flex, HStack, VStack, Box, Text,
    Badge, IconButton, Tooltip, useBreakpointValue
} from '@chakra-ui/react';
import {
    FiUsers,
    FiChevronDown,
    FiStar,
    FiActivity,
    FiTrendingUp,
    FiAlertCircle
} from 'react-icons/fi';
import QuickAccountsShareButtons from './QuickAccountsShareButtons';
import QuickAccountsExport from './QuickAccountsExport';

const QuickAccountsMinimized = ({
    onExpand,
    hasActiveAccounts = false,
    accountsCount = 0,
    onExport,
    isPremium = false,
    accountsData = [],
    userName = "",
    isLoading = false
}) => {

    // ✅ RESPONSIVE DESIGN HOOKS
    const isMobile = useBreakpointValue({ base: true, md: false });
    const showCompactView = useBreakpointValue({ base: true, sm: false });

    // ✅ CALCULAR ESTADÍSTICAS EN TIEMPO REAL
    const stats = useMemo(() => {
        if (!accountsData || accountsData.length === 0) {
            return {
                totalEntries: 0,
                totalExpenses: 0,
                activeAccounts: 0,
                totalBalance: 0
            };
        }

        const activeAccounts = accountsData.filter(account =>
            account.entries?.length > 0 || account.expenses?.length > 0
        ).length;

        const totalEntries = accountsData.reduce((sum, account) =>
            sum + (account.entries?.length || 0), 0
        );

        const totalExpenses = accountsData.reduce((sum, account) =>
            sum + (account.expenses?.length || 0), 0
        );

        const totalBalance = accountsData.reduce((sum, account) => {
            const income = account.entries?.reduce((inc, entry) => inc + (entry.amount || 0), 0) || 0;
            const expenses = account.expenses?.reduce((exp, expense) => exp + (expense.amount || 0), 0) || 0;
            return sum + (income - expenses);
        }, 0);

        return {
            totalEntries,
            totalExpenses,
            activeAccounts,
            totalBalance
        };
    }, [accountsData]);

    // ✅ RENDERIZAR BADGES DINÁMICOS
    const renderStatusBadges = () => (
        <HStack spacing={2} flexWrap="wrap">
            {/* Badge de cantidad de cuentas */}
            {accountsCount > 0 && (
                <Tooltip label={`${accountsCount} cuenta${accountsCount !== 1 ? 's' : ''} configurada${accountsCount !== 1 ? 's' : ''}`}>
                    <Badge
                        colorScheme="blue"
                        fontSize="2xs"
                        cursor="help"
                        variant="subtle"
                    >
                        {accountsCount} {showCompactView ? "" : "cuenta"}{accountsCount !== 1 && !showCompactView ? "s" : ""}
                    </Badge>
                </Tooltip>
            )}

            {/* Badge de cuentas activas */}
            {stats.activeAccounts > 0 && (
                <Tooltip label={`${stats.activeAccounts} cuenta${stats.activeAccounts !== 1 ? 's' : ''} con actividad`}>
                    <Badge
                        colorScheme="green"
                        fontSize="2xs"
                        cursor="help"
                        variant="subtle"
                    >
                        <HStack spacing={1}>
                            <FiActivity size={8} />
                            {!showCompactView && <Text>{stats.activeAccounts} activa{stats.activeAccounts !== 1 ? "s" : ""}</Text>}
                        </HStack>
                    </Badge>
                </Tooltip>
            )}

            {/* Badge de movimientos */}
            {(stats.totalEntries > 0 || stats.totalExpenses > 0) && !showCompactView && (
                <Tooltip label={`${stats.totalEntries} ingresos y ${stats.totalExpenses} gastos`}>
                    <Badge
                        colorScheme="gray"
                        fontSize="2xs"
                        cursor="help"
                        variant="outline"
                    >
                        <HStack spacing={1}>
                            <FiTrendingUp size={8} />
                            <Text>{stats.totalEntries + stats.totalExpenses} movimientos</Text>
                        </HStack>
                    </Badge>
                </Tooltip>
            )}

            {/* Badge premium */}
            {isPremium && (
                <Tooltip label="Cuenta Premium con funciones avanzadas">
                    <Badge
                        colorScheme="purple"
                        fontSize="2xs"
                        cursor="help"
                    >
                        <HStack spacing={1}>
                            <FiStar size={8} />
                            {!showCompactView && <Text>Premium</Text>}
                        </HStack>
                    </Badge>
                </Tooltip>
            )}

            {/* Badge de sin datos */}
            {accountsCount === 0 && (
                <Tooltip label="No hay cuentas configuradas. Haz clic para crear una.">
                    <Badge
                        colorScheme="orange"
                        fontSize="2xs"
                        cursor="help"
                        variant="subtle"
                    >
                        <HStack spacing={1}>
                            <FiAlertCircle size={8} />
                            {!showCompactView && <Text>Sin datos</Text>}
                        </HStack>
                    </Badge>
                </Tooltip>
            )}
        </HStack>
    );

    // ✅ RENDERIZAR ACCIONES (COMPARTIR Y EXPORTAR)
    const renderActions = () => (
        <HStack spacing={1}>
            <QuickAccountsShareButtons
                accountsData={accountsData}
                userName={userName}
                isPremium={isPremium}
                size="sm"
                variant="ghost"
            />

            <QuickAccountsExport
                onExport={onExport}
                accountsCount={accountsCount}
                userName={userName}
                isPremium={isPremium}
                hasActiveAccounts={hasActiveAccounts}
                isLoading={isLoading}
            />

            <Tooltip label="Expandir panel de cuentas rápidas">
                <IconButton
                    icon={<FiChevronDown />}
                    variant="ghost"
                    size="sm"
                    aria-label="Expandir panel de cuentas rápidas"
                    color="gray.500"
                    _hover={{
                        bg: 'blue.50',
                        color: 'blue.500',
                        transform: 'translateY(-1px)'
                    }}
                    transition="all 0.2s"
                />
            </Tooltip>
        </HStack>
    );

    // ✅ RENDERIZAR CONTENIDO PRINCIPAL
    const renderMainContent = () => (
        <HStack spacing={3} flex={1} minW={0}>
            <Box
                p={2}
                borderRadius="md"
                bg="blue.50"
                color="blue.500"
                flexShrink={0}
                _groupHover={{ bg: 'blue.100' }}
                transition="background-color 0.2s"
            >
                <FiUsers size={isMobile ? 16 : 18} />
            </Box>

            <VStack
                align="start"
                spacing={0}
                flex={1}
                minW={0}
                overflow="hidden"
            >
                <HStack spacing={2} align="center">
                    <Text
                        fontWeight="semibold"
                        color="gray.800"
                        fontSize={isMobile ? "sm" : "md"}
                        noOfLines={1}
                    >
                        Cuentas Rápidas
                    </Text>
                    {isPremium && (
                        <Badge
                            colorScheme="purple"
                            fontSize="2xs"
                            variant="solid"
                        >
                            PREMIUM
                        </Badge>
                    )}
                </HStack>

                <Text
                    fontSize={isMobile ? "xs" : "sm"}
                    color="gray.600"
                    noOfLines={1}
                >
                    {isPremium
                        ? "Funciones avanzadas habilitadas 🚀"
                        : "Gestiona cuotas, eventos y cobros temporales"
                    }
                </Text>

                {/* Información adicional en desktop */}
                {!isMobile && stats.totalBalance !== 0 && (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        Balance total: {stats.totalBalance > 0 ? '+' : ''}{stats.totalBalance.toFixed(2)}
                    </Text>
                )}
            </VStack>
        </HStack>
    );

    return (
        <Card
            shadow="sm"
            border="1px"
            borderColor="gray.200"
            cursor="pointer"
            onClick={onExpand}
            _hover={{
                shadow: 'md',
                borderColor: 'blue.300',
                transform: 'translateY(-2px)'
            }}
            transition="all 0.3s ease-in-out"
            role="button"
            aria-label="Panel minimizado de cuentas rápidas - Haz clic para expandir"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onExpand();
                }
            }}
            className="quick-accounts-minimized"
            position="relative"
            overflow="hidden"
        >
            {/* Efecto de gradiente sutil para premium */}
            {isPremium && (
                <Box
                    position="absolute"
                    top={0}
                    right={0}
                    w="4px"
                    h="100%"
                    bgGradient="linear(to-b, purple.400, purple.600)"
                />
            )}

            <CardBody py={3} px={4}>
                <Flex
                    justify="space-between"
                    align="center"
                    gap={3}
                    flexDirection={{ base: 'column', sm: 'row' }}
                >
                    {renderMainContent()}

                    <HStack
                        spacing={2}
                        align="center"
                        justify={{ base: 'space-between', sm: 'flex-end' }}
                        width={{ base: '100%', sm: 'auto' }}
                        mt={{ base: 2, sm: 0 }}
                    >
                        {renderStatusBadges()}
                        {renderActions()}
                    </HStack>
                </Flex>
            </CardBody>
        </Card>
    );
};

// ✅ PROPS POR DEFECTO MEJORADOS
QuickAccountsMinimized.defaultProps = {
    onExpand: () => console.log('Expandir cuentas rápidas'),
    hasActiveAccounts: false,
    accountsCount: 0,
    accountsData: [],
    userName: "",
    isPremium: false,
    isLoading: false,
    onExport: (type, metadata) => console.log('Exportar:', type, metadata)
};

export default QuickAccountsMinimized;