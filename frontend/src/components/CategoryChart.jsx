import React from 'react';
import { Card } from 'antd';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Colors } from 'chart.js';

// Registramos los componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, Colors);

// Mapa de categorías para las etiquetas
const CATEGORY_MAP = {
    'AL': 'Alimentación', 'TR': 'Transporte', 'SE': 'Servicios',
    'VI': 'Vivienda', 'OC': 'Ocio', 'SA': 'Salud',
    'ED': 'Educación', 'OT': 'Otros'
};

export default function CategoryChart({ transactions = [] }) {
    // 1. Agrupamos los gastos por categoría
    const gastos = transactions.filter(t => t.transaction_type === 'OUT');
    const dataAgrupada = gastos.reduce((acc, gasto) => {
        const categoria = gasto.category || 'OT'; // 'OT' si no tiene
        acc[categoria] = (acc[categoria] || 0) + parseFloat(gasto.amount);
        return acc;
    }, {});

    // 2. Preparamos los datos para el gráfico
    const labels = Object.keys(dataAgrupada).map(key => CATEGORY_MAP[key] || 'Otros');
    const dataValues = Object.values(dataAgrupada);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Gastos',
                data: dataValues,
                borderWidth: 0,
                // Chart.js 4+ elegirá colores bonitos automáticamente
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, // Para que se adapte al Card
        plugins: {
            legend: {
                position: 'bottom', // Mueve las etiquetas abajo
            },
        },
    };

    return (
        <Card title="Gastos por Categoría">
            <div style={{ height: '300px' }}> {/* Damos una altura fija al contenedor */}
                {gastos.length > 0 ? (
                    <Doughnut data={chartData} options={options} />
                ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No hay gastos para mostrar</p>
                )}
            </div>
        </Card>
    );
}