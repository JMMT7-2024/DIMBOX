import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';
import api from '../api';

export default function ProfileModal({ open, onCancel, onUpdate, profile }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false); // Estado de carga

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                name: profile.name || '',
                goal_name: profile.goal_name || '',
                goal_amount: parseFloat(profile.goal_amount) || 0,
            });
        }
    }, [open, profile, form]);

    const handleSubmit = async (values) => {
        // --- ¡¡ESTE ES EL LOG IMPORTANTE!! ---
        console.log("ProfileModal: Enviando valores:", values);
        setLoading(true);
        try {
            await api.updateProfile(values); // Envía los datos
            message.success('¡Perfil actualizado!');
            onUpdate(); // Llama a la función del Dashboard
        } catch (err) {
            console.error("ProfileModal: Error al actualizar", err);
            message.error('Error al actualizar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Tu Perfil y Meta"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="back" onClick={onCancel}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                    Guardar
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="name" label="Tu nombre">
                    <Input placeholder="Ej: Jesús Martin" />
                </Form.Item>
                <Form.Item name="goal_name" label="Nombre de la meta de ahorro">
                    <Input placeholder="Ej: Viaje a Cusco" />
                </Form.Item>
                <Form.Item name="goal_amount" label="Monto meta (S/)">
                    <InputNumber
                        min={0}
                        step={100}
                        style={{ width: '100%' }}
                        formatter={(value) => `S/ ${value}`}
                        // El parser es CLAVE para que AntD entienda el número
                        parser={(value) => (value ? value.replace(/S\/\s?|(,*)/g, '') : '')}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}