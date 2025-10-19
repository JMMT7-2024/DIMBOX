import React, { useState } from 'react';
import { Card, Tabs, Form, Input, InputNumber, DatePicker, Select, Button, message, Space } from 'antd';
import api from '../api';
import dayjs from 'dayjs'; // Necesitarás 'dayjs' para manejar fechas

// --- ¡¡IMPORTANTE!! ---
// Si no lo has hecho, corre este comando en tu terminal:
// npm install dayjs
// --------------------

const { TabPane } = Tabs;
const { Option } = Select;

// Componente de formulario separado para poder resetearlo
const RegistroForm = ({ type, onFinish }) => {
    const [form] = Form.useForm(); // Hook para controlar el formulario

    const handleSubmit = (values) => {
        const data = { ...values, transaction_type: type };

        // Convertimos la fecha de dayjs a string 'YYYY-MM-DD'
        data.date = data.date.format('YYYY-MM-DD');

        onFinish(data, form);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ date: dayjs() }} // Pone la fecha de hoy por defecto
        >
            <Form.Item
                name="date"
                label="Fecha"
                rules={[{ required: true, message: 'Selecciona una fecha' }]}
            >
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="amount"
                label="Monto"
                rules={[{ required: true, message: 'Ingresa un monto' }]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    placeholder="Ej: 1200.00"
                    prefix="S/ "
                />
            </Form.Item>

            {/* Este campo solo aparece si es un Gasto */}
            {type === 'OUT' && (
                <Form.Item
                    name="category"
                    label="Categoría"
                    rules={[{ required: true, message: 'Selecciona una categoría' }]}
                >
                    <Select placeholder="Selecciona una categoría">
                        <Option value="AL">Alimentación</Option>
                        <Option value="TR">Transporte</Option>
                        <Option value="SE">Servicios</Option>
                        <Option value="VI">Vivienda</Option>
                        <Option value="OC">Ocio</Option>
                        <Option value="SA">Salud</Option>
                        <Option value="ED">Educación</Option>
                        <Option value="OT">Otros</Option>
                    </Select>
                </Form.Item>
            )}

            <Form.Item
                name="description"
                label="Descripción (opcional)"
            >
                <Input placeholder={type === 'IN' ? "Ej: Sueldo del mes" : "Ej: Café con amigos"} />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" block>
                    {type === 'IN' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                </Button>
            </Form.Item>
        </Form>
    );
};


// Componente principal que exportamos
export default function TransactionForm({ onNewTransaction }) {
    const [loading, setLoading] = useState(false);

    const handleFinish = async (data, formInstance) => {
        setLoading(true);
        try {
            await api.createTransaction(data);
            message.success('¡Registro guardado!');
            formInstance.resetFields(); // Limpia el formulario
            formInstance.setFieldsValue({ date: dayjs() }); // Pone la fecha de hoy de nuevo
            onNewTransaction(); // Avisa al Dashboard que recargue los datos
        } catch (err) {
            console.error(err);
            // El interceptor de API (en api.js) ya debería manejar el 401
            if (err.response?.status !== 401) {
                message.error('No se pudo registrar. Verifica los datos.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card loading={loading}>
            <Tabs defaultActiveKey="1" centered>
                <TabPane tab="Ingresos" key="1">
                    <RegistroForm type="IN" onFinish={handleFinish} />
                </TabPane>
                <TabPane tab="Gastos" key="2">
                    <RegistroForm type="OUT" onFinish={handleFinish} />
                </TabPane>
            </Tabs>
        </Card>
    );
}