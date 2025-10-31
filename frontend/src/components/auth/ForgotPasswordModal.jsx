// src/components/auth/ForgotPasswordModal.jsx - VERSIÓN DJANGO BACKEND
import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputLeftElement,
    VStack,
    HStack,
    Text,
    Alert,
    AlertIcon,
    AlertDescription,
    useToast,
    ScaleFade,
    Box,
    Progress,
    Collapse
} from '@chakra-ui/react';
import { FiMail, FiCheckCircle, FiArrowLeft, FiKey, FiAlertCircle } from 'react-icons/fi';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // ✅ CORRECCIÓN: Función para reset de password con Django backend
    const handleSendResetEmail = async () => {
        if (!email) {
            toast({
                title: 'Email requerido',
                description: 'Por favor ingresa tu dirección de email.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Validación básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: 'Email inválido',
                description: 'Por favor ingresa una dirección de email válida.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        setError('');

        try {
            // ✅ CORRECCIÓN: Llamada al endpoint de Django para reset de password
            const response = await fetch('/api/auth/password/reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Se ha enviado un enlace de recuperación a ${email}`);
                setStep(2);

                toast({
                    title: 'Email enviado ✅',
                    description: 'Revisa tu bandeja de entrada y sigue las instrucciones.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                // ✅ CORRECCIÓN: Manejo de errores específicos de Django
                let errorMsg = 'No pudimos enviar el email de recuperación.';

                if (data.email) {
                    errorMsg = data.email[0];
                } else if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.non_field_errors) {
                    errorMsg = data.non_field_errors[0];
                } else if (response.status === 404) {
                    errorMsg = 'No existe una cuenta con este email.';
                }

                setError(errorMsg);
                throw new Error(errorMsg);
            }

        } catch (error) {
            console.error('Error enviando email de recuperación:', error);

            const errorMsg = error.message ||
                'Error de conexión. Verifica tu internet e intenta nuevamente.';

            setError(errorMsg);

            toast({
                title: 'Error ❌',
                description: errorMsg,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setStep(1);
        setEmail('');
        setLoading(false);
        setMessage('');
        setError('');
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setMessage('');
            setError('');
        }
    };

    // ✅ MEJORA: Manejo de tecla Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && step === 1 && email) {
            handleSendResetEmail();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered motionPreset="slideInBottom">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <ModalContent mx={4} borderRadius="xl" boxShadow="2xl">
                {/* ✅ MEJORA: Barra de progreso superior */}
                <Box
                    width={`${step === 1 ? '50%' : '100%'}`}
                    height="4px"
                    bgGradient="linear(to-r, green.500, green.600)"
                    transition="all 0.3s ease"
                    borderTopRadius="xl"
                />

                <ModalHeader pb={2}>
                    <HStack align="center" gap={3}>
                        <Box
                            p={2}
                            borderRadius="lg"
                            bgGradient="linear(to-br, green.100, green.50)"
                            color="green.600"
                        >
                            <FiKey size={20} />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                {step === 1 ? 'Recuperar Contraseña' : 'Revisa tu Email'}
                            </Text>
                            <Text fontSize="xs" color="gray.500" fontWeight="normal">
                                Paso {step} de 2
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>

                <ModalBody py={4}>
                    <VStack spacing={4} align="stretch">
                        {/* ✅ MEJORA: Indicador de carga */}
                        <Collapse in={loading}>
                            <Progress
                                size="xs"
                                isIndeterminate
                                colorScheme="green"
                                borderRadius="full"
                            />
                        </Collapse>

                        {step === 1 && (
                            <ScaleFade in initialScale={0.9}>
                                <VStack spacing={4}>
                                    <Box
                                        p={3}
                                        borderRadius="full"
                                        bgGradient="linear(to-br, green.50, blue.50)"
                                        color="green.600"
                                    >
                                        <FiMail size={32} />
                                    </Box>

                                    <Text textAlign="center" color="gray.600" fontSize="sm" lineHeight="1.5">
                                        Ingresa tu dirección de email registrada y te enviaremos un enlace seguro para restablecer tu contraseña.
                                    </Text>

                                    <FormControl isInvalid={!!error}>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Email registrado
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <FiMail color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                type="email"
                                                placeholder="tu@email.com"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setError('');
                                                }}
                                                onKeyPress={handleKeyPress}
                                                autoComplete="email"
                                                focusBorderColor="green.500"
                                                borderColor={error ? "red.300" : "gray.300"}
                                                _hover={{ borderColor: error ? "red.400" : "gray.400" }}
                                                isDisabled={loading}
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    {/* ✅ MEJORA: Mensaje de error específico */}
                                    <Collapse in={!!error} animateOpacity>
                                        <Alert status="error" borderRadius="md" size="sm">
                                            <AlertIcon />
                                            <AlertDescription fontSize="sm">
                                                {error}
                                            </AlertDescription>
                                        </Alert>
                                    </Collapse>

                                    {/* ✅ MEJORA: Información adicional */}
                                    <Box
                                        p={3}
                                        borderRadius="md"
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                    >
                                        <HStack spacing={2} align="start">
                                            <FiAlertCircle color="gray.500" size={16} />
                                            <Text fontSize="xs" color="gray.600">
                                                Asegúrate de ingresar el mismo email que usaste al registrarte en DIMBOX.
                                            </Text>
                                        </HStack>
                                    </Box>
                                </VStack>
                            </ScaleFade>
                        )}

                        {step === 2 && (
                            <ScaleFade in initialScale={0.9}>
                                <VStack spacing={4}>
                                    <Box
                                        p={3}
                                        borderRadius="full"
                                        bgGradient="linear(to-br, green.50, green.100)"
                                        color="green.600"
                                        animation="pulse 2s infinite"
                                    >
                                        <FiCheckCircle size={32} />
                                    </Box>

                                    <Text textAlign="center" color="gray.600" fontSize="sm" lineHeight="1.5">
                                        Hemos enviado un enlace de recuperación seguro a:
                                    </Text>

                                    <Alert status="success" borderRadius="md" variant="subtle">
                                        <AlertIcon />
                                        <AlertDescription fontSize="sm" fontWeight="medium">
                                            {email}
                                        </AlertDescription>
                                    </Alert>

                                    <VStack spacing={3} align="start">
                                        <Text textAlign="center" color="gray.500" fontSize="sm" lineHeight="1.5">
                                            📧 <strong>Revisa tu bandeja de entrada</strong> y sigue las instrucciones en el email para restablecer tu contraseña.
                                        </Text>

                                        <Box
                                            p={3}
                                            borderRadius="md"
                                            bg="blue.50"
                                            border="1px solid"
                                            borderColor="blue.200"
                                            w="full"
                                        >
                                            <VStack spacing={2} align="start">
                                                <Text fontSize="xs" color="blue.800" fontWeight="medium">
                                                    💡 ¿No encuentras el email?
                                                </Text>
                                                <Text fontSize="xs" color="blue.700">
                                                    • Revisa tu carpeta de spam o correo no deseado
                                                </Text>
                                                <Text fontSize="xs" color="blue.700">
                                                    • Verifica que hayas ingresado el email correcto
                                                </Text>
                                                <Text fontSize="xs" color="blue.700">
                                                    • El email puede tardar algunos minutos en llegar
                                                </Text>
                                            </VStack>
                                        </Box>
                                    </VStack>
                                </VStack>
                            </ScaleFade>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter pt={2}>
                    <HStack spacing={3} w="full">
                        {step === 2 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                leftIcon={<FiArrowLeft />}
                                flex={1}
                                size="md"
                                isDisabled={loading}
                            >
                                Volver
                            </Button>
                        )}
                        <Button
                            colorScheme="green"
                            onClick={step === 1 ? handleSendResetEmail : handleClose}
                            isLoading={loading && step === 1}
                            loadingText="Enviando..."
                            flex={step === 1 ? 1 : 2}
                            size="md"
                            bgGradient={step === 1 ? "linear(to-r, green.500, green.600)" : "linear(to-r, green.600, green.700)"}
                            _hover={{
                                bgGradient: step === 1 ?
                                    "linear(to-r, green.600, green.700)" :
                                    "linear(to-r, green.700, green.800)",
                                transform: "translateY(-1px)",
                                boxShadow: "lg"
                            }}
                            _active={{
                                transform: "translateY(0)"
                            }}
                        >
                            {step === 1 ? 'Enviar Enlace' : 'Entendido'}
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ForgotPasswordModal;