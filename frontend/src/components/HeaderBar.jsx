import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Layout, Button, Typography, Space, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

// --- ¡LA CLAVE ESTÁ AQUÍ! ---
// Añadimos 'onProfileClick' a la lista de props que recibe el componente.
export default function HeaderBar({ profile, onProfileClick }) {
    const { logout, user } = useAuth();
    const greeting = profile.name || user?.username || 'Usuario';
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    return (
        <Header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            position: 'sticky', // Opcional: fija el header arriba
            top: 0,
            zIndex: 10,
        }}>
            <div>
                <Text strong style={{ fontSize: '20px' }}>Hola, {greeting} 👋</Text>
            </div>
            <Space size="middle">
                {isAdmin && (
                    <Link to="/admin">
                        <Button>Panel Admin</Button>
                    </Link>
                )}

                {/* --- ¡Y AQUÍ! ---
                // Conectamos el 'onClick' del botón a la prop 'onProfileClick'.
                */}
                <Button icon={<UserOutlined />} onClick={onProfileClick}>
                    Editar Perfil
                </Button>

                <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={logout}
                >
                    Salir
                </Button>
            </Space>
        </Header>
    );
}