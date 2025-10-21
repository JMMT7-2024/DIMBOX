// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react'; // 1. Importa ChakraProvider
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import theme from './theme/chakraTheme'; // 2. Importa tu tema Chakra personalizado

// --- CSS Globales ---
// (Chakra incluye su propio reset, no necesitas 'antd/dist/reset.css')
import './styles/variables.css'; // 3. Importa tus variables (si 'theme' las usa)
import './index.css'; // 4. Tu CSS global mínimo (resets básicos)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 5. ChakraProvider envuelve todo y recibe el tema */}
    <ChakraProvider theme={theme}>
      {/* 6. AuthProvider va DENTRO de ChakraProvider */}
      <AuthProvider>
        <App /> {/* Tu componente App principal */}
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);