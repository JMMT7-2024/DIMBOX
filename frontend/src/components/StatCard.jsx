// src/components/StatCard.jsx
import React from 'react';
import { Card } from 'antd';

export default function StatCard({ title, value, sub }) {
    return (
        <Card size="small" style={{ background: 'var(--card)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{value}</div>
            {sub && <div className="muted" style={{ marginTop: 4 }}>{sub}</div>}
        </Card>
    );
}
