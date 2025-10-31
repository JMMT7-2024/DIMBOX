// src/components/UpgradeModal.jsx - FALTANTE
import React from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, HStack, Text, Badge, Box, Divider, Alert, AlertIcon
} from '@chakra-ui/react';
import { FiStar, FiCheck, FiZap, FiDownload, FiBarChart2 } from 'react-icons/fi';

const UpgradeModal = ({ isOpen, onClose, currentPlan, onUpgrade }) => {
    const plans = [
        {
            name: 'FREE',
            price: 'Gratis',
            features: [
                'Hasta 100 transacciones',
                '3 cuentas rápidas',
                '8 categorías básicas',
                '3 meses de historial',
                'Sin exportación Excel'
            ],
            current: currentPlan === 'FREE'
        },
        {
            name: 'PREMIUM',
            price: 'S/ 9.99/mes',
            features: [
                'Transacciones ilimitadas',
                '50 cuentas rápidas',
                '20 categorías avanzadas',
                '24 meses de historial',
                'Exportación Excel completa',
                'Análisis avanzados',
                'Soporte prioritario'
            ],
            current: currentPlan === 'PREMIUM',
            popular: true
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={3}>
                        <FiStar color="gold" />
                        <Text>Actualiza tu Plan</Text>
                    </HStack>
                </ModalHeader>

                <ModalBody>
                    <VStack spacing={6}>
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Text>Desbloquea todas las funcionalidades premium</Text>
                        </Alert>

                        <HStack spacing={4} width="100%">
                            {plans.map((plan) => (
                                <Box
                                    key={plan.name}
                                    border="2px"
                                    borderColor={plan.popular ? 'green.400' : 'gray.200'}
                                    borderRadius="xl"
                                    p={6}
                                    flex="1"
                                    bg="white"
                                    position="relative"
                                    _hover={{ shadow: 'lg', transform: 'translateY(-4px)' }}
                                    transition="all 0.3s"
                                >
                                    {plan.popular && (
                                        <Badge
                                            colorScheme="green"
                                            position="absolute"
                                            top={-3}
                                            left="50%"
                                            transform="translateX(-50%)"
                                            fontSize="xs"
                                        >
                                            MÁS POPULAR
                                        </Badge>
                                    )}

                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {plan.name}
                                            </Text>
                                            <Text fontSize="lg" color="gray.600" fontWeight="medium">
                                                {plan.price}
                                            </Text>
                                            {plan.current && (
                                                <Badge colorScheme="blue" mt={2}>
                                                    Plan Actual
                                                </Badge>
                                            )}
                                        </Box>

                                        <Divider />

                                        <VStack spacing={2} align="start">
                                            {plan.features.map((feature, index) => (
                                                <HStack key={index} spacing={2}>
                                                    <FiCheck
                                                        size={16}
                                                        color={plan.name === 'PREMIUM' ? 'green' : 'gray'}
                                                    />
                                                    <Text fontSize="sm">{feature}</Text>
                                                </HStack>
                                            ))}
                                        </VStack>

                                        <Button
                                            colorScheme={plan.popular ? 'green' : 'gray'}
                                            variant={plan.current ? 'outline' : 'solid'}
                                            isDisabled={plan.current}
                                            onClick={() => plan.name === 'PREMIUM' && onUpgrade()}
                                            size="lg"
                                            width="100%"
                                        >
                                            {plan.current ? 'Plan Actual' :
                                                plan.name === 'PREMIUM' ? '¡Actualizar!' : 'Seleccionar'}
                                        </Button>
                                    </VStack>
                                </Box>
                            ))}
                        </HStack>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Quizás después
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default UpgradeModal;