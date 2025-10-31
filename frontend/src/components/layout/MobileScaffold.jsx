// src/components/MobileScaffold.jsx - VERSIÓN CORREGIDA
import React from "react";
import {
    Box, Flex, Button, Text, VStack, HStack,
    useBreakpointValue, Badge
} from "@chakra-ui/react";
import {
    FiSettings,
    FiDownload,
    FiHome,
    FiPlusCircle,
    FiBarChart2,
    FiLogOut,
    FiUser
} from "react-icons/fi";

/**
 * MobileScaffold - Componente de andamiaje para vistas móviles
 * 
 * Props:
 *  - title: string -> Título principal
 *  - subtitle: string -> Subtítulo
 *  - statusText: string -> Texto de estado
 *  - periodValue: string -> Valor actual del periodo
 *  - onPeriodChange: function -> Callback para cambiar periodo
 *  - onEditProfile: function -> Callback para editar perfil
 *  - onInstall: function -> Callback para instalar
 *  - onLogout: function -> Callback para cerrar sesión
 *  - showBottomNav: boolean -> Mostrar navegación inferior (default: false)
 *  - children: ReactNode -> Contenido principal
 */
export default function MobileScaffold({
    title = "Hola 👋",
    subtitle = "Bienvenido a tu registro personal.",
    statusText = "Conectado",
    periodValue = "Este mes",
    onPeriodChange,
    onEditProfile,
    onInstall,
    onLogout,
    showBottomNav = false,
    children,
}) {
    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ Si no es móvil, renderizar children directamente
    if (!isMobile) {
        return <>{children}</>;
    }

    // ✅ Manejo seguro de callbacks
    const handleEditProfile = () => {
        if (onEditProfile && typeof onEditProfile === 'function') {
            onEditProfile();
        } else {
            console.warn('onEditProfile callback no proporcionado');
        }
    };

    const handleInstall = () => {
        if (onInstall && typeof onInstall === 'function') {
            onInstall();
        } else {
            console.warn('onInstall callback no proporcionado');
        }
    };

    const handleLogout = () => {
        if (onLogout && typeof onLogout === 'function') {
            onLogout();
        } else {
            console.warn('onLogout callback no proporcionado');
        }
    };

    const handlePeriodChange = (value) => {
        if (onPeriodChange && typeof onPeriodChange === 'function') {
            onPeriodChange(value);
        }
    };

    // ✅ Opciones de periodo
    const periodOptions = [
        { label: "Este mes", value: "Este mes" },
        { label: "Últimos 3 meses", value: "Últimos 3 meses" },
        { label: "Últimos 6 meses", value: "Últimos 6 meses" },
        { label: "Este año", value: "Este año" }
    ];

    return (
        <Box className="m-root" minH="100vh" bg="gray.50">
            {/* Header */}
            <Box
                className="m-header"
                bg="white"
                p={4}
                borderBottom="1px"
                borderColor="gray.200"
                shadow="sm"
            >
                <Flex justify="space-between" align="start" gap={3} wrap="wrap">
                    <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="xl" fontWeight="bold" color="gray.800">
                            {title}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                            {subtitle}
                        </Text>
                        <Badge
                            colorScheme="green"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                        >
                            {statusText}
                        </Badge>
                    </VStack>

                    <HStack spacing={2} wrap="wrap">
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiSettings size={14} />}
                            onClick={handleEditProfile}
                            color="gray.600"
                        >
                            Perfil
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiDownload size={14} />}
                            onClick={handleInstall}
                            color="gray.600"
                        >
                            Instalar
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiLogOut size={14} />}
                            onClick={handleLogout}
                            color="red.500"
                            _hover={{ bg: 'red.50' }}
                        >
                            Salir
                        </Button>
                    </HStack>
                </Flex>
            </Box>

            {/* Contenido principal */}
            <Box className="m-content" p={4}>
                {children}
            </Box>

            {/* Selector de periodo */}
            {typeof onPeriodChange === "function" && (
                <Box
                    className="m-section"
                    bg="white"
                    p={4}
                    mx={4}
                    mb={4}
                    borderRadius="lg"
                    shadow="sm"
                    border="1px"
                    borderColor="gray.200"
                >
                    <Text fontSize="md" fontWeight="medium" mb={3} color="gray.700">
                        Ver datos por periodo
                    </Text>

                    <HStack spacing={2} overflowX="auto" py={2}>
                        {periodOptions.map((option) => (
                            <Button
                                key={option.value}
                                size="sm"
                                variant={periodValue === option.value ? "solid" : "outline"}
                                colorScheme={periodValue === option.value ? "blue" : "gray"}
                                onClick={() => handlePeriodChange(option.value)}
                                flexShrink={0}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </HStack>
                </Box>
            )}

            {/* Navegación inferior (opcional) */}
            {showBottomNav && (
                <Box
                    className="m-bottom-nav"
                    bg="white"
                    borderTop="1px"
                    borderColor="gray.200"
                    position="fixed"
                    bottom={0}
                    left={0}
                    right={0}
                    p={2}
                    shadow="lg"
                >
                    <HStack justify="space-around" spacing={0}>
                        <Button
                            variant="ghost"
                            size="sm"
                            flexDirection="column"
                            height="auto"
                            py={2}
                            color="blue.500"
                        >
                            <FiHome size={18} />
                            <Text fontSize="xs" mt={1}>Inicio</Text>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            flexDirection="column"
                            height="auto"
                            py={2}
                            color="gray.600"
                        >
                            <FiPlusCircle size={18} />
                            <Text fontSize="xs" mt={1}>Registro</Text>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            flexDirection="column"
                            height="auto"
                            py={2}
                            color="gray.600"
                        >
                            <FiBarChart2 size={18} />
                            <Text fontSize="xs" mt={1}>Reportes</Text>
                        </Button>
                    </HStack>
                </Box>
            )}

            {/* Espacio para la navegación inferior fija */}
            {showBottomNav && <Box height="60px" />}
        </Box>
    );
}

// ✅ Versión alternativa si prefieres mantener Segmented de Ant Design
/*
import { Segmented } from 'antd';

// Reemplazar el HStack de periodOptions con:
<Segmented
    block
    size="large"
    value={periodValue}
    onChange={handlePeriodChange}
    options={periodOptions}
    style={{ 
        width: '100%',
        borderRadius: '8px'
    }}
/>
*/