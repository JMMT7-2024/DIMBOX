// src/utils.js

/**
 * Formatea un número como moneda (Soles Peruanos por defecto).
 * @param {number} value - El número a formatear.
 * @param {string} currency - El código de moneda (ej: 'PEN').
 * @param {string} locale - El localizador (ej: 'es-PE').
 * @returns {string} - El valor formateado como moneda.
 */
export function formatCurrency(value, currency = 'PEN', locale = 'es-PE') {
    // Asegura que el valor sea un número, si no, devuelve 0 formateado
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
        value = 0;
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2, // Siempre muestra 2 decimales
        maximumFractionDigits: 2,
    }).format(value);
}

// Puedes añadir más funciones útiles aquí en el futuro