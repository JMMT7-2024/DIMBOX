// src/styles/chakraTheme.js - VERSIÓN CON COLORES VERDES DIMBOX
import { extendTheme } from '@chakra-ui/react';

// ✅ CONFIGURACIÓN DEL TEMA CON COLORES VERDES
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
  cssVarPrefix: 'dimbox',
};

// ✅ COLORES VERDES DIMBOX - REEMPLAZANDO LAS VARIABLES CSS POR VALORES DIRECTOS
const colors = {
  // Color principal VERDE DIMBOX
  brand: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Verde principal DIMBOX
    600: '#16a34a', // Verde secundario
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Colores semánticos
  text: {
    primary: '#1a202c',
    secondary: '#4a5568',
    muted: '#718096',
    inverted: '#ffffff',
  },

  background: {
    app: '#f7fafc',
    card: '#ffffff',
    muted: '#f1f5f9',
    hover: '#e2e8f0',
  },

  border: {
    default: '#e2e8f0',
    focused: '#22c55e',
    subtle: '#f1f5f9',
  },

  // Estados y semántica
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },

  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },

  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Colores neutros
  gray: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923',
  }
};

// ✅ FUENTES
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Fira Code", "SF Mono", "Monaco", "Inconsolata", monospace',
};

// ✅ RADIOS
const radii = {
  none: '0',
  xs: '0.125rem',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

// ✅ SOMBRAS
const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  outline: '0 0 0 3px rgba(34, 197, 94, 0.3)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

// ✅ ESPACIADO
const space = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// ✅ ESTILOS GLOBALES MEJORADOS
const styles = {
  global: {
    ':root': {
      colorScheme: 'light',
    },
    'html, body': {
      backgroundColor: 'background.app',
      color: 'text.primary',
      fontFamily: 'body',
      lineHeight: '1.5',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '*': {
      borderColor: 'border.default',
    },
    '*::placeholder': {
      color: 'text.muted',
      opacity: 1,
    },
    // Scrollbar personalizada
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: 'gray.100',
      borderRadius: 'md',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'gray.400',
      borderRadius: 'md',
      '&:hover': {
        background: 'gray.500',
      },
    },
  },
};

// ✅ COMPONENTES PERSONALIZADOS CON COLORES VERDES
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'md',
      transition: 'all 0.2s ease-in-out',
      _focusVisible: {
        boxShadow: 'outline',
      },
    },
    sizes: {
      xs: {
        h: '24px',
        minW: '24px',
        fontSize: '0.75rem',
        px: '0.5rem',
      },
      sm: {
        h: '32px',
        minW: '32px',
        fontSize: '0.875rem',
        px: '0.75rem',
      },
      md: {
        h: '40px',
        minW: '40px',
        fontSize: '1rem',
        px: '1rem',
      },
      lg: {
        h: '48px',
        minW: '48px',
        fontSize: '1.125rem',
        px: '1.5rem',
      },
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'text.inverted',
        _hover: {
          bg: 'brand.600',
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        _active: {
          bg: 'brand.700',
          transform: 'translateY(0)',
        },
        _disabled: {
          opacity: 0.6,
          cursor: 'not-allowed',
          _hover: {
            bg: 'brand.500',
            transform: 'none',
          },
        },
      },
      outline: {
        border: '2px solid',
        borderColor: 'brand.500',
        color: 'brand.500',
        bg: 'transparent',
        _hover: {
          bg: 'brand.50',
          transform: 'translateY(-1px)',
        },
        _active: {
          bg: 'brand.100',
        },
      },
      ghost: {
        color: 'brand.500',
        bg: 'transparent',
        _hover: {
          bg: 'brand.50',
        },
        _active: {
          bg: 'brand.100',
        },
      },
    },
    defaultProps: {
      colorScheme: 'brand',
      size: 'md',
    },
  },

  Input: {
    baseStyle: {
      field: {
        borderRadius: 'md',
        bg: 'background.card',
        border: '1px solid',
        borderColor: 'border.default',
        transition: 'all 0.2s ease-in-out',
        _placeholder: {
          color: 'text.muted',
        },
        _hover: {
          borderColor: 'border.focused',
        },
        _focusVisible: {
          borderColor: 'border.focused',
          boxShadow: 'outline',
          bg: 'background.card',
        },
        _invalid: {
          borderColor: 'error.500',
          boxShadow: '0 0 0 1px #ef4444',
        },
        _disabled: {
          opacity: 0.6,
          cursor: 'not-allowed',
        },
      },
    },
    variants: {
      outline: {
        field: {
          // Ya definido en baseStyle
        },
      },
      filled: {
        field: {
          bg: 'background.muted',
          border: 'none',
          _hover: {
            bg: 'background.hover',
          },
          _focusVisible: {
            bg: 'background.card',
            border: '1px solid',
            borderColor: 'border.focused',
          },
        },
      },
    },
    sizes: {
      xs: {
        field: {
          h: '24px',
          fontSize: '0.75rem',
          px: '0.5rem',
        },
      },
      sm: {
        field: {
          h: '32px',
          fontSize: '0.875rem',
          px: '0.75rem',
        },
      },
      md: {
        field: {
          h: '40px',
          fontSize: '1rem',
          px: '0.75rem',
        },
      },
      lg: {
        field: {
          h: '48px',
          fontSize: '1.125rem',
          px: '1rem',
        },
      },
    },
    defaultProps: {
      variant: 'outline',
      size: 'md',
      focusBorderColor: 'border.focused',
    },
  },

  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        bg: 'background.card',
        boxShadow: 'base',
        border: '1px solid',
        borderColor: 'border.subtle',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: 'lg',
          _hover: {
            boxShadow: 'xl',
            transform: 'translateY(-2px)',
          },
        },
      },
      outline: {
        container: {
          bg: 'transparent',
          border: '2px solid',
          borderColor: 'border.default',
        },
      },
      filled: {
        container: {
          bg: 'background.muted',
          border: 'none',
        },
      },
    },
    defaultProps: {
      variant: 'elevated',
    },
  },

  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: '2xl',
        bg: 'background.card',
        boxShadow: '2xl',
      },
      header: {
        px: 6,
        pt: 6,
        pb: 2,
        fontSize: 'xl',
        fontWeight: 'bold',
      },
      body: {
        px: 6,
        py: 4,
      },
      footer: {
        px: 6,
        pt: 2,
        pb: 6,
      },
    },
  },

  Tabs: {
    variants: {
      'soft-rounded': {
        tab: {
          borderRadius: 'full',
          fontWeight: 'medium',
          color: 'text.muted',
          _selected: {
            color: 'brand.500',
            bg: 'brand.50',
          },
          _hover: {
            bg: 'background.hover',
          },
        },
      },
      'enclosed-colored': {
        tab: {
          border: '1px solid',
          borderColor: 'transparent',
          mb: '-1px',
          _selected: {
            color: 'brand.500',
            borderColor: 'inherit',
            borderBottomColor: 'background.card',
          },
        },
      },
    },
  },

  Alert: {
    variants: {
      subtle: {
        container: {
          borderRadius: 'lg',
          bg: 'brand.50',
          color: 'brand.700',
        },
      },
    },
  },
};

// ✅ TOKENS SEMÁNTICOS PARA MODOS CLARO/OSCURO
const semanticTokens = {
  colors: {
    'chakra-body-text': { _light: 'text.primary', _dark: 'text.primary' },
    'chakra-body-bg': { _light: 'background.app', _dark: 'background.app' },
    'chakra-border-color': { _light: 'border.default', _dark: 'border.default' },
  },
};

// ✅ CREACIÓN DEL TEMA FINAL
const theme = extendTheme({
  config,
  colors,
  fonts,
  radii,
  shadows,
  space,
  styles,
  components,
  semanticTokens,
  // Breakpoints
  breakpoints: {
    base: '0em',
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  // Tamaños de texto
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },
  // Pesos de fuente
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
});

export default theme;