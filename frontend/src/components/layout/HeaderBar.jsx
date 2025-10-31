// src/components/HeaderBar.jsx - VERSIÓN ACTUALIZADA CON 3 PLANES
import React, { useMemo } from 'react';
import {
    Box, Flex, HStack, VStack, Text, Button, Avatar, Menu, MenuButton,
    MenuList, MenuItem, MenuDivider, useBreakpointValue, IconButton,
    Tooltip, Badge, useColorModeValue, useDisclosure, Drawer,
    DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent,
    Stack, Divider
} from '@chakra-ui/react';
import {
    FiChevronDown,
    FiLogOut,
    FiUser,
    FiSettings,
    FiShield,
    FiMenu,
    FiHome,
    FiDollarSign,
    FiStar,
    FiAward,
    FiZap,
    FiBriefcase
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from "../../auth/AuthContext";

// 🎯 CONSTANTES Y CONFIGURACIÓN ACTUALIZADA
const APP_CONFIG = {
    name: 'FinanzApp',
    description: 'Control financiero',
    logo: '💰',
    colors: {
        primary: 'green',
        free: 'gray',
        premium: 'purple',
        enterprise: 'red',
        admin: 'purple'
    }
};

const NAVIGATION_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome, description: 'Resumen general' },
    { path: '/transactions', label: 'Transacciones', icon: FiDollarSign, description: 'Ver todos los movimientos' },
];

// 🎯 CONFIGURACIÓN DE PLANES
const PLAN_CONFIG = {
    FREE: {
        label: 'FREE',
        color: 'gray',
        icon: FiUser,
        description: 'Plan Básico',
        badgeVariant: 'subtle'
    },
    PREMIUM: {
        label: 'PREMIUM',
        color: 'purple',
        icon: FiStar,
        description: 'Plan Avanzado',
        badgeVariant: 'solid'
    },
    ENTERPRISE: {
        label: 'ENTERPRISE',
        color: 'red',
        icon: FiBriefcase,
        description: 'Plan Empresarial',
        badgeVariant: 'solid'
    }
};

// 🎯 FUNCIONES UTILITARIAS
const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
};

// 🎯 COMPONENTES DE INTERFAZ REUTILIZABLES
const AppLogo = ({ isMobile, onNavigate, textColor, subtleTextColor }) => (
    <HStack
        spacing={3}
        cursor="pointer"
        onClick={() => onNavigate('/dashboard')}
        flexShrink={0}
    >
        <Box
            w={8}
            h={8}
            bg={`${APP_CONFIG.colors.primary}.500`}
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontWeight="bold"
            fontSize="sm"
        >
            {APP_CONFIG.logo}
        </Box>
        {!isMobile && (
            <VStack spacing={0} align="start">
                <Text fontSize="lg" fontWeight="bold" color={textColor} lineHeight="1">
                    {APP_CONFIG.name}
                </Text>
                <Text fontSize="xs" color={subtleTextColor} lineHeight="1">
                    {APP_CONFIG.description}
                </Text>
            </VStack>
        )}
    </HStack>
);

// 🎯 COMPONENTE ACTUALIZADO - BADGE DE PLAN
const PlanBadge = ({ userPlan }) => {
    if (!userPlan) return null;

    const planConfig = PLAN_CONFIG[userPlan] || PLAN_CONFIG.FREE;

    return (
        <Tooltip label={planConfig.description}>
            <Badge
                colorScheme={planConfig.color}
                variant={planConfig.badgeVariant}
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={1}
            >
                <planConfig.icon size={12} />
                {planConfig.label}
            </Badge>
        </Tooltip>
    );
};

const AdminButton = ({ onNavigate, isMobile, onDrawerClose }) => (
    <Tooltip label="Panel de Administración">
        <Button
            size="sm"
            colorScheme={APP_CONFIG.colors.admin}
            variant="solid"
            leftIcon={<FiShield size={16} />}
            onClick={() => {
                console.log('📍 HeaderBar - Navegando a panel admin');
                onNavigate('/admin');
                if (isMobile && onDrawerClose) onDrawerClose();
            }}
            borderRadius="md"
        >
            Panel Admin
        </Button>
    </Tooltip>
);

const NavigationButton = ({ item, currentPath, onNavigate, isMobile, onDrawerClose }) => (
    <Button
        variant="ghost"
        size="sm"
        onClick={() => {
            onNavigate(item.path);
            if (isMobile && onDrawerClose) onDrawerClose();
        }}
        color={currentPath === item.path ? `${APP_CONFIG.colors.primary}.500` : 'gray.600'}
        fontWeight={currentPath === item.path ? 'semibold' : 'normal'}
        _hover={{
            bg: `${APP_CONFIG.colors.primary}.50`,
            color: `${APP_CONFIG.colors.primary}.600`
        }}
    >
        {item.label}
    </Button>
);

// 🎯 COMPONENTE PRINCIPAL ACTUALIZADO
export default function HeaderBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

    // 🎯 HOOKS Y CONTEXTO
    const {
        me,
        logout,
        ready,
        isPremium, // ← Mantener por compatibilidad
        isAuthenticated
    } = useAuth();

    const isMobile = useBreakpointValue({
        base: true,
        sm: true,
        md: false,
        lg: false,
        xl: false
    });

    // 🎯 COLORES Y ESTILOS
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'white');
    const subtleTextColor = useColorModeValue('gray.600', 'gray.300');

    // 🎯 DERIVACIÓN DE ESTADO DEL USUARIO - ACTUALIZADO
    const userInfo = useMemo(() => {
        if (!me || !ready) {
            console.log('❌ HeaderBar: No hay usuario o no está ready');
            return null;
        }

        // ✅ OBTENER PLAN ACTUAL DEL USUARIO
        const userPlan = me?.subscription || 'FREE';
        const userAdmin = me?.role === 'ADMIN' || me?.is_admin;
        const onAdminPage = location.pathname.startsWith('/admin');
        const userRole = me?.role || 'USER';
        const userName = me?.name || me?.username || 'Usuario';
        const userEmail = me?.email || '';
        const userInitials = getUserInitials(userName);

        console.log('👑 HeaderBar - Estado del usuario:', {
            userPlan,
            isAdmin: userAdmin,
            role: userRole,
            onAdminPage,
            userName
        });

        return {
            userPlan,
            isAdmin: userAdmin,
            onAdminPage,
            userRole,
            userName,
            userEmail,
            userInitials
        };
    }, [me, location.pathname, ready]);

    // 🎯 MANEJADORES DE EVENTOS
    const handleNavigation = (path) => {
        console.log(`📍 HeaderBar - Navegando a: ${path}`);
        navigate(path);
        if (isMobile) onDrawerClose();
    };

    const handleAdminNavigation = () => {
        if (!userInfo?.isAdmin) {
            console.warn('⚠️ HeaderBar - Intento de acceso a admin sin permisos');
            return;
        }
        console.log('📍 HeaderBar - Navegando a panel admin desde menú');
        handleNavigation('/admin');
    };

    const handleProfile = () => {
        onProfileOpen();
        if (isMobile) onDrawerClose();
    };

    const handleSettings = () => {
        handleNavigation('/settings');
    };

    const handleUpgrade = () => {
        console.log('🔼 HeaderBar - Solicitar upgrade de plan');
        handleNavigation('/upgrade');
    };

    const handleLogout = () => {
        console.log('🚪 HeaderBar - Cerrando sesión');
        logout();
        navigate('/login');
    };

    // 🎯 VERIFICAR SI EL USUARIO PUEDE MEJORAR PLAN
    const canUpgrade = userInfo?.userPlan !== 'ENTERPRISE';

    // 🎯 RENDERIZADO DE ESTADOS ESPECIALES
    if (!ready) {
        return (
            <HeaderContainer bgColor={bgColor} borderColor={borderColor}>
                <Flex align="center" justify="space-between" px={{ base: 4, md: 6 }} py={3}>
                    <HStack spacing={3}>
                        <Box
                            w={8}
                            h={8}
                            bg={`${APP_CONFIG.colors.primary}.500`}
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="white"
                            fontWeight="bold"
                            fontSize="sm"
                        >
                            {APP_CONFIG.logo}
                        </Box>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {APP_CONFIG.name}
                        </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                        Cargando...
                    </Text>
                </Flex>
            </HeaderContainer>
        );
    }

    if (!isAuthenticated || !me) {
        console.log('❌ HeaderBar: Usuario no autenticado', { isAuthenticated, hasMe: !!me });
        return null;
    }

    // 🎯 RENDER PRINCIPAL
    return (
        <>
            <HeaderContainer bgColor={bgColor} borderColor={borderColor}>
                <Flex align="center" justify="space-between" px={{ base: 4, md: 6 }} py={3} gap={3}>
                    {/* LADO IZQUIERDO */}
                    <HStack spacing={3} flex="1">
                        {isMobile && (
                            <IconButton
                                icon={<FiMenu size={18} />}
                                variant="ghost"
                                size="sm"
                                onClick={onDrawerOpen}
                                aria-label="Menú principal"
                                color={subtleTextColor}
                                _hover={{ bg: 'gray.50' }}
                            />
                        )}
                        <AppLogo
                            isMobile={isMobile}
                            onNavigate={handleNavigation}
                            textColor={textColor}
                            subtleTextColor={subtleTextColor}
                        />
                        {!isMobile && (
                            <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                                {NAVIGATION_ITEMS.map((item) => (
                                    <NavigationButton
                                        key={item.path}
                                        item={item}
                                        currentPath={location.pathname}
                                        onNavigate={handleNavigation}
                                    />
                                ))}
                            </HStack>
                        )}
                    </HStack>

                    {/* LADO DERECHO */}
                    <HStack spacing={2}>
                        <PlanBadge userPlan={userInfo?.userPlan} />
                        {userInfo?.isAdmin && (
                            <AdminButton
                                onNavigate={handleNavigation}
                                isMobile={isMobile}
                                onDrawerClose={onDrawerClose}
                            />
                        )}
                        <UserMenu
                            userInfo={userInfo}
                            me={me}
                            isMobile={isMobile}
                            textColor={textColor}
                            subtleTextColor={subtleTextColor}
                            userPlan={userInfo?.userPlan}
                            canUpgrade={canUpgrade}
                            onProfile={handleProfile}
                            onSettings={handleSettings}
                            onUpgrade={handleUpgrade}
                            onAdminNavigation={handleAdminNavigation}
                            onLogout={handleLogout}
                        />
                    </HStack>
                </Flex>
            </HeaderContainer>

            {/* DRAWER MÓVIL ACTUALIZADO */}
            <MobileDrawer
                isOpen={isDrawerOpen}
                onClose={onDrawerClose}
                userInfo={userInfo}
                me={me}
                userPlan={userInfo?.userPlan}
                canUpgrade={canUpgrade}
                navigationItems={NAVIGATION_ITEMS}
                currentPath={location.pathname}
                onNavigate={handleNavigation}
                onProfile={handleProfile}
                onSettings={handleSettings}
                onUpgrade={handleUpgrade}
                onAdminNavigation={handleAdminNavigation}
            />
        </>
    );
}

// 🎯 COMPONENTES AUXILIARES ACTUALIZADOS
const HeaderContainer = ({ bgColor, borderColor, children }) => (
    <Box
        as="header"
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        shadow="sm"
        position="sticky"
        top="0"
        zIndex="1000"
    >
        {children}
    </Box>
);

const UserMenu = ({
    userInfo,
    me,
    isMobile,
    textColor,
    subtleTextColor,
    userPlan = 'FREE',
    canUpgrade = true,
    onProfile,
    onSettings,
    onUpgrade,
    onAdminNavigation,
    onLogout
}) => {
    if (!userInfo) return null;

    const planConfig = PLAN_CONFIG[userPlan] || PLAN_CONFIG.FREE;

    return (
        <Menu>
            <MenuButton
                as={Button}
                variant="ghost"
                px={2}
                py={1}
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
                _expanded={{ bg: 'gray.50' }}
                minW="auto"
            >
                <HStack spacing={2}>
                    <Avatar
                        size="sm"
                        name={userInfo.userName}
                        src={me?.avatar}
                        bg={`${planConfig.color}.500`}
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                    />
                    {!isMobile && (
                        <>
                            <VStack spacing={0} align="start" maxW="32">
                                <Text fontSize="sm" fontWeight="medium" color={textColor} noOfLines={1}>
                                    {userInfo.userName}
                                </Text>
                                <Text fontSize="xs" color={subtleTextColor} noOfLines={1}>
                                    {userInfo.userRole === 'ADMIN' ? 'ADMINISTRADOR' : 'USUARIO'}
                                    {userPlan !== 'FREE' && ` • ${planConfig.label}`}
                                </Text>
                            </VStack>
                            <FiChevronDown size={16} color={subtleTextColor} />
                        </>
                    )}
                </HStack>
            </MenuButton>
            <MenuList zIndex="2000" minW="220px">
                <Box px={3} py={2}>
                    <Text fontWeight="medium" fontSize="sm">
                        {userInfo.userName}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                        {userInfo.userEmail}
                    </Text>
                    <HStack spacing={1} mt={1}>
                        <Badge colorScheme={planConfig.color} size="sm">
                            {planConfig.label}
                        </Badge>
                        {userInfo.isAdmin && (
                            <Badge colorScheme={APP_CONFIG.colors.admin} size="sm">
                                ADMIN
                            </Badge>
                        )}
                    </HStack>
                </Box>
                <MenuDivider />

                <MenuItem icon={<FiUser size={16} />} onClick={onProfile}>
                    Mi Perfil
                </MenuItem>
                <MenuItem icon={<FiSettings size={16} />} onClick={onSettings}>
                    Configuración
                </MenuItem>

                {canUpgrade && (
                    <MenuItem
                        icon={<FiZap size={16} />}
                        onClick={onUpgrade}
                        bg="yellow.50"
                        color="yellow.700"
                        fontWeight="medium"
                    >
                        <HStack justify="space-between" width="full">
                            <Text>Mejorar Plan</Text>
                            <Badge colorScheme="yellow" fontSize="2xs">
                                UPGRADE
                            </Badge>
                        </HStack>
                    </MenuItem>
                )}

                {userInfo.isAdmin && (
                    <MenuItem
                        icon={<FiShield size={16} />}
                        onClick={onAdminNavigation}
                        bg={`${APP_CONFIG.colors.admin}.50`}
                        color={`${APP_CONFIG.colors.admin}.600`}
                        fontWeight="medium"
                    >
                        <HStack justify="space-between" width="full">
                            <Text>Panel Admin</Text>
                            <Badge colorScheme={APP_CONFIG.colors.admin} fontSize="2xs">
                                ADMIN
                            </Badge>
                        </HStack>
                    </MenuItem>
                )}

                <MenuDivider />
                <MenuItem
                    icon={<FiLogOut size={16} />}
                    onClick={onLogout}
                    color="red.500"
                >
                    Cerrar Sesión
                </MenuItem>
            </MenuList>
        </Menu>
    );
};

const MobileDrawer = ({
    isOpen,
    onClose,
    userInfo,
    me,
    userPlan = 'FREE',
    canUpgrade = true,
    navigationItems,
    currentPath,
    onNavigate,
    onProfile,
    onSettings,
    onUpgrade,
    onAdminNavigation
}) => {
    if (!userInfo) return null;

    const planConfig = PLAN_CONFIG[userPlan] || PLAN_CONFIG.FREE;

    return (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerHeader borderBottomWidth="1px" bg="gray.50">
                    <HStack spacing={3}>
                        <Avatar
                            size="sm"
                            name={userInfo.userName}
                            bg={`${planConfig.color}.500`}
                        />
                        <VStack spacing={0} align="start">
                            <Text fontWeight="bold" fontSize="sm">{userInfo.userName}</Text>
                            <Text fontSize="xs" color="gray.600">{getGreeting()}</Text>
                            <HStack spacing={1} mt={1}>
                                <Badge colorScheme={planConfig.color} fontSize="2xs">
                                    {planConfig.label}
                                </Badge>
                                {userInfo.isAdmin && (
                                    <Badge colorScheme={APP_CONFIG.colors.admin} fontSize="2xs">
                                        ADMIN
                                    </Badge>
                                )}
                            </HStack>
                        </VStack>
                    </HStack>
                </DrawerHeader>
                <DrawerBody py={4}>
                    <Stack spacing={1}>
                        {navigationItems.map((item) => (
                            <Button
                                key={item.path}
                                variant="ghost"
                                justifyContent="start"
                                leftIcon={<item.icon size={18} />}
                                onClick={() => {
                                    onNavigate(item.path);
                                    onClose();
                                }}
                                color={currentPath === item.path ? `${APP_CONFIG.colors.primary}.500` : 'gray.700'}
                                fontWeight={currentPath === item.path ? 'semibold' : 'normal'}
                                bg={currentPath === item.path ? `${APP_CONFIG.colors.primary}.50` : 'transparent'}
                                _hover={{ bg: `${APP_CONFIG.colors.primary}.50`, color: `${APP_CONFIG.colors.primary}.600` }}
                                size="lg"
                                height="auto"
                                py={3}
                            >
                                <VStack spacing={0} align="start">
                                    <Text>{item.label}</Text>
                                    <Text fontSize="xs" color="gray.500">
                                        {item.description}
                                    </Text>
                                </VStack>
                            </Button>
                        ))}

                        <Divider my={2} />

                        <MobileDrawerActionItem
                            icon={FiUser}
                            label="Mi Perfil"
                            onClick={onProfile}
                        />
                        <MobileDrawerActionItem
                            icon={FiSettings}
                            label="Configuración"
                            onClick={onSettings}
                        />

                        {canUpgrade && (
                            <MobileDrawerActionItem
                                icon={FiZap}
                                label="Mejorar Plan"
                                description="Desbloquear más funciones"
                                onClick={onUpgrade}
                                color="yellow.600"
                                bg="yellow.50"
                                fontWeight="bold"
                            />
                        )}

                        {userInfo.isAdmin && (
                            <MobileDrawerActionItem
                                icon={FiShield}
                                label="Panel de Administración"
                                description="Gestión de usuarios y estadísticas"
                                onClick={onAdminNavigation}
                                color={`${APP_CONFIG.colors.admin}.600`}
                                bg={`${APP_CONFIG.colors.admin}.50`}
                                fontWeight="bold"
                            />
                        )}
                    </Stack>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
};

const MobileDrawerActionItem = ({ icon: Icon, label, description, onClick, color = 'gray.700', bg = 'transparent', fontWeight = 'normal' }) => (
    <Button
        variant="ghost"
        justifyContent="start"
        leftIcon={<Icon size={18} />}
        onClick={onClick}
        color={color}
        fontWeight={fontWeight}
        bg={bg}
        _hover={{ bg: `${color.split('.')[0]}.100` }}
        size="lg"
        height="auto"
        py={3}
    >
        <VStack spacing={0} align="start">
            <Text>{label}</Text>
            {description && (
                <Text fontSize="xs" color={color}>
                    {description}
                </Text>
            )}
        </VStack>
    </Button>
);