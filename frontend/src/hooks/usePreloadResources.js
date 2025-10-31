import { useEffect } from 'react';

export const usePreloadResources = () => {
    useEffect(() => {
        // Pre-cargar recursos críticos
        const preloadImages = [
            '/images/dashboard-preview.jpg',
            '/images/charts-sample.png',
        ];

        preloadImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        // Pre-cargar módulos que se usarán después del login
        const preloadModules = [
            import('../api'),
            import('../utils/validation'),
            import('../components/dashboard/DashboardChart')
        ];

        preloadModules.forEach(module => module.catch(() => { }));
    }, []);
};