// src/components/CategoryChart.jsx
import React from 'react';
import { Box, Text, Flex, useColorModeValue } from '@chakra-ui/react'; // Usa Box, Text, Flex de Chakra
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Colors } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Colors);

// Mapa de categorías (igual que antes)
const CATEGORY_MAP = { /* ... tu mapa de categorías ... */ };

// Función de formato de moneda (importada o definida aquí)
// import { formatCurrency } from '../utils';
function formatCurrency(value, currency = 'PEN', locale = 'es-PE') { /* ... código ... */ }

export default function CategoryChart({ transactions = [] }) {
    // --- Lógica de procesamiento de datos (igual que antes) ---
    const gastos = transactions.filter(t => t.transaction_type === 'OUT');
    const dataAgrupada = gastos.reduce((acc, gasto) => {
        const categoria = gasto.category || 'OT';
        acc[categoria] = (acc[categoria] || 0) + parseFloat(gasto.amount || 0);
        return acc;
    }, {});
    const labels = Object.keys(dataAgrupada).map(key => CATEGORY_MAP[key] || 'Otros');
    const dataValues = Object.values(dataAgrupada);
    // --------------------------------------------------------

    // Determina colores de texto según modo claro/oscuro para etiquetas/tooltips del gráfico
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const tooltipBg = useColorModeValue('white', 'gray.700');
    const tooltipBorder = useColorModeValue('gray.300', 'gray.600');

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Gastos',
                data: dataValues,
                borderWidth: 1, // Borde ligero entre segmentos
                // Chart.js elige colores automáticamente
            },
        ],
    };

    const options = {
        responsive: true, // Se adapta al contenedor
        maintainAspectRatio: false, // Permite controlar altura independientemente del ancho
        plugins: {
            legend: {
                position: 'bottom', // Leyenda abajo
                labels: {
                    color: textColor, // Color de texto del tema
                    boxWidth: 12, // Ancho del cuadro de color
                    padding: 15, // Espaciado de la leyenda
                },
            },
            tooltip: { // Configuración del mensaje emergente (tooltip)
                backgroundColor: tooltipBg,
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: tooltipBorder,
                borderWidth: 1,
                callbacks: {
                    // Formato de la etiqueta del tooltip
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            // Usa formatCurrency si está disponible
                            try {
                                label += formatCurrency(context.parsed);
                            } catch { // Fallback si formatCurrency no está definido
                                label += `S/ ${context.parsed.toFixed(2)}`;
                            }
                        }
                        return label;
                    }
                }
            },
            colors: { // Asegura que el plugin de colores esté activo
                enabled: true
            }
        },
        cutout: '60%', // Grosor del anillo del gráfico (doughnut)
    };

    // Usa Box de Chakra en lugar de Card
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    return (
        <Box
            bg="white"
            borderRadius="lg" // Bordes redondeados
            p={{ base: 4, md: 6 }} // Padding responsivo
            borderWidth="1px" // Borde
            borderColor={borderColor} // Color del borde
            boxShadow="sm" // Sombra
        >
            <Text fontWeight="bold" fontSize="lg" mb={4}>Gastos por Categoría</Text>
            {/* Contenedor con altura fija para el gráfico */}
            <Box height={{ base: "250px", md: "300px" }}>
                {gastos.length > 0 ? (
                    // Renderiza el gráfico si hay datos
                    <Doughnut data={chartData} options={options} />
                ) : (
                    // Mensaje si no hay datos (estado vacío)
                    <Flex height="100%" align="center" justify="center">
                        <Text color="gray.500">No hay gastos para mostrar en el gráfico.</Text>
                    </Flex>
                )}
            </Box>
        </Box>
    );
}