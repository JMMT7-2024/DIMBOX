// vite.config.js - CONFIGURACIÓN OPTIMIZADA PARA DIMBOX
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')

  const isProduction = mode === 'production'

  return {
    plugins: [
      react(),

      // ✅ PWA CONFIGURADA PARA DIMBOX
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',

        // ✅ MANIFEST DE DIMBOX
        manifest: {
          name: 'DIMBOX - Gestión Financiera',
          short_name: 'DIMBOX',
          description: 'Control total de tus finanzas personales',
          theme_color: '#3182CE',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['finance', 'productivity'],
          lang: 'es',
          dir: 'ltr',

          icons: [
            {
              src: 'icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            }
          ]
        },

        // ✅ WORKBOX CONFIGURATION
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 2 // 2 horas para datos API
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
                }
              }
            }
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\/.*/
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true
        },

        // ✅ DEV OPTIONS
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html'
        }
      })
    ],

    // ✅ BUILD OPTIMIZADO
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      target: 'es2015',

      // ✅ CHUNKS OPTIMIZADOS PARA TUS DEPENDENCIAS
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': [
              'react',
              'react-dom',
              'react-router-dom'
            ],
            'chakra-vendor': [
              '@chakra-ui/react',
              '@chakra-ui/icons',
              '@emotion/react',
              '@emotion/styled',
              'framer-motion'
            ],
            'chart-vendor': [
              'chart.js',
              'react-chartjs-2',
              'recharts'
            ],
            'utils-vendor': [
              'axios',
              'dayjs',
              'moment',
              'html2canvas',
              'xlsx'
            ],
            'icons-vendor': ['react-icons']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.')[1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/css/i.test(extType)) {
              return 'assets/css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      },

      // ✅ OPTIMIZACIONES DE PERFORMANCE
      chunkSizeWarningLimit: 800,
      reportCompressedSize: false,
      assetsInlineLimit: 4096
    },

    // ✅ SERVER DE DESARROLLO
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,

      // ✅ PROXY PARA TU BACKEND EN RENDER
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://dimbox.onrender.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },

    // ✅ PREVIEW
    preview: {
      port: 4173,
      host: true
    },

    // ✅ ALIAS PARA IMPORTACIONES MÁS LIMPIAS
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@lib': resolve(__dirname, './src/lib'),
        '@assets': resolve(__dirname, './src/assets'),
        '@styles': resolve(__dirname, './src/styles'),
        '@contexts': resolve(__dirname, './src/contexts'),
        '@services': resolve(__dirname, './src/services')
      }
    },

    // ✅ VARIABLES GLOBALES
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __APP_NAME__: JSON.stringify('DIMBOX')
    },

    // ✅ OPTIMIZACIÓN DE CSS
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    }
  }
})