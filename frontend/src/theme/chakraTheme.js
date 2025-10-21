// src/theme/chakraTheme.js
import { extendTheme } from '@chakra-ui/react';

// Define tus colores usando las variables CSS
// Chakra puede leer variables CSS directamente si están definidas globalmente
const colors = {
  brand: { // Tu color primario (verde)
    50: 'rgba(var(--primary-color-rgb), 0.1)',
    100: 'rgba(var(--primary-color-rgb), 0.2)',
    200: 'rgba(var(--primary-color-rgb), 0.4)',
    300: 'rgba(var(--primary-color-rgb), 0.6)',
    400: 'rgba(var(--primary-color-rgb), 0.8)',
    500: 'var(--primary-color)', // Color principal
    600: 'color-mix(in srgb, var(--primary-color) 90%, black)', // Un poco más oscuro
    700: 'color-mix(in srgb, var(--primary-color) 80%, black)',
    800: 'color-mix(in srgb, var(--primary-color) 70%, black)',
    900: 'color-mix(in srgb, var(--primary-color) 60%, black)',
  },
  // Mapea tus otros colores a semántica de Chakra (opcional pero útil)
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    light: 'var(--text-light)',
  },
  bg: {
    app: 'var(--bg-app)',
    card: 'var(--bg-card)',
    muted: 'var(--bg-muted)',
  },
  border: {
    main: 'var(--accent-color)',
  },
  // Puedes añadir directamente los colores de éxito/error si quieres
  // success: 'var(--success-color)',
  // error: 'var(--error-color)',
  // warning: 'var(--warning-color)',
};

// Define fuentes
const fonts = {
  heading: 'var(--font-family-base)', // Misma fuente para títulos y cuerpo
  body: 'var(--font-family-base)',
};

// Define radios de borde
const radii = {
  none: '0',
  sm: 'var(--border-radius-sm)',
  base: 'var(--border-radius-md)', // Radio base para Chakra
  md: 'var(--border-radius-md)',
  lg: 'var(--border-radius-lg)',
  xl: 'var(--border-radius-lg)', // Usa lg para xl si quieres consistencia
  full: '9999px',
};

// Define sombras
const shadows = {
  light: 'var(--shadow-light)',
  md: 'var(--shadow-medium)',
  lg: 'var(--shadow-hover)', // Usa hover como lg
  xl: 'var(--shadow-hover)',
  // Puedes añadir outline para el foco si quieres
  outline: '0 0 0 3px rgba(144, 238, 144, 0.5)', // Sombra de foco verde
};

// Estilos globales (opcional, para body o html)
const styles = {
  global: {
    'html, body': {
      // Chakra ya aplica color de fondo y texto desde 'semanticTokens' o base
      // backgroundColor: 'bg.app',
      // color: 'text.primary',
      fontFamily: 'body', // Usa la fuente definida arriba
    },
    // Puedes añadir otros estilos globales aquí
  },
};

// Personalización de componentes específicos (ejemplo)
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600', // Peso de fuente para botones
      borderRadius: 'md', // Usa el radio 'md' definido arriba
      boxShadow: 'light', // Sombra ligera por defecto
    },
    sizes: {
      lg: {
        h: '48px', // Altura botón grande
        fontSize: 'md',
        px: '24px',
      },
      md: {
        h: '40px', // Altura botón mediano
        fontSize: 'sm',
        px: '16px',
      },
    },
    variants: {
      solid: (props) => ({ // Estilo para botones sólidos (colorScheme="green")
        bg: props.colorScheme === 'green' ? 'brand.500' : undefined, // Usa tu color 'brand'
        color: props.colorScheme === 'green' ? 'text.primary' : undefined, // Color de texto
        _hover: {
          bg: props.colorScheme === 'green' ? 'brand.600' : undefined,
          boxShadow: 'md', // Sombra media al hover
        },
        _active: {
          bg: props.colorScheme === 'green' ? 'brand.700' : undefined,
          transform: 'translateY(1px)',
          boxShadow: 'light',
        }
      }),
      // Puedes definir otros variants (ghost, outline, etc.)
    },
  },
  Card: { // Estilo base para el componente Card (si usas @chakra-ui/card)
    baseStyle: {
      container: {
        borderRadius: 'xl', // Usa el radio 'xl'
        boxShadow: 'md', // Sombra media
        borderWidth: '1px',
        borderColor: 'border.main',
        bg: 'bg.card',
      }
    },
    variants: {
      outline: { // Variante por defecto
        container: {
          // Ya definido en baseStyle
        }
      },
      filled: { // Variante con fondo diferente
        container: {
          bg: 'bg.muted'
        }
      }
    }
  },
  Input: { // Estilo para Inputs
    baseStyle: {
      field: { // Estilo al campo de input
        boxShadow: 'light',
        borderWidth: '1px',
        borderColor: 'border.main',
        borderRadius: 'md',
        bg: 'bg.card',
        _hover: {
          borderColor: 'brand.500',
        },
      },
    },
    variants: {
      outline: { // Variante por defecto
        field: {
          _focusVisible: { // Estilo de foco
            borderColor: 'brand.500',
            boxShadow: `0 0 0 1px var(--primary-color), var(--shadow-medium)`, // Usa outline y sombra
            zIndex: 1, // Asegura que esté por encima
          }
        }
      }
    },
    sizes: {
      lg: { // Tamaño grande
        field: { h: '48px', px: '12px', borderRadius: 'md' },
        addon: { h: '48px', borderRadius: 'md' },
      },
      md: { // Tamaño mediano
        field: { h: '40px', px: '12px', borderRadius: 'md' },
        addon: { h: '40px', borderRadius: 'md' },
      }
    }
  },
  // Puedes añadir estilos para NumberInput, Select, DatePicker (si usas uno de Chakra), Tabs, etc.
  // ...
};

// Extiende el tema por defecto de Chakra con tus personalizaciones
const theme = extendTheme({
  colors,
  fonts,
  radii,
  shadows,
  styles,
  components,
});

export default theme; // Exporta el tema completo