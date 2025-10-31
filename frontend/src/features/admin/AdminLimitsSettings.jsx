// src/features/admin/AdminLimitsSettings.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardBody, VStack, HStack, Text, Button,
    NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper,
    FormControl, FormLabel, Switch, useToast,
    Grid, Alert, AlertIcon, Badge, Divider,
    Spinner, Center, Stat, StatLabel, StatNumber, StatHelpText,
    SimpleGrid, useBreakpointValue, Progress,
    Tabs, TabList, TabPanels, Tab, TabPanel,
    Checkbox, Icon, Tooltip, Flex
} from '@chakra-ui/react';
import {
    FiSave, FiRefreshCw, FiUsers, FiTrendingUp, FiAlertTriangle,
    FiDatabase, FiFileText, FiBarChart2, FiShield, FiAward,
    FiInfo, FiZap, FiCalendar, FiDollarSign
} from 'react-icons/fi';

// ✅ IMPORTACIÓN CORRECTA - Usando tu API service
import apiService from '../../lib/api';

// ✅ CONFIGURACIÓN COMPLETA DE LÍMITES (igual que en Admin.jsx)
const DEFAULT_SUBSCRIPTION_LIMITS = {
    free: {
        maxTransactions: 100,
        maxQuickAccounts: 3,
        canExport: false,
        canAdvancedAnalytics: false,
        maxCategories: 8,
        retentionMonths: 3,
        maxTransactionAmount: 10000,
        maxFileUploads: 5,
        maxFileSizeMB: 10,
        enableAPIAccess: false,
        enableWebhooks: false,
        enableCustomReports: false,
        maxDashboardWidgets: 3,
        enableEmailSupport: false,
        features: ['transactions_basic', 'categories_basic', 'dashboard_basic']
    },
    premium: {
        maxTransactions: 10000,
        maxQuickAccounts: 50,
        canExport: true,
        canAdvancedAnalytics: true,
        maxCategories: 20,
        retentionMonths: 24,
        maxTransactionAmount: 1000000,
        maxFileUploads: 100,
        maxFileSizeMB: 100,
        enableAPIAccess: true,
        enableWebhooks: true,
        enableCustomReports: true,
        maxDashboardWidgets: 15,
        enableEmailSupport: true,
        features: ['transactions_unlimited', 'export_excel', 'advanced_analytics', 'quick_accounts_unlimited', 'api_access', 'custom_reports']
    }
};

const AdminLimitsSettings = () => {
    const toast = useToast();
    const [globalLimits, setGlobalLimits] = useState(DEFAULT_SUBSCRIPTION_LIMITS);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ CARGAR DATOS AL INICIALIZAR
    useEffect(() => {
        loadCurrentLimits();
        loadLimitsStats();
    }, []);

    // ✅ CARGAR LÍMITES ACTUALES - CORREGIDO
    const loadCurrentLimits = async () => {
        try {
            // Intentar cargar desde localStorage primero (como fallback)
            const savedLimits = localStorage.getItem('globalLimits');
            if (savedLimits) {
                setGlobalLimits(JSON.parse(savedLimits));
            }

            // Intentar cargar desde API si existe el endpoint
            try {
                const currentLimits = await apiService.getAdminLimitsStats();
                if (currentLimits && currentLimits.globalLimits) {
                    setGlobalLimits(currentLimits.globalLimits);
                    localStorage.setItem('globalLimits', JSON.stringify(currentLimits.globalLimits));
                }
            } catch (apiError) {
                console.log('ℹ️ Endpoint de límites no disponible, usando configuración local');
            }
        } catch (error) {
            console.log('ℹ️ Usando valores por defecto para límites globales');
        }
    };

    // ✅ CARGAR ESTADÍSTICAS - CORREGIDO
    const loadLimitsStats = async () => {
        setStatsLoading(true);
        try {
            // Usar el método correcto de tu API service
            const limitsStats = await apiService.getAdminLimitsStats();
            setStats(limitsStats);
        } catch (error) {
            console.error('❌ Error cargando estadísticas de límites:', error);

            // ✅ FALLBACK: Datos de ejemplo para desarrollo
            const mockStats = {
                near_limit_users: 3,
                exceeded_limit_users: 1,
                average_usage: 45.7,
                total_transactions: 12540,
                usage_distribution: {
                    free: 65,
                    premium: 35
                }
            };
            setStats(mockStats);

            toast({
                title: 'Info',
                description: 'Usando datos de ejemplo para desarrollo',
                status: 'info',
                duration: 3000,
            });
        } finally {
            setStatsLoading(false);
        }
    };

    // ✅ GUARDAR LÍMITES GLOBALES - CORREGIDO
    const handleSaveGlobalLimits = async () => {
        setLoading(true);
        try {
            // ✅ USAR EL MÉTODO CORRECTO DE TU API
            await apiService.updateGlobalLimits(globalLimits);

            // ✅ GUARDAR TAMBIÉN EN LOCALSTORAGE COMO BACKUP
            localStorage.setItem('globalLimits', JSON.stringify(globalLimits));

            toast({
                title: '✅ Configuración guardada',
                description: 'Los límites globales se actualizaron correctamente',
                status: 'success',
                duration: 4000,
                isClosable: true,
                position: 'top-right'
            });

            // Recargar estadísticas después de guardar
            await loadLimitsStats();

        } catch (error) {
            console.error('❌ Error guardando límites globales:', error);

            let errorMessage = 'No se pudieron guardar los límites en el servidor';

            // ✅ GUARDAR LOCALMENTE COMO FALLBACK
            localStorage.setItem('globalLimits', JSON.stringify(globalLimits));

            toast({
                title: '⚠️ Guardado local',
                description: 'Configuración guardada localmente (servidor no disponible)',
                status: 'warning',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // ✅ RESTABLECER A VALORES POR DEFECTO
    const handleResetToDefaults = () => {
        setGlobalLimits(DEFAULT_SUBSCRIPTION_LIMITS);

        toast({
            title: '🔄 Valores restablecidos',
            description: 'Se restauraron los valores por defecto',
            status: 'info',
            duration: 3000,
            position: 'top'
        });
    };

    // ✅ ACTUALIZAR LÍMITE DE PLAN - MEJORADO
    const updatePlanLimit = (plan, key, value) => {
        setGlobalLimits(prev => ({
            ...prev,
            [plan]: {
                ...prev[plan],
                [key]: value
            }
        }));
    };

    // ✅ TOGGLE DE CARACTERÍSTICA
    const toggleFeature = (plan, feature, value) => {
        updatePlanLimit(plan, feature, value);
    };

    // ✅ COMPONENTE DE ESTADÍSTICAS MEJORADO
    const renderStats = () => {
        if (statsLoading) {
            return (
                <Center py={8}>
                    <VStack spacing={4}>
                        <Spinner size="lg" color="blue.500" thickness="3px" />
                        <Text color="gray.600" fontSize="sm">
                            Cargando estadísticas de uso...
                        </Text>
                    </VStack>
                </Center>
            );
        }

        return (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={8}>
                <Card bg="white" shadow="md" border="1px" borderColor="gray.200">
                    <CardBody>
                        <Stat>
                            <HStack spacing={2} mb={2}>
                                <Icon as={FiUsers} color="blue.500" boxSize={5} />
                                <StatLabel color="gray.600" fontSize="sm">
                                    Cerca del Límite
                                </StatLabel>
                            </HStack>
                            <StatNumber color="orange.500" fontSize="2xl">
                                {stats?.near_limit_users || 0}
                            </StatNumber>
                            <StatHelpText color="gray.500" fontSize="xs">
                                Usuarios >80% de uso
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card bg="white" shadow="md" border="1px" borderColor="gray.200">
                    <CardBody>
                        <Stat>
                            <HStack spacing={2} mb={2}>
                                <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
                                <StatLabel color="gray.600" fontSize="sm">
                                    Límites Excedidos
                                </StatLabel>
                            </HStack>
                            <StatNumber color="red.500" fontSize="2xl">
                                {stats?.exceeded_limit_users || 0}
                            </StatNumber>
                            <StatHelpText color="gray.500" fontSize="xs">
                                Necesitan actualización
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card bg="white" shadow="md" border="1px" borderColor="gray.200">
                    <CardBody>
                        <Stat>
                            <HStack spacing={2} mb={2}>
                                <Icon as={FiTrendingUp} color="green.500" boxSize={5} />
                                <StatLabel color="gray.600" fontSize="sm">
                                    Uso Promedio
                                </StatLabel>
                            </HStack>
                            <StatNumber color="green.500" fontSize="2xl">
                                {stats?.average_usage ? `${Math.round(stats.average_usage)}%` : '0%'}
                            </StatNumber>
                            <StatHelpText color="gray.500" fontSize="xs">
                                Del límite total
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card bg="white" shadow="md" border="1px" borderColor="gray.200">
                    <CardBody>
                        <Stat>
                            <HStack spacing={2} mb={2}>
                                <Icon as={FiDatabase} color="purple.500" boxSize={5} />
                                <StatLabel color="gray.600" fontSize="sm">
                                    Transacciones
                                </StatLabel>
                            </HStack>
                            <StatNumber color="purple.500" fontSize="2xl">
                                {(stats?.total_transactions || 0).toLocaleString()}
                            </StatNumber>
                            <StatHelpText color="gray.500" fontSize="xs">
                                Total del sistema
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
            </SimpleGrid>
        );
    };

    // ✅ COMPONENTE DE CONFIGURACIÓN DE PLAN
    const PlanConfiguration = ({ plan, isPremium = false }) => (
        <Card
            shadow="lg"
            border="2px"
            borderColor={isPremium ? 'purple.200' : 'gray.200'}
            bg={isPremium ? 'purple.50' : 'white'}
        >
            <CardBody>
                <VStack spacing={6} align="stretch">
                    {/* HEADER DEL PLAN */}
                    <HStack justify="space-between" align="center">
                        <Badge
                            colorScheme={isPremium ? 'purple' : 'gray'}
                            fontSize="lg"
                            px={4}
                            py={2}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            gap={2}
                        >
                            {isPremium ? (
                                <>
                                    <FiAward />
                                    ⭐ PLAN PREMIUM
                                </>
                            ) : (
                                <>
                                    <FiUsers />
                                    🆓 PLAN FREE
                                </>
                            )}
                        </Badge>

                        {isPremium && (
                            <Tooltip label="Características siempre activas para Premium" hasArrow>
                                <Badge colorScheme="green" fontSize="xs">
                                    FULL ACCESS
                                </Badge>
                            </Tooltip>
                        )}
                    </HStack>

                    <Divider />

                    {/* LÍMITES BÁSICOS */}
                    <VStack spacing={4} align="stretch">
                        <Text fontWeight="bold" color="gray.700" fontSize="md">
                            📊 Límites Básicos
                        </Text>

                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    Transacciones Máximas
                                </FormLabel>
                                <NumberInput
                                    value={globalLimits[plan].maxTransactions}
                                    onChange={(valueString, valueNumber) =>
                                        updatePlanLimit(plan, 'maxTransactions', valueNumber)
                                    }
                                    min={isPremium ? 1000 : 10}
                                    max={isPremium ? 50000 : 500}
                                    size="sm"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    Cuentas Rápidas
                                </FormLabel>
                                <NumberInput
                                    value={globalLimits[plan].maxQuickAccounts}
                                    onChange={(valueString, valueNumber) =>
                                        updatePlanLimit(plan, 'maxQuickAccounts', valueNumber)
                                    }
                                    min={isPremium ? 10 : 1}
                                    max={isPremium ? 100 : 10}
                                    size="sm"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    Categorías Máximas
                                </FormLabel>
                                <NumberInput
                                    value={globalLimits[plan].maxCategories}
                                    onChange={(valueString, valueNumber) =>
                                        updatePlanLimit(plan, 'maxCategories', valueNumber)
                                    }
                                    min={5}
                                    max={isPremium ? 50 : 15}
                                    size="sm"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    Retención (Meses)
                                </FormLabel>
                                <NumberInput
                                    value={globalLimits[plan].retentionMonths}
                                    onChange={(valueString, valueNumber) =>
                                        updatePlanLimit(plan, 'retentionMonths', valueNumber)
                                    }
                                    min={1}
                                    max={isPremium ? 60 : 12}
                                    size="sm"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                        </Grid>
                    </VStack>

                    {/* CARACTERÍSTICAS AVANZADAS */}
                    <VStack spacing={4} align="stretch">
                        <Text fontWeight="bold" color="gray.700" fontSize="md">
                            ⚡ Características
                        </Text>

                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                                        Exportar Datos
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.600">
                                        Excel/CSV
                                    </Text>
                                </Box>
                                <Switch
                                    isChecked={globalLimits[plan].canExport}
                                    onChange={(e) => toggleFeature(plan, 'canExport', e.target.checked)}
                                    colorScheme="green"
                                    isDisabled={isPremium} // Siempre activo para premium
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                                        Analytics Avanzadas
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.600">
                                        Gráficos detallados
                                    </Text>
                                </Box>
                                <Switch
                                    isChecked={globalLimits[plan].canAdvancedAnalytics}
                                    onChange={(e) => toggleFeature(plan, 'canAdvancedAnalytics', e.target.checked)}
                                    colorScheme="green"
                                    isDisabled={isPremium}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                                        Acceso API
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.600">
                                        Integraciones
                                    </Text>
                                </Box>
                                <Switch
                                    isChecked={globalLimits[plan].enableAPIAccess}
                                    onChange={(e) => toggleFeature(plan, 'enableAPIAccess', e.target.checked)}
                                    colorScheme="blue"
                                    isDisabled={isPremium}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                                        Soporte Email
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.600">
                                        Prioritario
                                    </Text>
                                </Box>
                                <Switch
                                    isChecked={globalLimits[plan].enableEmailSupport}
                                    onChange={(e) => toggleFeature(plan, 'enableEmailSupport', e.target.checked)}
                                    colorScheme="blue"
                                    isDisabled={isPremium}
                                />
                            </FormControl>
                        </Grid>
                    </VStack>

                    {/* LÍMITES DE ARCHIVOS */}
                    <VStack spacing={4} align="stretch">
                        <Text fontWeight="bold" color="gray.700" fontSize="md">
                            📁 Archivos y Almacenamiento
                        </Text>

                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    Máx. Archivos
                                </FormLabel>
                                <NumberInput
                                    value={globalLimits[plan].maxFileUploads}
                                    onChange={(valueString, valueNumber) =>
                                        updatePlanLimit(plan, 'maxFileUploads', valueNumber)
                                    }
                                    min={1}
                                    max={isPremium ? 500 : 20}
                                    size="sm"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="medium">
                                    Tamaño Máx. (MB)
                                </FormLabel>
                                <NumberInput
                                    value={globalLimits[plan].maxFileSizeMB}
                                    onChange={(valueString, valueNumber) =>
                                        updatePlanLimit(plan, 'maxFileSizeMB', valueNumber)
                                    }
                                    min={1}
                                    max={isPremium ? 500 : 50}
                                    size="sm"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                        </Grid>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );

    return (
        <Box p={6} bg="gray.50" minH="100vh">
            <VStack spacing={8} align="stretch" maxW="1400px" mx="auto">
                {/* HEADER */}
                <VStack spacing={4} align="start">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
                        ⚙️ Configuración Global de Límites
                    </Text>
                    <Text fontSize="md" color="gray.600" maxW="800px">
                        Configura los límites y características para cada tipo de plan.
                        Estos ajustes afectan a todos los usuarios nuevos y existentes sin límites personalizados.
                    </Text>
                </VStack>

                {/* ESTADÍSTICAS */}
                {renderStats()}

                {/* ALERTA INFORMATIVA */}
                <Alert status="info" borderRadius="lg" variant="left-accent">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="medium">Configuración Global de Límites</Text>
                        <Text fontSize="sm">
                            Los cambios se aplican inmediatamente a los usuarios según su plan actual.
                            Los usuarios con límites personalizados mantienen su configuración individual.
                        </Text>
                    </Box>
                </Alert>

                {/* CONFIGURACIÓN DE PLANES */}
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
                    <PlanConfiguration plan="free" isPremium={false} />
                    <PlanConfiguration plan="premium" isPremium={true} />
                </Grid>

                {/* ACCIONES */}
                <Card shadow="md">
                    <CardBody>
                        <VStack spacing={6}>
                            <Text fontWeight="semibold" color="gray.700" fontSize="lg">
                                Acciones de Configuración
                            </Text>

                            <HStack spacing={4} wrap={isMobile ? "wrap" : "nowrap"} w="full">
                                <Button
                                    leftIcon={<FiSave />}
                                    colorScheme="blue"
                                    onClick={handleSaveGlobalLimits}
                                    isLoading={loading}
                                    loadingText="Guardando..."
                                    flex={1}
                                    size="lg"
                                    shadow="md"
                                >
                                    Guardar Configuración Global
                                </Button>

                                <Button
                                    leftIcon={<FiRefreshCw />}
                                    variant="outline"
                                    onClick={handleResetToDefaults}
                                    flex={1}
                                    size="lg"
                                >
                                    Restablecer Valores
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={loadLimitsStats}
                                    isLoading={statsLoading}
                                    flex={1}
                                    size="lg"
                                >
                                    Actualizar Stats
                                </Button>
                            </HStack>

                            <Text fontSize="sm" color="gray.500" textAlign="center">
                                Los cambios se aplican a todos los usuarios según su plan actual
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    );
};

export default AdminLimitsSettings;