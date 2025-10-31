// src/pages/Login.jsx - VERSIÓN CORREGIDA Y MEJORADA
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { keyframes } from '@emotion/react';

// ✅ IMPORTS OPTIMIZADOS
import {
    Box,
    Flex,
    Heading,
    Text,
    Grid,
    GridItem,
    Stack,
    VStack,
    HStack,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    useBreakpointValue,
    useToast,
    useDisclosure,
    Link as ChakraLink,
    useColorModeValue,
    Badge,
    Button
} from '@chakra-ui/react';

// ✅ COMPONENTES
import FinanzAppLogo from '../components/layout/FinanzAppLogo';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import FeatureItem from '../components/ui/FeatureItem';

// ✅ HOOKS
import { useAuth } from '../auth/AuthContext';

// ✅ ICONS
import {
    FiTrendingUp,
    FiShield,
    FiSmartphone,
    FiUser,
    FiDollarSign,
    FiWifi,
    FiWifiOff,
    FiDownload,
    FiCheck,
    FiArrowRight
} from 'react-icons/fi';

// ✅ ANIMACIONES OPTIMIZADAS
const pulseAnimation = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
`;

const slideInAnimation = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const glowAnimation = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(72, 187, 120, 0.5); }
  50% { box-shadow: 0 0 20px rgba(72, 187, 120, 0.8); }
`;

const progressAnimation = keyframes`
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
`;

export default function Login() {
    // ✅ ESTADOS OPTIMIZADOS
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [tabIndex, setTabIndex] = useState(0);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [pwaPromotionShown, setPwaPromotionShown] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // ✅ HOOKS
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user, ready, login: authLogin, register: authRegister, isAuthenticated } = useAuth();

    // ✅ RESPONSIVE MEJORADO
    const isMobile = useBreakpointValue({ base: true, md: false });
    const isTablet = useBreakpointValue({ base: false, lg: true });
    const containerPadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
    const formPadding = useBreakpointValue({ base: 6, md: 8, lg: 10 });

    // ✅ COLORES Y TEMAS OPTIMIZADOS
    const themeColor = 'green.500';
    const secondaryColor = 'green.600';

    const appBg = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const muted = useColorModeValue('gray.600', 'gray.300');
    const subtleBg = useColorModeValue('gray.100', 'gray.700');

    // ✅ BACKGROUND GRADIENTS PROPORCIONALES
    const backgroundGradient = useColorModeValue(
        "linear(to-br, gray.50, green.50, blue.50)",
        "linear(to-br, gray.900, green.900, blue.900)"
    );

    // ✅ EFECTO PWA OPTIMIZADO
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            toast({
                title: '¡App Instalada! 🎊',
                description: 'DIMBOX se ha instalado correctamente',
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
        };

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [toast]);

    // ✅ ESTADO DE CONEXIÓN SIMPLIFICADO
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast({
                title: 'Conexión restaurada 🌐',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast({
                title: 'Modo offline 📴',
                description: 'Algunas funciones pueden no estar disponibles',
                status: 'warning',
                duration: 4000,
                isClosable: true,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [toast]);

    // ✅ INICIALIZACIÓN OPTIMIZADA
    useEffect(() => {
        document.title = 'DIMBOX - Iniciar Sesión';
        const promotionShown = localStorage.getItem('pwa_promotion_shown');
        setPwaPromotionShown(!!promotionShown);
    }, []);

    // ✅ INSTALAR PWA
    const handleInstallPWA = async () => {
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                localStorage.setItem('pwa_promotion_shown', 'true');
                setPwaPromotionShown(true);
                toast({
                    title: '¡App instalada! 📱',
                    description: 'DIMBOX se ha instalado correctamente',
                    status: 'success',
                    duration: 4000,
                });
            }

            setDeferredPrompt(null);
            setIsInstallable(false);
        } catch (error) {
            toast({
                title: 'Error en instalación',
                description: 'No se pudo instalar la aplicación',
                status: 'error',
                duration: 3000,
            });
        }
    };

    // ✅ REDIRECCIÓN OPTIMIZADA - CORREGIDA
    const redirectIfAuthenticated = useCallback(() => {
        if (isRedirecting || !ready) return;

        const token = localStorage.getItem('access');
        const hasValidAuth = token && user && isAuthenticated;

        if (hasValidAuth && !isRedirecting) {
            setIsRedirecting(true);
            setAuthChecked(true);

            setTimeout(() => {
                navigate(from, { replace: true });
            }, 800);
        } else if (ready && !hasValidAuth) {
            setAuthChecked(true);
        }
    }, [ready, user, navigate, from, isRedirecting, isAuthenticated]);

    useEffect(() => {
        if (ready && !authChecked) {
            redirectIfAuthenticated();
        }
    }, [ready, authChecked, redirectIfAuthenticated]);

    // ✅ LOGIN OPTIMIZADO - CORREGIDO
    const onLoginFinish = async (values) => {
        if (!isOnline) {
            toast({
                title: '📶 Sin conexión',
                description: 'Necesitas conexión a internet para iniciar sesión',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        setLoginLoading(true);
        setLoginError('');

        try {
            const result = await authLogin({
                username: values.username,
                password: values.password
            });

            if (result?.success) {
                toast({
                    title: `¡Bienvenido ${result.user?.name || values.username}! 🎉`,
                    description: 'Accediendo a tu dashboard...',
                    status: 'success',
                    duration: 3000,
                });

                if (isInstallable && !pwaPromotionShown) {
                    setTimeout(() => {
                        toast({
                            title: '📱 Mejora tu experiencia',
                            description: 'Instala DIMBOX para acceso rápido',
                            status: 'info',
                            duration: 6000,
                            isClosable: true,
                        });
                        localStorage.setItem('pwa_promotion_shown', 'true');
                        setPwaPromotionShown(true);
                    }, 2000);
                }

                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 1000);
            } else {
                throw new Error(result?.error || 'Credenciales inválidas');
            }
        } catch (error) {
            let errorMsg = 'Usuario o contraseña incorrectos';

            if (error?.response?.data?.detail) {
                errorMsg = error.response.data.detail;
            } else if (error?.message?.includes('Network Error')) {
                errorMsg = 'Error de conexión con el servidor';
            } else if (error?.message) {
                errorMsg = error.message;
            }

            setLoginError(errorMsg);
            toast({
                title: 'Error de autenticación',
                description: errorMsg,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoginLoading(false);
        }
    };

    // ✅ REGISTER CORREGIDO - PROBLEMA PRINCIPAL IDENTIFICADO
    const onRegisterFinish = async (values) => {
        if (!isOnline) {
            toast({
                title: '📶 Sin conexión',
                description: 'Necesitas conexión para crear una cuenta',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        setRegisterLoading(true);
        setRegisterError('');

        try {
            // ✅ CORRECCIÓN: Asegurar que los datos se envíen correctamente
            const registerData = {
                email: values.email,
                password: values.password,
                name: values.name,
                username: values.username || values.email // Fallback si no hay username
            };

            console.log('Datos de registro enviados:', registerData);

            const result = await authRegister(registerData);

            if (result?.success) {
                toast({
                    title: '¡Cuenta creada con éxito! 🎊',
                    description: 'Ya puedes iniciar sesión con tus credenciales',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });

                // ✅ CORRECCIÓN: Limpiar errores y cambiar pestaña
                setRegisterError('');
                setTabIndex(0);

                // ✅ CORRECCIÓN: Limpiar formulario de registro
                setTimeout(() => {
                    if (document.querySelector('form')) {
                        document.querySelector('form').reset();
                    }
                }, 500);

            } else {
                throw new Error(result?.error || 'Error desconocido en el registro');
            }
        } catch (error) {
            let errorMsg = 'Error al crear la cuenta. Inténtalo de nuevo.';
            let errorDetails = '';

            console.error('Error completo en registro:', error);

            if (error?.response?.data) {
                const data = error.response.data;

                // ✅ CORRECCIÓN: Manejo mejorado de errores del backend
                if (typeof data === 'string') {
                    errorMsg = data;
                } else if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.username) {
                    errorMsg = 'Nombre de usuario no disponible';
                    errorDetails = Array.isArray(data.username) ? data.username[0] : data.username;
                } else if (data.email) {
                    errorMsg = 'Correo electrónico no válido o en uso';
                    errorDetails = Array.isArray(data.email) ? data.email[0] : data.email;
                } else if (data.password) {
                    errorMsg = 'Contraseña no cumple los requisitos';
                    errorDetails = Array.isArray(data.password) ? data.password[0] : data.password;
                } else if (data.non_field_errors) {
                    errorMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                }
            } else if (error?.message) {
                if (error.message.includes('Network Error')) {
                    errorMsg = 'Error de conexión. Verifica tu internet.';
                } else {
                    errorMsg = error.message;
                }
            }

            setRegisterError(errorMsg);
            toast({
                title: 'Error en registro',
                description: errorDetails || errorMsg,
                status: 'error',
                duration: 6000,
                isClosable: true,
            });
        } finally {
            setRegisterLoading(false);
        }
    };

    // ✅ LOADING STATE MEJORADO
    if (!ready) {
        return (
            <Flex
                minH="100vh"
                align="center"
                justify="center"
                bgGradient={backgroundGradient}
                p={containerPadding}
            >
                <VStack spacing={6}>
                    <Box
                        w="70px"
                        h="70px"
                        bgGradient={`linear(135deg, ${themeColor}, ${secondaryColor})`}
                        borderRadius="20px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        animation={`${pulseAnimation} 2s ease-in-out infinite`}
                        position="relative"
                        overflow="hidden"
                    >
                        <FiDollarSign size={32} color="white" />
                        <Box
                            position="absolute"
                            bottom="0"
                            left="0"
                            right="0"
                            height="3px"
                            bg="white"
                            animation={`${progressAnimation} 1.5s ease-in-out infinite`}
                        />
                    </Box>
                    <VStack spacing={3}>
                        <Text fontSize="lg" fontWeight="semibold" color={muted}>
                            Inicializando DIMBOX...
                        </Text>
                        <Badge
                            colorScheme={isOnline ? "green" : "orange"}
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                        >
                            <Flex align="center" gap={2}>
                                {isOnline ? <FiWifi /> : <FiWifiOff />}
                                {isOnline ? 'En línea' : 'Offline'}
                            </Flex>
                        </Badge>
                    </VStack>
                </VStack>
            </Flex>
        );
    }

    // ✅ REDIRECCIÓN SI AUTENTICADO - CORREGIDA
    const token = localStorage.getItem('access');
    const shouldRedirect = (token && user && ready && isAuthenticated) || isRedirecting;

    if (shouldRedirect) {
        return (
            <Flex
                minH="100vh"
                align="center"
                justify="center"
                bgGradient={backgroundGradient}
                p={containerPadding}
            >
                <VStack spacing={8}>
                    <Box
                        w="80px"
                        h="80px"
                        bgGradient={`linear(135deg, ${themeColor}, ${secondaryColor})`}
                        borderRadius="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        animation={`${pulseAnimation} 1.5s ease-in-out infinite`}
                        position="relative"
                    >
                        <FiCheck size={36} color="white" />
                        <Box
                            position="absolute"
                            bottom="0"
                            left="0"
                            right="0"
                            height="3px"
                            bg="white"
                            animation={`${progressAnimation} 2s ease-in-out infinite`}
                        />
                    </Box>
                    <VStack spacing={4} textAlign="center" maxW="300px">
                        <Text fontSize="xl" fontWeight="bold" color={muted}>
                            ¡Autenticación exitosa! ✅
                        </Text>
                        <Text fontSize="md" color={muted}>
                            Redirigiendo a tu dashboard financiero...
                        </Text>
                        <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                            <Flex align="center" gap={2}>
                                <FiUser />
                                {user?.name || user?.username}
                            </Flex>
                        </Badge>
                    </VStack>
                </VStack>
            </Flex>
        );
    }

    // ✅ RENDER PRINCIPAL OPTIMIZADO
    return (
        <Flex
            minH="100vh"
            align="center"
            justify="center"
            bgGradient={backgroundGradient}
            p={containerPadding}
            position="relative"
            overflow="hidden"
        >
            {/* BOTÓN DE INSTALACIÓN PWA */}
            {isInstallable && (
                <Box position="absolute" top="4" right="4" zIndex={10}>
                    <Button
                        leftIcon={<FiDownload />}
                        colorScheme="green"
                        size="sm"
                        onClick={handleInstallPWA}
                        animation={`${glowAnimation} 2s ease-in-out infinite`}
                        variant="solid"
                    >
                        Instalar App
                    </Button>
                </Box>
            )}

            {/* INDICADOR DE CONEXIÓN */}
            <Box position="absolute" top="4" left="4" zIndex={10}>
                <Badge
                    colorScheme={isOnline ? "green" : "orange"}
                    fontSize="sm"
                    px={3}
                    py={2}
                    borderRadius="full"
                >
                    <Flex align="center" gap={2}>
                        {isOnline ? <FiWifi /> : <FiWifiOff />}
                        <Text fontWeight="medium">
                            {isOnline ? 'En línea' : 'Offline'}
                        </Text>
                    </Flex>
                </Badge>
            </Box>

            {/* ELEMENTOS DECORATIVOS PROPORCIONALES */}
            <Box
                position="absolute"
                top="-10%"
                right="-10%"
                w={{ base: '300px', md: '400px', lg: '500px' }}
                h={{ base: '300px', md: '400px', lg: '500px' }}
                borderRadius="full"
                bgGradient="linear(to-br, green.200, green.100)"
                opacity={useColorModeValue("0.2", "0.1")}
                animation={`${pulseAnimation} 12s ease-in-out infinite`}
                filter="blur(40px)"
            />
            <Box
                position="absolute"
                bottom="-10%"
                left="-10%"
                w={{ base: '250px', md: '350px', lg: '450px' }}
                h={{ base: '250px', md: '350px', lg: '450px' }}
                borderRadius="full"
                bgGradient="linear(to-br, green.100, green.200)"
                opacity={useColorModeValue("0.15", "0.08")}
                animation={`${pulseAnimation} 10s ease-in-out infinite reverse`}
                filter="blur(35px)"
            />

            {/* CONTENIDO PRINCIPAL CON MEJOR PROPORCIÓN */}
            <Grid
                templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }}
                gap={{ base: 6, md: 12, lg: 16 }}
                w="full"
                maxW="1400px"
                position="relative"
                zIndex={1}
                alignItems="center"
            >
                {/* HERO SECTION (solo desktop) */}
                {isTablet && (
                    <GridItem>
                        <Box
                            bg={cardBg}
                            borderRadius="3xl"
                            boxShadow="xl"
                            p={{ base: 8, lg: 10 }}
                            borderWidth="1px"
                            borderColor={borderColor}
                            height="fit-content"
                            position="sticky"
                            top="8"
                            animation={`${slideInAnimation} 0.6s ease-out`}
                        >
                            <Stack spacing={8}>
                                <FinanzAppLogo size="xl" />

                                <VStack spacing={6} textAlign="center" flex={1}>
                                    <Heading
                                        as="h1"
                                        size={{ base: "xl", lg: "2xl" }}
                                        fontWeight="bold"
                                        lineHeight="1.2"
                                        bgGradient={`linear(to-r, ${themeColor}, ${secondaryColor})`}
                                        bgClip="text"
                                    >
                                        Control Total de Tus{' '}
                                        <Text
                                            as="span"
                                            display="block"
                                            bgGradient={`linear(to-r, ${themeColor}, ${secondaryColor})`}
                                            bgClip="text"
                                        >
                                            Finanzas Personales
                                        </Text>
                                    </Heading>
                                    <Text fontSize={{ base: "md", lg: "lg" }} color={muted} lineHeight="1.6">
                                        Aplicación PWA avanzada con inteligencia artificial,
                                        seguridad bancaria y funcionamiento offline completo
                                    </Text>

                                    <HStack spacing={2} wrap="wrap" justify="center">
                                        <Badge colorScheme="green" fontSize="xs" px={3} py={1} borderRadius="full">
                                            📱 PWA Nativa
                                        </Badge>
                                        <Badge colorScheme="green" fontSize="xs" px={3} py={1} borderRadius="full">
                                            🤖 AI Integrada
                                        </Badge>
                                        <Badge colorScheme="green" fontSize="xs" px={3} py={1} borderRadius="full">
                                            🔒 Seguridad Bancaria
                                        </Badge>
                                    </HStack>
                                </VStack>

                                <Stack spacing={4}>
                                    <FeatureItem
                                        icon={FiTrendingUp}
                                        title="Análisis Inteligente con IA"
                                        text="Tecnología de machine learning que analiza automáticamente tus patrones de gasto"
                                        colorScheme="green"
                                        size="sm"
                                    />
                                    <FeatureItem
                                        icon={FiShield}
                                        title="Seguridad Nivel Enterprise"
                                        text="Encriptación bancaria AES-256 y autenticación de dos factores"
                                        colorScheme="green"
                                        size="sm"
                                    />
                                    <FeatureItem
                                        icon={FiSmartphone}
                                        title="Experiencia PWA Avanzada"
                                        text="Instalación nativa, funcionamiento offline y notificaciones push"
                                        colorScheme="green"
                                        size="sm"
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    </GridItem>
                )}

                {/* FORMULARIO CON MEJORES PROPORCIONES */}
                <GridItem>
                    <Box
                        bg={cardBg}
                        borderRadius="3xl"
                        boxShadow="xl"
                        p={formPadding}
                        borderWidth="1px"
                        borderColor={borderColor}
                        maxW={{ base: "full", md: "450px", lg: "500px" }}
                        mx="auto"
                        w="full"
                        position="relative"
                        animation={`${slideInAnimation} 0.8s ease-out`}
                    >
                        {/* BORDE SUPERIOR VERDE */}
                        <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            height="3px"
                            bgGradient={`linear(to-r, ${themeColor}, ${secondaryColor})`}
                            borderRadius="3xl 3xl 0 0"
                        />

                        {/* LOGO EN MÓVIL */}
                        {!isTablet && (
                            <Box mb={6} textAlign="center">
                                <FinanzAppLogo size="lg" />
                            </Box>
                        )}

                        <VStack spacing={6} align="center" mb={6}>
                            <Heading
                                as="h2"
                                size={{ base: "lg", md: "xl" }}
                                fontWeight="bold"
                                textAlign="center"
                                bgGradient={`linear(to-r, ${themeColor}, ${secondaryColor})`}
                                bgClip="text"
                            >
                                {tabIndex === 0 ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
                            </Heading>
                            <Text color={muted} textAlign="center" fontSize={{ base: "md", md: "lg" }}>
                                {tabIndex === 0
                                    ? 'Accede a tu dashboard financiero personalizado'
                                    : 'Comienza tu journey hacia la libertad financiera'
                                }
                            </Text>
                        </VStack>

                        <Tabs
                            index={tabIndex}
                            onChange={setTabIndex}
                            variant="soft-rounded"
                            colorScheme="green"
                            isFitted
                            size={isMobile ? 'md' : 'lg'}
                        >
                            <TabList
                                mb={6}
                                bg={subtleBg}
                                p={1}
                                borderRadius="xl"
                                border="1px solid"
                                borderColor={borderColor}
                            >
                                <Tab
                                    _selected={{ bg: 'white', color: 'green.600', shadow: 'sm' }}
                                    borderRadius="lg"
                                    fontWeight="semibold"
                                    py={3}
                                    fontSize={{ base: "sm", md: "md" }}
                                >
                                    Iniciar Sesión
                                </Tab>
                                <Tab
                                    _selected={{ bg: 'white', color: 'green.600', shadow: 'sm' }}
                                    borderRadius="lg"
                                    fontWeight="semibold"
                                    py={3}
                                    fontSize={{ base: "sm", md: "md" }}
                                >
                                    Registrarse
                                </Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel px={0} pb={0} pt={2}>
                                    <LoginForm
                                        onFinish={onLoginFinish}
                                        loading={loginLoading}
                                        error={loginError}
                                        onForgotPassword={onOpen}
                                        isOnline={isOnline}
                                    />
                                </TabPanel>
                                <TabPanel px={0} pb={0} pt={2}>
                                    <RegisterForm
                                        onFinish={onRegisterFinish}
                                        loading={registerLoading}
                                        error={registerError}
                                        isOnline={isOnline}
                                    />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>

                        <Box mt={6} pt={4} borderTop="1px" borderColor="gray.200">
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                                Al continuar, aceptas nuestros{' '}
                                <ChakraLink color="green.500" fontWeight="600" href="#">
                                    Términos
                                </ChakraLink>{' '}
                                y{' '}
                                <ChakraLink color="green.500" fontWeight="600" href="#">
                                    Privacidad
                                </ChakraLink>
                            </Text>
                        </Box>
                    </Box>
                </GridItem>
            </Grid>

            <ForgotPasswordModal isOpen={isOpen} onClose={onClose} />
        </Flex>
    );
}