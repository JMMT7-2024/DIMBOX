// src/components/ui/FeatureItem.jsx
import React from 'react';
import { Flex, Box, Text, Icon, useColorModeValue, Fade } from '@chakra-ui/react';

const FeatureItem = ({ icon, title, text }) => {
    const iconColor = useColorModeValue('green.500', 'green.300');
    const muted = useColorModeValue('gray.600', 'gray.300');

    return (
        <Fade in>
            <Flex align="flex-start" gap={4} p={3} borderRadius="lg" _hover={{ bg: 'gray.50' }} transition="all 0.2s">
                <Box
                    w="44px"
                    h="44px"
                    bgGradient="linear(to-br, green.100, green.50)"
                    borderRadius="12px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                >
                    <Icon as={icon} boxSize={5} color={iconColor} />
                </Box>
                <Box flex="1">
                    <Text fontWeight="semibold" fontSize="md" mb={1}>
                        {title}
                    </Text>
                    <Text fontSize="sm" color={muted} lineHeight="1.4">
                        {text}
                    </Text>
                </Box>
            </Flex>
        </Fade>
    );
};

export default FeatureItem;