// src/pages/Admin.jsx
import React, { useEffect, useState } from 'react';
// --- Importa componentes de Chakra UI ---
import {
    Box, Flex, Text, Button, useToast, Container, Stack,
    SimpleGrid, Stat, StatLabel, StatNumber,
    Table, Thead, Tbody, Tr, Th, Td, Tag, // Componentes de Tabla
    Input, InputGroup, InputRightElement, IconButton, // Para búsqueda
    Menu, MenuButton, MenuList, MenuItem, // Para el menú desplegable
    Spinner, // Para indicar carga
    useColorModeValue // Para colores claro/oscuro
} from '@chakra-ui/react';
import { FiSearch, FiMoreVertical } from 'react-icons/fi'; // Iconos

// --- Importa hooks y API (igual que antes) ---
import { useAuth } from '../auth/AuthContext';
import HeaderBar from '../components/HeaderBar'; // Asegúrate que HeaderBar ya esté migrado
import api from '../api';

// --- Componente Principal ---
export default function Admin() {
    const { user } = useAuth(); // Para saludo y protección
    const toast = useToast(); // Notificaciones Chakra
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Para el input de búsqueda

    // Colores y estilos basados en tema
    const tableBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Carga de datos (igual que antes, usa toast)
    const fetchData = async (query = '') => {
        setLoading(true);
        try {
            const [statsData, usersData] = await Promise.all([
                api.getAdminStats(),
                api.getAdminUsers(query)
            ]);
            setStats(statsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching admin data", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos.", status: "error", duration: 5000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        document.title = 'Admin | Control Financiero';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Manejador de acciones (igual que antes, usa toast)
    const handleAction = async (action, id) => {
        // Protección simple para no ejecutar acciones si no hay ID
        if (!id) return;
        try {
            if (action === 'plan-premium') await api.adminSetPlan(id, 'PREMIUM');
            else if (action === 'plan-free') await api.adminSetPlan(id, 'FREE');
            else if (action === 'activate') await api.adminSetActive(id, true);
            else if (action === 'deactivate') await api.adminSetActive(id, false);
            else if (action === 'role-admin') await api.adminSetRole(id, 'ADMIN');
            else if (action === 'role-user') await api.adminSetRole(id, 'USER');

            toast({ title: "Éxito", description: "Acción completada.", status: "success", duration: 3000, isClosable: true });
            fetchData(searchTerm); // Recarga datos manteniendo el filtro
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Error al ejecutar la acción';
            toast({ title: "Error", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        }
    };

    // Manejador de búsqueda
    const handleSearch = () => {
        fetchData(searchTerm);
    };
    // Permite buscar al presionar Enter en el input
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    // --- Renderizado ---
    if (loading && users.length === 0) { // Muestra spinner solo en carga inicial
        return (
            <Flex minH="100vh" align="center" justify="center" bg="gray.50">
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        // Layout principal con Box
        <Box minH="100vh" bg="gray.50">
            {/* HeaderBar ya migrado */}
            <HeaderBar profile={{ name: user?.username }} onProfileClick={null} />

            {/* Contenedor principal */}
            <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
                <Stack spacing={{ base: 4, md: 6 }}>

                    {/* Tarjetas de Estadísticas */}
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 4, md: 6 }}>
                        <StatCard label="Usuarios Totales" value={stats.total || 0} />
                        <StatCard label="Premium" value={stats.premium || 0} color="green.600" />
                        <StatCard label="Free" value={stats.free || 0} />
                        <StatCard label="Activos (Premium)" value={stats.active || 0} color="blue.600" />
                    </SimpleGrid>

                    {/* Tabla de Gestión de Usuarios */}
                    <Box bg={tableBg} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor} p={0} overflowX="auto"> {/* Añade overflowX */}
                        <Flex p={{ base: 4, md: 6 }} justify="space-between" align="center" wrap="wrap" gap={4}>
                            <Text fontSize="xl" fontWeight="semibold">Gestión de Usuarios</Text>
                            <InputGroup w={{ base: '100%', sm: '300px' }}>
                                <Input
                                    placeholder="Buscar por usuario, email o nombre"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress} // Buscar con Enter
                                />
                                <InputRightElement>
                                    <IconButton
                                        aria-label="Buscar usuarios"
                                        icon={<FiSearch />}
                                        size="sm"
                                        onClick={handleSearch} // Buscar con clic
                                    />
                                </InputRightElement>
                            </InputGroup>
                        </Flex>

                        {/* Tabla */}
                        {/* Envuelve la tabla en un Box con overflowX="auto" */}
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                                <Thead bg={useColorModeValue('gray.100', 'gray.800')}>
                                    <Tr>
                                        <Th>Usuario</Th>
                                        <Th>Email</Th>
                                        <Th>Nombre</Th>
                                        <Th>Plan</Th>
                                        <Th>Rol</Th>
                                        <Th>Activo</Th>
                                        <Th isNumeric>Registros</Th> {/* isNumeric alinea a la derecha */}
                                        <Th textAlign="center">Acciones</Th> {/* Centra el título */}
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {loading && users.length > 0 ? ( // Indicador de carga si ya hay usuarios
                                        <Tr><Td colSpan={8} textAlign="center"><Spinner size="md" my={4} /></Td></Tr>
                                    ) : (
                                        users.map((u) => (
                                            <Tr key={u.id}>
                                                <Td><Text fontWeight="medium">{u.username}</Text></Td>
                                                <Td>{u.email || '-'}</Td>
                                                <Td>{u.name || '-'}</Td>
                                                <Td>
                                                    <Tag colorScheme={u.subscription === 'PREMIUM' ? 'green' : 'gray'} size="sm">
                                                        {u.subscription}
                                                    </Tag>
                                                </Td>
                                                <Td>
                                                    <Tag colorScheme={u.role === 'ADMIN' ? 'red' : 'blue'} size="sm">
                                                        {u.role}
                                                    </Tag>
                                                </Td>
                                                <Td textAlign="center">{u.is_active ? '✅' : '⛔'}</Td>
                                                <Td isNumeric>{u.record_count ?? 0}</Td>
                                                <Td textAlign="center"> {/* Centra el botón de menú */}
                                                    <ActionMenu
                                                        userItem={u}
                                                        currentUser={user}
                                                        onAction={handleAction}
                                                    />
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                    {!loading && users.length === 0 && (
                                        <Tr><Td colSpan={8} textAlign="center" py={4}>No se encontraron usuarios.</Td></Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </Box>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}

// --- Componente Auxiliar: Tarjeta de Estadística ---
function StatCard({ label, value, color = 'inherit' }) {
    const bg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    return (
        <Box bg={bg} p={4} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
            <Stat>
                <StatLabel fontSize="sm" color="gray.500">{label}</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold" color={color}>{value}</StatNumber>
            </Stat>
        </Box>
    );
}

// --- Componente Auxiliar: Menú de Acciones ---
function ActionMenu({ userItem, currentUser, onAction }) {
    // Deshabilita acciones sobre sí mismo o sobre superusuario ID 1
    const isDisabled = userItem.id === 1 || userItem.id === currentUser?.id;

    return (
        <Menu isLazy> {/* isLazy mejora rendimiento */}
            <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                aria-label="Opciones de usuario"
                isDisabled={isDisabled}
            />
            <MenuList minW="160px"> {/* Ancho mínimo del menú */}
                <MenuItem onClick={() => onAction('plan-premium', userItem.id)}>
                    Hacer Premium
                </MenuItem>
                <MenuItem onClick={() => onAction('plan-free', userItem.id)}>
                    Hacer Free
                </MenuItem>
                <MenuItem onClick={() => onAction(userItem.is_active ? 'deactivate' : 'activate', userItem.id)}>
                    {userItem.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
                </MenuItem>
                <MenuItem onClick={() => onAction('role-admin', userItem.id)} isDisabled={userItem.role === 'ADMIN'}>
                    Dar Rol Admin
                </MenuItem>
                <MenuItem onClick={() => onAction('role-user', userItem.id)} isDisabled={userItem.role === 'USER'}>
                    Dar Rol User
                </MenuItem>
            </MenuList>
        </Menu>
    );
}