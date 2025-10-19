// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd'; // Importa ConfigProvider y AntApp
import { customTheme } from './theme'; // Importa tu tema

// --- ¡ESTA ES LA LÍNEA CORREGIDA! ---
import { AuthProvider, useAuth } from './auth/AuthContext';
// ------------------------------------

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ProtectedRoute from './auth/ProtectedRoute';

// Esta es la función que renderiza las rutas
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute adminOnly={true} />}>
          <Route index element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Este es el componente principal que exportamos
export default function App() {
  return (
    // 1. AuthProvider: Da el contexto de usuario/login a toda la app
    <AuthProvider>
      {/* 2. ConfigProvider: Aplica tu tema verde (theme.js) */}
      <ConfigProvider theme={customTheme}>
        {/* 3. AntApp: Permite que 'message.success' use tu tema */}
        <AntApp>
          {/* 4. AppRoutes: Renderiza las rutas/páginas */}
          <AppRoutes />
        </AntApp>
      </ConfigProvider>
    </AuthProvider>
  )
}