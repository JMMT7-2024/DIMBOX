// src/theme.js (ACTUALIZADO)
export const customTheme = {
    token: {
        // Colores
        colorPrimary: 'var(--primary-color)',
        colorPrimaryBg: `rgba(var(--primary-color-rgb), 0.15)`,
        colorPrimaryBorder: `rgba(var(--primary-color-rgb), 0.5)`,

        colorSuccess: 'var(--success-color)',
        colorError: 'var(--error-color)',
        colorWarning: 'var(--warning-color)',

        colorTextBase: 'var(--text-primary)',
        colorTextSecondary: 'var(--text-secondary)',
        colorTextTertiary: 'var(--text-muted)',
        colorTextQuaternary: 'var(--text-light)',

        colorBgLayout: 'var(--bg-app)', // Fondo general
        colorBgContainer: 'var(--bg-card)', // Fondo de Cards, Modals, Inputs
        colorBgContainerDisabled: 'var(--bg-muted)', // Fondo de elementos deshabilitados

        colorBorder: 'var(--accent-color)',
        colorBorderSecondary: 'var(--accent-color)', // Para bordes más suaves si los hay

        // Radios
        borderRadius: 'var(--border-radius-base)',
        borderRadiusLG: 'var(--border-radius-lg)',
        borderRadiusSM: 'var(--border-radius-md)', // Usamos md para SM de Antd
        borderRadiusXS: 'var(--border-radius-sm)', // Usamos sm para XS de Antd

        // Fuentes
        fontFamily: 'var(--font-family-base)',
        fontSize: 'var(--font-size-base)',
        lineHeight: 'var(--line-height-base)',

        // Control Item Hover BG (para Selects, Tabs, etc.)
        controlItemBgHover: `rgba(var(--primary-color-rgb), 0.1)`,
    },
    components: {
        Layout: {
            headerBg: 'var(--bg-card)',
            headerHeight: 64,
            headerPadding: '0 24px',
        },
        Card: {
            borderRadiusLG: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-medium)', // Sombra por defecto para tarjetas
            // Sombra al hacer hover (se podría manejar también con CSS directamente)
            // hoverable: { boxShadow: 'var(--shadow-hover)' }, // Antd no tiene token para esto, se maneja con CSS
        },
        Button: {
            borderRadius: 'var(--border-radius-md)',
            borderRadiusLG: 'var(--border-radius-md)',
            fontWeight: 600, // Menos bold, más común
            boxShadow: 'var(--shadow-light)',
            primaryShadow: 'var(--shadow-light)',
            controlHeightLG: 48, // Botones grandes más altos
            controlHeight: 40,
        },
        Input: {
            borderRadius: 'var(--border-radius-md)',
            borderRadiusLG: 'var(--border-radius-md)',
            borderRadiusSM: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-light)',
            activeBorderColor: 'var(--primary-color)',
            activeShadow: '0 0 0 2px rgba(144, 238, 144, 0.2)',
            hoverBorderColor: 'var(--primary-color)',
        },
        InputNumber: {
            borderRadius: 'var(--border-radius-md)',
            borderRadiusLG: 'var(--border-radius-md)',
            borderRadiusSM: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-light)',
            activeBorderColor: 'var(--primary-color)',
            activeShadow: '0 0 0 2px rgba(144, 238, 144, 0.2)',
            hoverBorderColor: 'var(--primary-color)',
        },
        Select: {
            borderRadius: 'var(--border-radius-md)',
            borderRadiusLG: 'var(--border-radius-md)',
            borderRadiusSM: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-light)',
            // Estilos de foco y hover
            controlItemBgActive: `rgba(var(--primary-color-rgb), 0.1)`,
            controlItemBgHover: `rgba(var(--primary-color-rgb), 0.05)`,
        },
        DatePicker: {
            borderRadius: 'var(--border-radius-md)',
            borderRadiusLG: 'var(--border-radius-md)',
            borderRadiusSM: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-light)',
            activeBorderColor: 'var(--primary-color)',
            activeShadow: '0 0 0 2px rgba(144, 238, 144, 0.2)',
            hoverBorderColor: 'var(--primary-color)',
        },
        Tabs: {
            cardBg: 'transparent', // Las tabs tipo tarjeta suelen ir sobre un fondo
            itemSelectedColor: 'var(--text-primary)', // Color del texto de la tab activa
            inkBarColor: 'var(--primary-color)', // La línea debajo de la tab activa
            itemActiveColor: 'var(--primary-color)', // Color al hacer clic en la tab
            itemHoverColor: 'var(--primary-color)', // Color al hacer hover
            // Resto de los estilos específicos se harán con CSS
        },
        Statistic: {
            // Nada por defecto, lo ajustamos en el componente
        },
        Message: { // Mensajes de éxito/error de Ant Design
            colorInfo: 'var(--primary-color)', // Info messages use primary color
            colorSuccess: 'var(--success-color)',
            colorError: 'var(--error-color)',
            colorWarning: 'var(--warning-color)',
        }
    }
};