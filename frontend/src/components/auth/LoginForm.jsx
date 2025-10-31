// src/components/auth/LoginForm.jsx - VERSIÓN OPTIMIZADA Y CORREGIDA
import React, { useState, useEffect } from 'react';
import {
    Stack,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    IconButton,
    Button,
    Alert,
    AlertIcon,
    AlertDescription,
    Flex,
    Checkbox,
    Text,
    Link as ChakraLink,
    ScaleFade,
    Box,
    Collapse,
    useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FiUser, FiLock, FiWifi, FiWifiOff } from 'react-icons/fi';

const LoginForm = ({ onFinish, loading, error, size = "md", colorScheme = "green", onForgotPassword, isOnline = true }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [touched, setTouched] = useState({ username: false, password: false });
    const [formErrors, setFormErrors] = useState({});

    // ✅ MEJORA: Cargar credenciales guardadas al montar el componente
    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername && rememberMe) {
            setUsername(savedUsername);
        }
    }, [rememberMe]);

    // ✅ MEJORA: Validación en tiempo real
    const validateField = (name, value) => {
        const errors = {};

        switch (name) {
            case 'username':
                if (!value.trim()) errors.username = 'El usuario es requerido';
                break;
            case 'password':
                if (!value) errors.password = 'La contraseña es requerida';
                else if (value.length < 1) errors.password = 'Ingresa tu contraseña';
                break;
            default:
                break;
        }

        return errors;
    };

    const handleChange = (field, value) => {
        if (field === 'username') setUsername(value);
        if (field === 'password') setPassword(value);

        // Validar campo en tiempo real si ya fue tocado
        if (touched[field]) {
            const fieldErrors = validateField(field, value);
            setFormErrors(prev => ({
                ...prev,
                [field]: fieldErrors[field]
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const value = field === 'username' ? username : password;
        const fieldErrors = validateField(field, value);
        setFormErrors(prev => ({
            ...prev,
            [field]: fieldErrors[field]
        }));
    };

    // ✅ MEJORA: Validación completa antes de enviar
    const validateForm = () => {
        const errors = {};

        const usernameErrors = validateField('username', username);
        const passwordErrors = validateField('password', password);

        if (usernameErrors.username) errors.username = usernameErrors.username;
        if (passwordErrors.password) errors.password = passwordErrors.password;

        setFormErrors(errors);
        setTouched({ username: true, password: true });

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isOnline) {
            return; // El toast se maneja en el componente padre
        }

        if (!validateForm()) {
            return;
        }

        // ✅ MEJORA: Guardar usuario si "Recordarme" está activado
        if (rememberMe && username.trim()) {
            localStorage.setItem('rememberedUsername', username.trim());
        } else {
            localStorage.removeItem('rememberedUsername');
        }

        // ✅ CORREGIDO: Enviar datos limpios
        onFinish({
            username: username.trim(),
            password
        });
    };

    // ✅ MEJORA: Función para manejo rápido con Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && username.trim() && password) {
            handleSubmit(e);
        }
    };

    // ✅ MEJORA: Colores dinámicos para modo claro/oscuro
    const borderColor = useColorModeValue('gray.300', 'gray.600');
    const hoverBorderColor = useColorModeValue('gray.400', 'gray.500');
    const focusBorderColor = useColorModeValue('green.500', 'green.300');
    const errorBorderColor = useColorModeValue('red.500', 'red.300');
    const errorFocusBorderColor = useColorModeValue('red.500', 'red.400');

    const isFormValid = username.trim() && password && Object.keys(formErrors).length === 0;

    return (
        <ScaleFade in initialScale={0.9}>
            <Stack as="form" onSubmit={handleSubmit} spacing={4}>
                {/* ✅ MEJORA: Alertas de estado de conexión */}
                <Collapse in={!isOnline} animateOpacity>
                    <Alert status="warning" borderRadius="lg" variant="subtle" size="sm">
                        <AlertIcon />
                        <AlertDescription fontSize="sm">
                            Modo offline. No puedes iniciar sesión sin conexión.
                        </AlertDescription>
                    </Alert>
                </Collapse>

                {error && (
                    <Alert status="error" borderRadius="lg" variant="subtle" size="sm">
                        <AlertIcon />
                        <AlertDescription fontSize="sm">{error}</AlertDescription>
                    </Alert>
                )}

                <FormControl isRequired isInvalid={touched.username && formErrors.username}>
                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Usuario o Email
                    </FormLabel>
                    <InputGroup size={size}>
                        <InputLeftElement pointerEvents="none">
                            <FiUser color="gray.400" />
                        </InputLeftElement>
                        <Input
                            pl="2.75rem"
                            placeholder="Tu nombre de usuario o email"
                            value={username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            onBlur={() => handleBlur('username')}
                            onKeyPress={handleKeyPress}
                            autoComplete="username"
                            focusBorderColor={formErrors.username ? errorFocusBorderColor : focusBorderColor}
                            borderColor={formErrors.username ? errorBorderColor : borderColor}
                            _hover={{
                                borderColor: formErrors.username ? errorBorderColor : hoverBorderColor
                            }}
                            _focus={{
                                borderColor: formErrors.username ? errorFocusBorderColor : focusBorderColor,
                                boxShadow: formErrors.username ?
                                    `0 0 0 1px ${errorFocusBorderColor}` :
                                    `0 0 0 1px ${focusBorderColor}`
                            }}
                            isDisabled={loading || !isOnline}
                        />
                    </InputGroup>
                    {formErrors.username && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                            {formErrors.username}
                        </Text>
                    )}
                </FormControl>

                <FormControl isRequired isInvalid={touched.password && formErrors.password}>
                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Contraseña
                    </FormLabel>
                    <InputGroup size={size}>
                        <InputLeftElement pointerEvents="none">
                            <FiLock color="gray.400" />
                        </InputLeftElement>
                        <Input
                            pl="2.75rem"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            onBlur={() => handleBlur('password')}
                            onKeyPress={handleKeyPress}
                            autoComplete="current-password"
                            focusBorderColor={formErrors.password ? errorFocusBorderColor : focusBorderColor}
                            borderColor={formErrors.password ? errorBorderColor : borderColor}
                            _hover={{
                                borderColor: formErrors.password ? errorBorderColor : hoverBorderColor
                            }}
                            _focus={{
                                borderColor: formErrors.password ? errorFocusBorderColor : focusBorderColor,
                                boxShadow: formErrors.password ?
                                    `0 0 0 1px ${errorFocusBorderColor}` :
                                    `0 0 0 1px ${focusBorderColor}`
                            }}
                            isDisabled={loading || !isOnline}
                        />
                        <InputRightElement w="3rem">
                            <IconButton
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                h="1.75rem"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                variant="ghost"
                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                _hover={{ bg: 'gray.100' }}
                                isDisabled={loading || !isOnline}
                            />
                        </InputRightElement>
                    </InputGroup>
                    {formErrors.password && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                            {formErrors.password}
                        </Text>
                    )}
                </FormControl>

                <Flex justify="space-between" align="center" pt={2}>
                    <Checkbox
                        isChecked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size="md"
                        colorScheme={colorScheme}
                        isDisabled={loading || !isOnline}
                    >
                        <Text fontSize="sm" color="gray.600">Recordarme</Text>
                    </Checkbox>
                    <ChakraLink
                        onClick={isOnline ? onForgotPassword : undefined}
                        fontSize="sm"
                        color={isOnline ? "green.600" : "gray.400"}
                        _hover={isOnline ? {
                            textDecoration: 'underline',
                            color: 'green.700',
                            cursor: 'pointer'
                        } : {
                            cursor: 'not-allowed'
                        }}
                        fontWeight="500"
                    >
                        ¿Olvidaste tu contraseña?
                    </ChakraLink>
                </Flex>

                <Button
                    type="submit"
                    isLoading={loading}
                    loadingText="Iniciando sesión..."
                    colorScheme={colorScheme}
                    size={size}
                    w="full"
                    bgGradient={isFormValid && isOnline ?
                        "linear(to-r, green.500, green.600)" :
                        "linear(to-r, gray.300, gray.400)"}
                    _hover={isFormValid && isOnline ? {
                        bgGradient: "linear(to-r, green.600, green.700)",
                        transform: "translateY(-1px)",
                        boxShadow: "lg"
                    } : {}}
                    _active={isFormValid && isOnline ? {
                        transform: "translateY(0)",
                        bgGradient: "linear(to-r, green.600, green.700)"
                    } : {}}
                    _disabled={{
                        bg: 'gray.300',
                        color: 'gray.500',
                        cursor: 'not-allowed',
                        transform: 'none',
                        boxShadow: 'none'
                    }}
                    height="46px"
                    fontSize="md"
                    fontWeight="semibold"
                    isDisabled={!isFormValid || !isOnline || loading}
                    mt={4}
                    transition="all 0.2s"
                    cursor={isFormValid && isOnline ? "pointer" : "not-allowed"}
                >
                    {!isOnline ? (
                        <Flex align="center" gap={2}>
                            <FiWifiOff />
                            Sin conexión
                        </Flex>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </Button>

                {/* ✅ MEJORA: Indicador visual mejorado */}
                <Collapse in={!username.trim() || !password} animateOpacity>
                    <Box textAlign="center">
                        <Text fontSize="xs" color="gray.500" mb={1}>
                            Completa todos los campos para continuar
                        </Text>
                        <Flex justify="center" align="center" gap={4}>
                            <Flex align="center" gap={1}>
                                <Box
                                    w="2"
                                    h="2"
                                    borderRadius="full"
                                    bg={username.trim() ? 'green.500' : 'gray.300'}
                                />
                                <Text fontSize="xs" color="gray.500">Usuario</Text>
                            </Flex>
                            <Flex align="center" gap={1}>
                                <Box
                                    w="2"
                                    h="2"
                                    borderRadius="full"
                                    bg={password ? 'green.500' : 'gray.300'}
                                />
                                <Text fontSize="xs" color="gray.500">Contraseña</Text>
                            </Flex>
                        </Flex>
                    </Box>
                </Collapse>

                {/* ✅ MEJORA: Estado de conexión */}
                <Flex justify="center" align="center" gap={2} mt={2}>
                    <Box
                        color={isOnline ? "green.500" : "orange.500"}
                        fontSize="sm"
                    >
                        {isOnline ? <FiWifi /> : <FiWifiOff />}
                    </Box>
                    <Text fontSize="xs" color="gray.500">
                        {isOnline ? 'Conectado' : 'Sin conexión'}
                    </Text>
                </Flex>
            </Stack>
        </ScaleFade>
    );
};

export default LoginForm;