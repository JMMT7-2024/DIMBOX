// src/components/layout/FinanzAppLogo.jsx
import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { FiDollarSign } from 'react-icons/fi';

const FinanzAppLogo = ({ size = "lg" }) => (
    <Box textAlign="center" mb={size === "sm" ? 4 : 6}>
        <Box
            w={size === "sm" ? "50px" : "60px"}
            h={size === "sm" ? "50px" : "60px"}
            bgGradient="linear(to-br, green.400, green.600)"
            borderRadius="16px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={3}
            boxShadow="0 4px 14px 0 rgba(72, 187, 120, 0.2)"
        >
            <FiDollarSign size={size === "sm" ? 24 : 28} color="white" />
        </Box>
        <Heading
            size={size === "sm" ? "md" : "lg"}
            bgGradient="linear(to-r, green.500, green.600)"
            bgClip="text"
            mb={1}
            fontWeight="bold"
        >
            FinanzApp
        </Heading>
        <Text
            fontSize={size === "sm" ? "sm" : "md"}
            color="gray.500"
            fontWeight="medium"
        >
            Control inteligente de tus finanzas
        </Text>
    </Box>
);

export default FinanzAppLogo;