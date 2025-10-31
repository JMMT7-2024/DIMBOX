// src/components/TestTheme.jsx
import React from 'react';
import { Box, Button, Text, VStack, useColorMode } from '@chakra-ui/react';

export const TestTheme = () => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <VStack spacing={6} p={8}>
            <Text fontSize="2xl" fontWeight="bold">
                Prueba del Tema DIMBOX
            </Text>

            <Box p={4} bg="brand.500" color="white" borderRadius="lg">
                <Text>Color de marca (brand.500)</Text>
            </Box>

            <Button colorScheme="brand" size="lg">
                Botón Primario
            </Button>

            <Button variant="outline" colorScheme="brand">
                Botón Outline
            </Button>

            <Button onClick={toggleColorMode}>
                Cambiar a modo {colorMode === 'light' ? 'oscuro' : 'claro'}
            </Button>

            <Box p={4} border="1px" borderColor="border.default" borderRadius="md">
                <Text>Borde por defecto</Text>
            </Box>

            <Box p={4} bg="background.muted" borderRadius="md">
                <Text>Fondo muted</Text>
            </Box>
        </VStack>
    );
};