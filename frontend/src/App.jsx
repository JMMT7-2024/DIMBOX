// src/App.jsx - VERSIÓN CON REDIRECCIÓN AUTOMÁTICA
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, Text, Button, Progress, Center, VStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import theme from './styles/chakraTheme';

// ✅ IMPORTAR TODOS LOS COMPONENTES NECESARIOS
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

// ✅ ANIMACIÓN PARA LA BARRA DE CARGA (usando @emotion/react)
const progressAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
`;

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

// ✅ COMPONENTE DE CARGA PROFESIONAL CORREGIDO
function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <Center height="100vh" bg="gray.50" flexDirection="column" position="relative">
      {/* Barra de progreso horizontal animada */}
      <Box position="absolute" top="0" left="0" right="0" width="100%">
        <Progress
          size="xs"
          colorScheme="green"
          isIndeterminate
          bg="gray.200"
          sx={{
            '& > div': {
              background: 'linear-gradient(90deg, #38A169, #48BB78, #38A169)',
              animation: `${progressAnimation} 2s ease-in-out infinite`,
            }
          }}
        />
      </Box>

      <VStack spacing={6} textAlign="center" px={8}>
        {/* Logo o ícono animado */}
        <Box
          animation={`${pulse} 2s infinite`}
          bgGradient="linear(to-r, green.500, green.600)"
          width="60px"
          height="60px"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="lg"
        >
          <Text fontSize="2xl" fontWeight="bold" color="white">
            D
          </Text>
        </Box>

        {/* Texto de carga */}
        <VStack spacing={3}>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="gray.700"
            animation={`${pulse} 2s infinite`}
          >
            {message}
          </Text>
          <Text fontSize="sm" color="gray.500" maxW="300px">
            Preparando tu experiencia...
          </Text>
        </VStack>
      </VStack>
    </Center>
  );
}

// ✅ COMPONENTE PROTEGIDO
function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return <LoadingSpinner message="Verificando autenticación..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ✅ COMPONENTE PÚBLICO (redirige al dashboard si está autenticado)
function PublicRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return <LoadingSpinner message="Cargando aplicación..." />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

// ✅ PÁGINA DE INICIO SIMPLIFICADA - AHORA REDIRIGE AUTOMÁTICAMENTE
function Home() {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return <LoadingSpinner message="Inicializando..." />;
  }

  // ✅ REDIRECCIÓN AUTOMÁTICA - Sin mostrar botones
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }

  // ❌ Este código ya no se ejecuta, pero lo dejamos como referencia
  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Box textAlign="center" p={8}>
        <Text fontSize="4xl" fontWeight="bold" bgGradient="linear(to-r, green.500, green.600)" bgClip="text" mb={4}>
          ¡DIMBOX Funciona! 🎉
        </Text>
        <Text fontSize="lg" color="gray.600" mb={6}>
          {isAuthenticated ? 'Ya estás autenticado' : 'Sistema de Gestión Financiera'}
        </Text>
        <Button
          as="a"
          href={isAuthenticated ? "/dashboard" : "/login"}
          colorScheme="green"
          size="lg"
          _hover={{ transform: 'translateY(-2px)' }}
          transition="all 0.2s"
        >
          {isAuthenticated ? 'Ir al Dashboard' : 'Iniciar Sesión'}
        </Button>
      </Box>
    </Box>
  );
}

// ✅ COMPONENTE 404
function NotFound() {
  return (
    <Center minH="100vh" bg="gray.50">
      <Box textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color="gray.400" mb={4}>
          404
        </Text>
        <Text fontSize="xl" color="gray.600" mb={6}>
          Página no encontrada
        </Text>
        <Button
          as="a"
          href="/"
          colorScheme="green"
        >
          Volver al Inicio
        </Button>
      </Box>
    </Center>
  );
}

// ✅ CONTENIDO PRINCIPAL DE LA APP
function AppContent() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Routes>
        {/* Ruta pública - Home (ahora redirige automáticamente) */}
        <Route path="/" element={<Home />} />

        {/* Ruta de login - solo para no autenticados */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Ruta del dashboard - solo para autenticados */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ RUTA DE ADMIN - AGREGADA */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Box>
  );
}

// ✅ COMPONENTE PRINCIPAL
function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;