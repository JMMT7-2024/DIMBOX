import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Form, Input, Card, Flex, Typography, Alert, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import './Login.css'; // Sigue usando el mismo CSS
import api from '../api'; // Importamos la API

const { Title } = Typography;

// --- Sub-componente: Formulario de Login ---
const LoginForm = ({ onFinish, loading, error }) => {
    // Quitamos los console.log de depuración
    const onFinishWrapper = (values) => {
        onFinish(values);
    };

    return (
        <Form layout="vertical" onFinish={onFinishWrapper}>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}
            <Form.Item name="username" label="Usuario" rules={[{ required: true, message: '¡Ingresa tu usuario!' }]}>
                <Input prefix={<UserOutlined />} placeholder="Tu nombre de usuario" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: '¡Ingresa tu contraseña!' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Tu contraseña" size="large" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                    Entrar
                </Button>
            </Form.Item>
        </Form>
    );
};

// --- Sub-componente: Formulario de Registro ---
const RegisterForm = ({ onFinish, loading, error }) => (
    <Form layout="vertical" onFinish={onFinish}>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}
        <Form.Item name="name" label="Tu nombre" rules={[{ required: true, message: '¡Ingresa tu nombre!' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="Ej: Jesús Martin" size="large" />
        </Form.Item>
        <Form.Item name="username" label="Nombre de usuario" rules={[{ required: true, message: '¡Crea un usuario!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Ej: jmartin" size="large" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: '¡Ingresa un email válido!' }]}>
            <Input prefix={<MailOutlined />} placeholder="tu@correo.com" size="large" />
        </Form.Item>
        <Form.Item name="password" label="Contraseña" rules={[{ required: true, min: 6, message: '¡Mínimo 6 caracteres!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Crea una contraseña segura" size="large" />
        </Form.Item>
        <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Crear Cuenta
            </Button>
        </Form.Item>
    </Form>
);

// --- Componente Principal de la Página de Login/Registro ---
export default function Login() {
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [activeTab, setActiveTab] = useState('1'); // '1' = Login, '2' = Registro

    const { login } = useAuth();
    const navigate = useNavigate();

    // Handler de Login
    const onLoginFinish = async (values) => {
        setLoginLoading(true);
        setLoginError('');
        try {
            await login(values.username, values.password);
            navigate('/', { replace: true }); // Redirige al Dashboard
        } catch (err) {
            setLoginError('Usuario o contraseña incorrectos.');
        } finally {
            setLoginLoading(false);
        }
    };

    // Handler de Registro
    const onRegisterFinish = async (values) => {
        setRegisterLoading(true);
        setRegisterError('');
        try {
            await api.register(values); // Llama a la nueva función de la API
            message.success('¡Registro exitoso! Ahora puedes iniciar sesión.');
            setActiveTab('1'); // Cambia automáticamente a la pestaña de Login
        } catch (err) {
            // Lee el error específico de tu backend (ej: "username ya existe")
            const errorMsg = err.response?.data?.detail || 'Error al registrar. Inténtalo de nuevo.';
            setRegisterError(errorMsg);
        } finally {
            setRegisterLoading(false);
        }
    };

    const items = [
        {
            key: '1',
            label: 'Iniciar Sesión',
            children: <LoginForm onFinish={onLoginFinish} loading={loginLoading} error={loginError} />,
        },
        {
            key: '2',
            label: 'Registrarse',
            children: <RegisterForm onFinish={onRegisterFinish} loading={registerLoading} error={registerError} />,
        },
    ];

    return (
        <Flex align="center" justify="center" className="login-page">
            <Card className="login-card">
                <Flex vertical align="center" style={{ marginBottom: 24 }}>
                    <LockOutlined style={{ fontSize: '32px', color: '#1677ff' }} />
                    <Title level={2} style={{ margin: '16px 0 0' }}>
                        Control Financiero
                    </Title>
                </Flex>

                <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} centered />

            </Card>
        </Flex>
    );
}