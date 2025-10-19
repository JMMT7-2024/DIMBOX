// src/components/HistoryList.jsx
import React from 'react';
import { Card, List, Typography, Button, Tag, Space } from 'antd';

const { Text } = Typography;

// ¡Nos aseguramos de recibir 'handleDelete' y 'handleEdit'!
export default function HistoryList({ transactions = [], handleDelete, handleEdit }) {

    const sortedList = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (transactions.length === 0) {
        return <Card title="Últimos Movimientos"><Text type="secondary">Aún no hay movimientos registrados.</Text></Card>;
    }

    return (
        <Card title="Últimos Movimientos">
            <List
                itemLayout="horizontal"
                dataSource={sortedList}
                renderItem={(item) => {
                    const isIncome = item.transaction_type === 'IN';
                    const amountColor = isIncome ? 'green' : 'red';
                    const sign = isIncome ? '+' : '-';
                    const description = item.description || (isIncome ? 'Ingreso' : 'Gasto');

                    return (
                        <List.Item
                            actions={[
                                // ¡Nos aseguramos que los onClick estén correctos!
                                <Button type="link" onClick={() => handleEdit(item)}>Editar</Button>,
                                <Button type="link" danger onClick={() => handleDelete(item.id)}>Borrar</Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={description}
                                description={item.date}
                            />
                            <Space>
                                {!isIncome && <Tag>{item.category || 'OT'}</Tag>}
                                <Text style={{ color: amountColor, fontWeight: 'bold' }}>
                                    {sign} S/ {parseFloat(item.amount).toFixed(2)}
                                </Text>
                            </Space>
                        </List.Item>
                    );
                }}
            />
        </Card>
    );
}