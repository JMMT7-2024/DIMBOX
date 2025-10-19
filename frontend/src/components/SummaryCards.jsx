import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SwapOutlined } from '@ant-design/icons';

export default function SummaryCards({ transactions = [] }) {

    const sumIng = transactions
        .filter(t => t.transaction_type === 'IN')
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    const sumGas = transactions
        .filter(t => t.transaction_type === 'OUT')
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    const balance = sumIng - sumGas;

    return (
        <Card title="Resumen del Mes">
            <Row gutter={16}>
                <Col span={8}>
                    <Statistic
                        title="Ingresos"
                        value={sumIng}
                        precision={2}
                        prefix={<ArrowUpOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Col>
                <Col span={8}>
                    <Statistic
                        title="Gastos"
                        value={sumGas}
                        precision={2}
                        prefix={<ArrowDownOutlined />}
                        valueStyle={{ color: '#cf1322' }}
                    />
                </Col>
                <Col span={8}>
                    <Statistic
                        title="Balance"
                        value={balance}
                        precision={2}
                        prefix={<SwapOutlined />}
                        valueStyle={{ color: '#1677ff' }}
                    />
                </Col>
            </Row>
        </Card>
    );
}