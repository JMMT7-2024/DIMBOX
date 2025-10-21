// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    InputLeftElement,
    Flex,
    Heading,
    Text,
    Alert,
    AlertIcon,
    AlertDescription,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Progress,
    Checkbox,
    useBreakpointValue,
    Grid,
    GridItem,
    Icon,
    IconButton,
    useToast,
    Stack,
    Link as ChakraLink,
    useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import {
    FiUser,
    FiLock,
    FiMail,
    FiCreditCard,
    FiBarChart2,
    FiSmartphone,
    FiShield,
} from 'react-icons/fi';
import api from '../api';

/* ----------------- Helpers ------------------ */
const passwordScore = (v = '') => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s; // 0..4
};

const scheme = 'green'; // ≈ tu acento #90EE90

/* ----------------- Login Form ------------------ */
const LoginForm = ({ onFinish, loading, error, size, colorScheme }) => {
    const toast = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const onForgot = () =>
        toast({
            title: 'Recuperación de contraseña',
            description: 'Función disponible próximamente.',
            status: 'info',
            duration: 2500,
            isClosable: true,
        });

    const handleSubmit = (e) => {
        e.preventDefault();
        onFinish({ username, password });
    };

    return (
        <Stack as="form" onSubmit={handleSubmit} spacing={5} mt={6}>
            {error && (
                <Alert status="error" borderRadius="md" variant="subtle">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
            )}

            <FormControl isRequired id="login-username">
                <FormLabel fontSize="sm">Usuario</FormLabel>
                <InputGroup size={size}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FiUser} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        pl="2.75rem"
                        placeholder="Tu nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        focusBorderColor={`${scheme}.500`}
                    />
                </InputGroup>
            </FormControl>

            <FormControl isRequired id="login-password">
                <FormLabel fontSize="sm">Contraseña</FormLabel>
                <InputGroup size={size}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FiLock} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        pl="2.75rem"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        focusBorderColor={`${scheme}.500`}
                    />
                    <InputRightElement w="3rem">
                        <IconButton
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowPassword((s) => !s)}
                            variant="ghost"
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        />
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <Flex justify="space-between" align="center">
                <Checkbox defaultChecked size={size === 'lg' ? 'md' : 'sm'} colorScheme={colorScheme}>
                    Recuérdame
                </Checkbox>
                <ChakraLink onClick={onForgot} fontSize="sm" color={`${scheme}.600`} _hover={{ textDecoration: 'underline' }}>
                    ¿Olvidaste tu contraseña?
                </ChakraLink>
            </Flex>

            <Button type="submit" isLoading={loading} colorScheme={colorScheme} size={size} w="full">
                Entrar
            </Button>
        </Stack>
    );
};

/* ----------------- Register Form ------------------ */
const RegisterForm = ({ onFinish, loading, error, size, colorScheme }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pwd, setPwd] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const score = passwordScore(pwd);
    const scorePercent = (score / 4) * 100;

    const handleSubmit = (e) => {
        e.preventDefault();
        onFinish({ name, username, email, password });
    };

    const barColor =
        scorePercent < 50 ? 'red' : scorePercent < 75 ? 'yellow' : 'green';

    return (
        <Stack as="form" onSubmit={handleSubmit} spacing={4} mt={6}>
            {error && (
                <Alert status="error" borderRadius="md" variant="subtle">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
            )}

            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4}>
                <GridItem>
                    <FormControl isRequired id="reg-name">
                        <FormLabel fontSize="sm">Nombre y apellido</FormLabel>
                        <InputGroup size={size}>
                            <InputLeftElement pointerEvents="none">
                                <Icon as={FiCreditCard} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                pl="2.75rem"
                                placeholder="Ej: Jesús Martín"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                focusBorderColor={`${scheme}.500`}
                            />
                        </InputGroup>
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl isRequired id="reg-username">
                        <FormLabel fontSize="sm">Usuario</FormLabel>
                        <InputGroup size={size}>
                            <InputLeftElement pointerEvents="none">
                                <Icon as={FiUser} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                pl="2.75rem"
                                placeholder="Ej: jmartin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                focusBorderColor={`${scheme}.500`}
                            />
                        </InputGroup>
                    </FormControl>
                </GridItem>
            </Grid>

            <FormControl isRequired id="reg-email">
                <FormLabel fontSize="sm">Email</FormLabel>
                <InputGroup size={size}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FiMail} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        pl="2.75rem"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        focusBorderColor={`${scheme}.500`}
                    />
                </InputGroup>
            </FormControl>

            <FormControl isRequired id="reg-password">
                <FormLabel fontSize="sm">Contraseña</FormLabel>
                <InputGroup size={size}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FiLock} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        pl="2.75rem"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setPwd(e.target.value);
                        }}
                        autoComplete="new-password"
                        minLength={6}
                        focusBorderColor={`${scheme}.500`}
                    />
                    <InputRightElement w="3rem">
                        <IconButton
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowPassword((s) => !s)}
                            variant="ghost"
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        />
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            {pwd && (
                <Box mt={-2} mb={2}>
                    <Progress value={scorePercent} size="xs" colorScheme={barColor} borderRadius="full" />
                    <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
                        Fortaleza de la contraseña
                    </Text>
                </Box>
            )}

            <Button type="submit" isLoading={loading} colorScheme={colorScheme} size={size} w="full" mt={2}>
                Crear cuenta
            </Button>
        </Stack>
    );
};

/* ----------------- Página principal ------------------ */
export default function Login() {
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [tabIndex, setTabIndex] = useState(0);

    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const size = useBreakpointValue({ base: 'md', md: 'lg' });
    const headingSize = useBreakpointValue({ base: 'lg', md: 'xl' });
    const isMobile = useBreakpointValue({ base: true, md: false });

    // Colores seguros sin tema custom
    const appBg = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const muted = useColorModeValue('gray.600', 'gray.300');

    useEffect(() => {
        document.title = 'Iniciar sesión';
    }, []);

    const onLoginFinish = async ({ username, password }) => {
        setLoginLoading(true);
        setLoginError('');
        try {
            await login(username, password);
            navigate('/', { replace: true });
        } catch {
            setLoginError('Usuario o contraseña incorrectos.');
            toast({
                title: 'No pudimos iniciar sesión',
                description: 'Verifica tus credenciales e intenta nuevamente.',
                status: 'error',
                duration: 2500,
                isClosable: true,
            });
        } finally {
            setLoginLoading(false);
        }
    };

    const onRegisterFinish = async (values) => {
        setRegisterLoading(true);
        setRegisterError('');
        try {
            await api.register(values);
            toast({
                title: '¡Registro exitoso!',
                description: 'Ahora puedes iniciar sesión.',
                status: 'success',
                duration: 2500,
                isClosable: true,
            });
            setTabIndex(0);
        } catch (err) {
            const errorMsg = err?.response?.data?.detail || 'Error al registrar. Inténtalo de nuevo.';
            setRegisterError(errorMsg);
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <Flex minH="100vh" align="center" justify="center" bg={appBg} p={4}>
            <Grid
                templateColumns={{ base: '1fr', md: 'minmax(300px, 1fr) 1.2fr' }}
                gap={{ base: 6, md: 8 }}
                w="full"
                maxW="960px"
            >
                {/* Columna Lateral */}
                <GridItem display={{ base: 'none', md: 'block' }}>
                    <Box bg={cardBg} borderRadius="xl" boxShadow="md" p={8} borderWidth="1px" borderColor={borderColor} h="full">
                        <Stack spacing={6} h="full">
                            <Heading as="h2" size={headingSize} fontWeight="bold">
                                Controla tus Finanzas 👋
                            </Heading>
                            <Text color={muted}>
                                Administra tus ingresos y gastos con una interfaz clara, rápida y segura.
                            </Text>

                            <Stack spacing={5} mt={6} flexGrow={1}>
                                <FeatureItem icon={FiShield} title="Seguro por Diseño" text="Tus datos permanecen privados y protegidos." />
                                <FeatureItem icon={FiBarChart2} title="Reportes Claros" text="Visualiza tu progreso con gráficos y resúmenes." />
                                <FeatureItem icon={FiSmartphone} title="Optimizado para Móvil" text="Registra y consulta desde cualquier dispositivo." />
                            </Stack>
                        </Stack>
                    </Box>
                </GridItem>

                {/* Tarjeta de Autenticación */}
                <GridItem>
                    <Box bg={cardBg} borderRadius="xl" boxShadow="md" p={{ base: 5, md: 8 }} borderWidth="1px" borderColor={borderColor}>
                        <Flex direction="column" align="center" mb={6}>
                            <Icon as={FiLock} boxSize={7} color={`${scheme}.500`} mb={3} />
                            <Heading as="h2" size={headingSize} fontWeight="bold" mb={1}>
                                Control Financiero
                            </Heading>
                            <Text color={muted}>Ingresa o crea tu cuenta para continuar</Text>
                        </Flex>

                        <Tabs
                            index={tabIndex}
                            onChange={setTabIndex}
                            variant="soft-rounded"
                            colorScheme={scheme}
                            isFitted
                            size={isMobile ? 'sm' : 'md'}
                        >
                            <TabList mb={4}>
                                <Tab>Iniciar Sesión</Tab>
                                <Tab>Registrarse</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel p={0}>
                                    <LoginForm
                                        onFinish={onLoginFinish}
                                        loading={loginLoading}
                                        error={loginError}
                                        size={size}
                                        colorScheme={scheme}
                                    />
                                </TabPanel>
                                <TabPanel p={0}>
                                    <RegisterForm
                                        onFinish={onRegisterFinish}
                                        loading={registerLoading}
                                        error={registerError}
                                        size={size}
                                        colorScheme={scheme}
                                    />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </Box>
                </GridItem>
            </Grid>
        </Flex>
    );
}

/* -------- Item lateral -------- */
function FeatureItem({ icon, title, text }) {
    const iconColor = useColorModeValue('green.500', 'green.300');
    const muted = useColorModeValue('gray.600', 'gray.300');
    return (
        <Flex align="flex-start" gap={3}>
            <Icon as={icon} boxSize={5} color={iconColor} mt="2px" />
            <Box>
                <Text fontWeight="semibold" fontSize="sm">
                    {title}
                </Text>
                <Text fontSize="xs" color={muted}>
                    {text}
                </Text>
            </Box>
        </Flex>
    );
}
