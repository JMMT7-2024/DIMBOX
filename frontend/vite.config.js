// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <-- 1. Importa el plugin

export default defineConfig({
  plugins: [
    react(),

    // --- 2. Añade el plugin aquí ---
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // --- 3. Configura el "manifiesto" de tu app ---
      // Esto le dice al celular cómo debe verse tu app
      manifest: {
        name: 'Control Financiero',
        short_name: 'Control',
        description: 'Tu aplicación de registro de ingresos y gastos.',
        theme_color: '#ffffff', // Color de la barra de estado
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',

        // --- 4. ¡Iconos! ---
        // Debes crear estos íconos y ponerlos en la carpeta 'public/icons/'
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Ícono que se adapta a formas (círculo, cuadrado, etc.)
          }
        ]
      }
    })
  ],
})