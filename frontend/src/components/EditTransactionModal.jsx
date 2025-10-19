import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, message } from 'antd';
import api from '../api';
import dayjs from 'dayjs'; // Asegúrate de tener 'dayjs' instalado

const { Option } = Select;

export default function EditTransactionModal({ open, onCancel, onUpdate, transaction }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Tipo de transacción (para saber si mostrar la categoría)
    const transactionType = transaction?.transaction_type || 'IN';

    // Rellena el formulario cuando la transacción seleccionada cambia
    useEffect(() => {
        if (open && transaction) {
            form.setFieldsValue({
                ...transaction,
                date: dayjs(transaction.date), // Convierte la fecha a objeto dayjs
                amount: parseFloat(transaction.amount),
            });
        }
    }, [open, transaction, form]);

    const handleSubmit = async (values) => {
        if (!transaction) return;
        setLoading(true);

        try {
            // Prepara los datos para la API
            const data = {
                ...values,
                date: values.date.format('YYYY-MM-DD'), // Convierte la fecha a string
                transaction_type: transactionType,
            };

            await api.updateTransaction(transaction.id, data);
            message.success('¡Registro actualizado!');
            onUpdate(); // Llama a la función del Dashboard para cerrar y recargar
        } catch (err) {
            message.error('Error al actualizar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Editar Transacción"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="back" onClick={onCancel}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                    Guardar Cambios
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                        prefix="S/ "
                    />
                </Form.Item>

                {/* Solo muestra categoría si es un Gasto */}
                {transactionType === 'OUT' && (
                    <Form.Item
                        name="category"
                        label="Categoría"
                        rules={[{ required: true, message: 'Selecciona una categoría' }]}
                    >
                        <Select>
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
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}