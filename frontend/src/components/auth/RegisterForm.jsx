// src/components/auth/RegisterForm.jsx - VERSIÓN CORREGIDA
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
    Box,
    Progress,
    Text,
    Grid,
    useToast,
    ScaleFade,
    VStack,
    HStack,
    Tooltip,
    Collapse
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FiUser, FiLock, FiMail, FiCreditCard, FiCheck, FiX } from 'react-icons/fi';

const passwordScore = (v = '') => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
};

const passwordRequirements = (password) => {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
};

const RegisterForm = ({ onFinish, loading, error, size = "md", colorScheme = "green", isOnline = true }) => {
    const toast = useToast();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [pwd, setPwd] = useState('');
    const [touched, setTouched] = useState({});
    const [formErrors, setFormErrors] = useState({});

    const score = passwordScore(pwd);
    const scorePercent = (score / 4) * 100;
    const barColor = scorePercent < 50 ? 'red' : scorePercent < 75 ? 'yellow' : 'green';
    const requirements = passwordRequirements(pwd);

    // ✅ CORRECCIÓN: Validación mejorada del formulario
    const validateField = (name, value) => {
        const errors = {};

        switch (name) {
            case 'name':
                if (!value.trim()) errors.name = 'El nombre es requerido';
                else if (value.trim().length < 2) errors.name = 'El nombre debe tener al menos 2 caracteres';
                break;
            case 'username':
                if (!value.trim()) errors.username = 'El usuario es requerido';
                else if (value.length < 3) errors.username = 'El usuario debe tener al menos 3 caracteres';
                else if (!/^[a-zA-Z0-9_]+$/.test(value)) errors.username = 'Solo letras, números y guiones bajos';
                break;
            case 'email':
                if (!value.trim()) errors.email = 'El email es requerido';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Email no válido';
                break;
            case 'password':
                if (!value) errors.password = 'La contraseña es requerida';
                else if (value.length < 6) errors.password = 'Mínimo 6 caracteres';
                break;
            default:
                break;
        }

        return errors;
    };

    // ✅ CORRECCIÓN: Manejo de cambios con validación
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'password') {
            setPwd(value);
        }

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
        const fieldErrors = validateField(field, formData[field]);
        setFormErrors(prev => ({
            ...prev,
            [field]: fieldErrors[field]
        }));
    };

    // ✅ CORRECCIÓN: Validación completa antes de enviar
    const validateForm = () => {
        const errors = {};
        Object.keys(formData).forEach(field => {
            const fieldErrors = validateField(field, formData[field]);
            if (fieldErrors[field]) {
                errors[field] = fieldErrors[field];
            }
        });

        setFormErrors(errors);
        setTouched({
            name: true,
            username: true,
            email: true,
            password: true
        });

        return Object.keys(errors).length === 0;
    };

    // ✅ CORRECCIÓN: Manejo de submit mejorado
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isOnline) {
            toast({
                title: '📶 Sin conexión',
                description: 'Necesitas conexión a internet para registrarte',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        if (!validateForm()) {
            toast({
                title: 'Formulario incompleto',
                description: 'Por favor corrige los errores en el formulario',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // ✅ CORRECCIÓN: Asegurar que los datos estén limpios
        const cleanedData = {
            name: formData.name.trim(),
            username: formData.username.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password
        };

        console.log('📤 Enviando datos de registro:', cleanedData);
        onFinish(cleanedData);
    };

    // ✅ CORRECCIÓN: Resetear formulario cuando loading cambia a false (registro exitoso)
    useEffect(() => {
        if (!loading && !error) {
            // Si el loading se detiene y no hay error, podría ser un registro exitoso
            setFormData({
                name: '',
                username: '',
                email: '',
                password: ''
            });
            setPwd('');
            setTouched({});
            setFormErrors({});
        }
    }, [loading, error]);

    // ✅ CORRECCIÓN: Verificar si el formulario es válido
    const isFormValid =
        formData.name.trim() &&
        formData.username.trim() &&
        formData.email.trim() &&
        formData.password &&
        Object.keys(formErrors).length === 0 &&
        formData.password.length >= 6;

    return (
        <ScaleFade in initialScale={0.9}>
            <Stack as="form" onSubmit={handleSubmit} spacing={4}>
                {error && (
                    <Alert status="error" borderRadius="lg" variant="subtle" size="sm">
                        <AlertIcon />
                        <AlertDescription fontSize="sm">{error}</AlertDescription>
                    </Alert>
                )}

                {!isOnline && (
                    <Alert status="warning" borderRadius="lg" variant="subtle" size="sm">
                        <AlertIcon />
                        <AlertDescription fontSize="sm">
                            Modo offline. Necesitas conexión para registrarte.
                        </AlertDescription>
                    </Alert>
                )}

                <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4}>
                    <FormControl isRequired isInvalid={touched.name && formErrors.name}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                            Nombre completo
                        </FormLabel>
                        <InputGroup size={size}>
                            <InputLeftElement pointerEvents="none">
                                <FiCreditCard color="gray.400" />
                            </InputLeftElement>
                            <Input
                                pl="2.75rem"
                                placeholder="Ej: María González"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                autoComplete="name"
                                focusBorderColor={formErrors.name ? "red.500" : "green.500"}
                                borderColor={formErrors.name ? "red.300" : "gray.300"}
                                _hover={{ borderColor: formErrors.name ? "red.400" : "gray.400" }}
                                isDisabled={loading || !isOnline}
                            />
                        </InputGroup>
                        {formErrors.name && (
                            <Text fontSize="xs" color="red.500" mt={1}>
                                {formErrors.name}
                            </Text>
                        )}
                    </FormControl>

                    <FormControl isRequired isInvalid={touched.username && formErrors.username}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                            Usuario
                        </FormLabel>
                        <InputGroup size={size}>
                            <InputLeftElement pointerEvents="none">
                                <FiUser color="gray.400" />
                            </InputLeftElement>
                            <Input
                                pl="2.75rem"
                                placeholder="Ej: mgonzalez"
                                value={formData.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                onBlur={() => handleBlur('username')}
                                autoComplete="username"
                                focusBorderColor={formErrors.username ? "red.500" : "green.500"}
                                borderColor={formErrors.username ? "red.300" : "gray.300"}
                                _hover={{ borderColor: formErrors.username ? "red.400" : "gray.400" }}
                                isDisabled={loading || !isOnline}
                            />
                        </InputGroup>
                        {formErrors.username && (
                            <Text fontSize="xs" color="red.500" mt={1}>
                                {formErrors.username}
                            </Text>
                        )}
                    </FormControl>
                </Grid>

                <FormControl isRequired isInvalid={touched.email && formErrors.email}>
                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Correo electrónico
                    </FormLabel>
                    <InputGroup size={size}>
                        <InputLeftElement pointerEvents="none">
                            <FiMail color="gray.400" />
                        </InputLeftElement>
                        <Input
                            pl="2.75rem"
                            type="email"
                            placeholder="tu@correo.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            autoComplete="email"
                            focusBorderColor={formErrors.email ? "red.500" : "green.500"}
                            borderColor={formErrors.email ? "red.300" : "gray.300"}
                            _hover={{ borderColor: formErrors.email ? "red.400" : "gray.400" }}
                            isDisabled={loading || !isOnline}
                        />
                    </InputGroup>
                    {formErrors.email && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                            {formErrors.email}
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
                            placeholder="Mínimo 8 caracteres"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            onBlur={() => handleBlur('password')}
                            autoComplete="new-password"
                            minLength={6}
                            focusBorderColor={formErrors.password ? "red.500" : "green.500"}
                            borderColor={formErrors.password ? "red.300" : "gray.300"}
                            _hover={{ borderColor: formErrors.password ? "red.400" : "gray.400" }}
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

                {pwd && (
                    <Box>
                        <VStack spacing={2} align="stretch">
                            <Progress
                                value={scorePercent}
                                size="xs"
                                colorScheme={barColor}
                                borderRadius="full"
                                hasStripe
                                isAnimated
                            />
                            <Text fontSize="xs" color="gray.500" textAlign="right">
                                Fortaleza: {scorePercent < 50 ? 'Débil' : scorePercent < 75 ? 'Media' : 'Fuerte'}
                            </Text>

                            <Collapse in={pwd.length > 0}>
                                <VStack spacing={1} align="stretch" mt={2}>
                                    <HStack spacing={2}>
                                        <Box color={requirements.length ? "green.500" : "gray.400"}>
                                            {requirements.length ? <FiCheck size={12} /> : <FiX size={12} />}
                                        </Box>
                                        <Text fontSize="xs" color={requirements.length ? "green.600" : "gray.500"}>
                                            Mínimo 8 caracteres
                                        </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                        <Box color={requirements.uppercase ? "green.500" : "gray.400"}>
                                            {requirements.uppercase ? <FiCheck size={12} /> : <FiX size={12} />}
                                        </Box>
                                        <Text fontSize="xs" color={requirements.uppercase ? "green.600" : "gray.500"}>
                                            Al menos una mayúscula
                                        </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                        <Box color={requirements.number ? "green.500" : "gray.400"}>
                                            {requirements.number ? <FiCheck size={12} /> : <FiX size={12} />}
                                        </Box>
                                        <Text fontSize="xs" color={requirements.number ? "green.600" : "gray.500"}>
                                            Al menos un número
                                        </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                        <Box color={requirements.special ? "green.500" : "gray.400"}>
                                            {requirements.special ? <FiCheck size={12} /> : <FiX size={12} />}
                                        </Box>
                                        <Text fontSize="xs" color={requirements.special ? "green.600" : "gray.500"}>
                                            Al menos un carácter especial
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Collapse>
                        </VStack>
                    </Box>
                )}

                <Tooltip
                    label={!isOnline ? "Necesitas conexión a internet" : "Completa todos los campos correctamente"}
                    isDisabled={isFormValid && isOnline}
                >
                    <Button
                        type="submit"
                        isLoading={loading}
                        loadingText="Creando cuenta..."
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
                            transform: "translateY(0)"
                        } : {}}
                        height="46px"
                        fontSize="md"
                        fontWeight="semibold"
                        isDisabled={!isFormValid || !isOnline || loading}
                        mt={2}
                        cursor={isFormValid && isOnline ? "pointer" : "not-allowed"}
                    >
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                </Tooltip>
            </Stack>
        </ScaleFade>
    );
};

export default RegisterForm;