import { useCallback } from 'react';

export const useLoginAnalytics = () => {
    const trackLoginEvent = useCallback((event, metadata = {}) => {
        // Google Analytics
        if (window.gtag) {
            window.gtag('event', event, {
                event_category: 'Authentication',
                ...metadata
            });
        }

        // Tu propio sistema de tracking
        console.log(`🔍 Analytics: ${event}`, metadata);

        // Puedes enviar a tu backend aquí
        // api.trackEvent(event, metadata);
    }, []);

    const trackConversion = useCallback((type, value = 0) => {
        trackLoginEvent('conversion', {
            transaction_type: type,
            value: value
        });
    }, [trackLoginEvent]);

    return { trackLoginEvent, trackConversion };
};