// src/components/GoalCard.jsx
import React from 'react';
import { Card, Typography, Progress, Statistic } from 'antd';

const { Title, Text } = Typography;

export default function GoalCard({ profile = {}, transactions = [] }) {

    // 1. Calcular el ahorro (Suma de transacciones)
    const ingresos = transactions
        .filter(t => t.transaction_type === 'IN')
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const gastos = transactions
        .filter(t => t.transaction_type === 'OUT')
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const saved = Math.max(0, ingresos - gastos);

    // --- ¡ESTA ES LA LÓGICA QUE ARREGLA EL ERROR! ---
    // 2. Lee los datos del 'profile' prop
    const goalAmount = parseFloat(profile.goal_amount) || 0;
    const goalName = profile.goal_name || 'Meta de Ahorro';

    // 3. Calcula el progreso
    const progress = goalAmount > 0 ? Math.min(100, (saved / goalAmount) * 100) : 0;
    // ------------------------------------------------

    return (
        <Card title={goalName}>

            {/* Fila 1: Progreso y Porcentaje */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Text>Progreso este mes</Text>
                <Title level={2} style={{ margin: 0 }}>{progress.toFixed(0)}%</Title>
            </div>

            {/* Fila 2: La barra de progreso */}
            <Progress
                percent={progress}
                showInfo={false}
                strokeColor={{ from: '#90EE90', to: '#59e396' }} // Tu color verde
            />

            {/* Fila 3: Ahorrado vs Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Statistic title="Ahorrado" value={saved} prefix="S/" precision={2} />
                <Statistic title="Meta" value={goalAmount} prefix="S/" precision={2} />
            </div>

        </Card>
    );
}