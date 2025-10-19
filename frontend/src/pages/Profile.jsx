// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, message } from 'antd';
import { profileGet, profilePatch } from '../api';
import { getAccess } from '../auth';

export default function Profile() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                const data = await profileGet(getAccess());
                form.setFieldsValue({
                    full_name: data.full_name,
                    email: data.email,
                    active: !!data.active
                });
            } finally { setLoading(false); }
        };
        run();
    }, []);

    const onFinish = async (v) => {
        try {
            setSaving(true);
            await profilePatch(getAccess(), v);
            message.success('Perfil actualizado');
        } catch (e) {
            message.error('No se pudo actualizar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <Card title="Perfil" loading={loading} style={{ background: 'var(--card)' }}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item label="Nombre completo" name="full_name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ type: 'email', required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Activo" name="active" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>Guardar</Button>
                </Form>
            </Card>
        </div>
    );
}
