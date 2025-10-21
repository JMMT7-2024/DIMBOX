import React from 'react';
import { Box, Container, Flex, Stack, Text, Button, Badge, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FiSettings } from 'react-icons/fi';

export default function HeaderBar({
    profile = {},
    period,
    onChangePeriod,
    onProfileClick,
    showEditButton = true,
}) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            toast({ title: 'No se pudo cerrar sesión', status: 'error' });
        }
    };

    const name = profile?.name || profile?.username || 'Hola';

    return (
        <Box bg="var(--background)" borderBottom="1px solid var(--line)">
            <Container maxW="container.xl" py={4}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
                    <Stack spacing={1}>
                        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="extrabold">
                            {name} <span role="img" aria-label="saludo">👋</span>
                        </Text>
                        <Badge colorScheme="green" w="fit-content">Conectado</Badge>
                    </Stack>

                    <Flex align="center" gap={2}>
                        {showEditButton && (
                            <Button
                                leftIcon={<FiSettings />}
                                variant="outline"
                                size="sm"
                                onClick={onProfileClick}
                            >
                                Editar perfil
                            </Button>
                        )}
                        <Button colorScheme="red" size="sm" onClick={handleLogout}>
                            Salir
                        </Button>
                    </Flex>
                </Flex>
            </Container>
        </Box>
    );
}
