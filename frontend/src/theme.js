// src/theme.js
// Basado en tus variables CSS de index.html
const VERDE_ACCENT = '#90EE90'; // --accent
const TINTA_TEXTO = '#1A202C';   // --ink
const FONDO_APP = '#F9FAFB';     // --bg
const LINEA_BORDE = '#E2E8F0';   // --line

export const customTheme = {
    token: {
        // Color Primario (botones, enlaces, foco)
        colorPrimary: VERDE_ACCENT,

        // Fuentes
        fontFamily: 'Inter, sans-serif',
        colorTextBase: TINTA_TEXTO,

        // Fondos
        colorBgLayout: FONDO_APP, // Fondo general de la app
        colorBgContainer: '#FFFFFF', // Fondo de Cards, Modals, etc.

        // Bordes
        colorBorder: LINEA_BORDE,
        borderRadius: 16, // --card border-radius
        borderRadiusLG: 16,
    },
    components: {
        Layout: {
            headerBg: '#FFFFFF', // Fondo del Header
            headerHeight: 64,
            headerPadding: '0 24px',
        },
        Card: {
            borderRadiusLG: 16,
        },
        Button: {
            borderRadius: 12, // --btn-accent border-radius
            borderRadiusLG: 12,
            fontWeight: 700,
        }
    }
};