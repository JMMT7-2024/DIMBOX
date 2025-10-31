// src/main.jsx - VERSIÓN FINAL CORREGIDA
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App.jsx';
import chakraTheme from './styles/chakraTheme';
import './styles/variables.css';
import './styles/index.css';

// ✅ CONFIGURACIÓN PWA - Registrar Service Worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registrado correctamente:', registration);

      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nuevo Service Worker encontrado:', newWorker);

        newWorker.addEventListener('statechange', () => {
          console.log('📱 Estado del Service Worker:', newWorker.state);
        });
      });

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  }
};

// ✅ MANEJO DE ERRORES GLOBALES
const setupErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Error no manejado en Promise:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.error('❌ Error global capturado:', event.error);
  });
};

// ✅ VERIFICAR CONEXIÓN
const checkConnectivity = () => {
  const updateOnlineStatus = () => {
    console.log(navigator.onLine ? '🌐 Conectado' : '📴 Sin conexión');
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
};

// ✅ INICIALIZACIÓN DE LA APLICACIÓN
const initializeApp = async () => {
  console.log('🚀 Inicializando DIMBOX...');
  console.log('📱 User Agent:', navigator.userAgent);
  console.log('💻 Platform:', navigator.platform);
  console.log('🔧 Vite Mode:', import.meta.env.MODE);
  console.log('🏷️ App Version:', import.meta.env.VITE_APP_VERSION || '2.0.0');

  try {
    // Configurar manejo de errores
    setupErrorHandling();

    // Verificar conectividad
    checkConnectivity();

    // Registrar Service Worker en producción
    if (import.meta.env.PROD) {
      await registerServiceWorker();
    }

    // Montar la aplicación React
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('❌ No se encontró el elemento root');
    }

    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <ChakraProvider theme={chakraTheme}>
          {/* ❌ QUITAR AuthProvider de aquí - ya está en App.jsx */}
          <App />
        </ChakraProvider>
      </React.StrictMode>
    );

    console.log('✅ Aplicación React montada correctamente');

    // Performance monitoring
    if ('performance' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(`📊 ${entry.name}: ${entry.duration}ms`);
        });
      });

      perfObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }

  } catch (error) {
    console.error('💥 Error crítico inicializando la aplicación:', error);

    // Mostrar error en pantalla
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <div>
            <h1 style="font-size: 24px; margin-bottom: 16px;">😔 Error en DIMBOX</h1>
            <p style="margin-bottom: 20px; opacity: 0.9;">Ha ocurrido un error al cargar la aplicación.</p>
            <button 
              onclick="window.location.reload()" 
              style="
                background: white;
                color: #667eea;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
              "
            >
              Reintentar
            </button>
          </div>
        </div>
      `;
    }
  }
};

// ✅ INICIAR LA APLICACIÓN
initializeApp();

// ✅ HOT MODULE REPLACEMENT PARA DESARROLLO
if (import.meta.hot) {
  import.meta.hot.accept();
}