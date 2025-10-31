// src/features/dashboard/components/OptimizedLoading.jsx - VERSIÓN MEJORADA
import React from 'react';
import {
    Center,
    VStack,
    Spinner,
    Text,
    Progress,
    Box,
    Fade,
    ScaleFade,
    useBreakpointValue,
    keyframes
} from '@chakra-ui/react';
import { FiLoader, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';

// ✅ ANIMACIONES PERSONALIZADAS
const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.6; transform: scale(0.98); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ✅ COMPONENTES DE CARGA ESPECÍFICOS
const LoadingSpinner = ({ size = "xl", color = "green.500", speed = "0.65s" }) => (
    <Spinner
        size={size}
        color={color}
        thickness="3px"
        speed={speed}
        emptyColor="gray.200"
    />
);

const LoadingDots = () => {
    const dotAnimation = keyframes`
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    `;

    return (
        <HStack spacing={1}>
            {[0, 1, 2].map(i => (
                <Box
                    key={i}
                    w={2}
                    h={2}
                    bg="green.500"
                    borderRadius="full"
                    animation={`${dotAnimation} 1.4s infinite ease-in-out both`}
                    animationDelay={`${i * 0.16}s`}
                />
            ))}
        </HStack>
    );
};

const LoadingProgress = ({ value, max = 100, message }) => (
    <VStack spacing={4} w="100%" maxW="300px">
        {message && (
            <Text fontSize="sm" color="gray.600" textAlign="center">
                {message}
            </Text>
        )}
        <Progress
            value={value}
            max={max}
            w="100%"
            colorScheme="green"
            size="sm"
            borderRadius="full"
            hasStripe
            isAnimated
        />
        <Text fontSize="xs" color="gray.500">
            {value}% completado
        </Text>
    </VStack>
);

const LoadingSkeletonCard = () => {
    const pulseAnimation = `${pulse} 2s infinite ease-in-out`;

    return (
        <Box
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="white"
            animation={pulseAnimation}
        >
            <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                    <Box w="60%" h="4" bg="gray.200" borderRadius="md" />
                    <Box w="20%" h="4" bg="gray.200" borderRadius="md" />
                </HStack>
                <Box w="40%" h="3" bg="gray.200" borderRadius="md" />
                <HStack spacing={2}>
                    <Box w="20%" h="6" bg="gray.200" borderRadius="md" />
                    <Box w="15%" h="6" bg="gray.200" borderRadius="md" />
                </HStack>
            </VStack>
        </Box>
    );
};

// ✅ COMPONENTE PRINCIPAL MEJORADO
const OptimizedLoading = ({
    message = "Cargando...",
    type = "spinner", // 'spinner', 'dots', 'progress', 'skeleton'
    size = "md", // 'sm', 'md', 'lg', 'xl'
    color = "green.500",
    speed = "0.65s",
    progressValue = 0,
    progressMax = 100,
    progressMessage,
    showIcon = true,
    isCentered = true,
    minHeight = "200px",
    overlay = false,
    transparent = false,
    children
}) => {
    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ CONFIGURACIÓN DE TAMAÑOS
    const sizeConfig = {
        sm: { spinner: "sm", text: "sm", py: 8 },
        md: { spinner: "md", text: "md", py: 12 },
        lg: { spinner: "lg", text: "lg", py: 16 },
        xl: { spinner: "xl", text: "xl", py: 20 }
    };

    const currentSize = sizeConfig[size] || sizeConfig.md;

    // ✅ RENDERIZAR INDICADOR DE CARGA SEGÚN TIPO
    const renderLoadingIndicator = () => {
        switch (type) {
            case 'dots':
                return <LoadingDots />;

            case 'progress':
                return (
                    <LoadingProgress
                        value={progressValue}
                        max={progressMax}
                        message={progressMessage}
                    />
                );

            case 'skeleton':
                return (
                    <VStack spacing={3} w="100%">
                        {[1, 2, 3].map(i => (
                            <LoadingSkeletonCard key={i} />
                        ))}
                    </VStack>
                );

            case 'spinner':
            default:
                return (
                    <VStack spacing={4}>
                        {showIcon && (
                            <LoadingSpinner
                                size={currentSize.spinner}
                                color={color}
                                speed={speed}
                            />
                        )}
                        {message && (
                            <Text
                                color="gray.600"
                                fontSize={currentSize.text}
                                textAlign="center"
                            >
                                {message}
                            </Text>
                        )}
                    </VStack>
                );
        }
    };

    // ✅ ESTILOS DE CONTENEDOR
    const containerStyles = {
        py: currentSize.py,
        minHeight,
        ...(isCentered && {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }),
        ...(overlay && {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: transparent ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: transparent ? 'none' : 'blur(2px)',
            zIndex: 10
        })
    };

    const content = (
        <ScaleFade initialScale={0.9} in={true}>
            <Box {...containerStyles}>
                {renderLoadingIndicator()}
                {children}
            </Box>
        </ScaleFade>
    );

    return isCentered ? <Center>{content}</Center> : content;
};

// ✅ COMPONENTES ESPECIALIZADOS PARA CASOS DE USO COMUNES
export const PageLoading = ({ message = "Cargando página..." }) => (
    <OptimizedLoading
        message={message}
        type="spinner"
        size="xl"
        minHeight="50vh"
    />
);

export const DataTableLoading = ({ rowCount = 5 }) => (
    <VStack spacing={3} align="stretch">
        {Array.from({ length: rowCount }, (_, i) => (
            <LoadingSkeletonCard key={i} />
        ))}
    </VStack>
);

export const ChartLoading = () => (
    <OptimizedLoading
        message="Generando gráfico..."
        type="dots"
        showIcon={false}
        minHeight="300px"
    />
);

export const ButtonLoading = ({ text = "Procesando..." }) => (
    <HStack spacing={2}>
        <Spinner size="sm" color="currentColor" />
        <Text fontSize="sm">{text}</Text>
    </HStack>
);

export const InlineLoading = () => (
    <Box display="inline-flex" alignItems="center">
        <Spinner size="xs" mr={2} />
        <Text fontSize="sm">Cargando...</Text>
    </Box>
);

// ✅ HOOK PARA MANEJAR ESTADOS DE CARGA
export const useLoading = (initialState = false) => {
    const [isLoading, setIsLoading] = React.useState(initialState);

    const startLoading = React.useCallback(() => setIsLoading(true), []);
    const stopLoading = React.useCallback(() => setIsLoading(false), []);
    const withLoading = React.useCallback(async (asyncFunction) => {
        startLoading();
        try {
            const result = await asyncFunction();
            return result;
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    return {
        isLoading,
        startLoading,
        stopLoading,
        withLoading
    };
};

export default OptimizedLoading;