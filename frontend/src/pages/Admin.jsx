import React, { useEffect, useState } from 'react';
import {
    Layout, Row, Col, Card, Spin, Table, Tag, Button, Space,
    message, Input, Dropdown, Menu, Statistic // ¡Añadimos Statistic!
} from 'antd';
import { useAuth } from '../auth/AuthContext';
import HeaderBar from '../components/HeaderBar';
import api from '../api';
import { EllipsisOutlined } from '@ant-design/icons'; // Importa el ícono

const { Content } = Layout;
const { Search } = Input;

// Columnas para la tabla de usuarios
// Esta función ahora genera el Dropdown para las acciones
const getColumns = (handleAction, currentUser) => [
    {
        title: 'Usuario',
        dataIndex: 'username',
        key: 'username',
        fixed: 'left',
        width: 150
    },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Nombre', dataIndex: 'name', key: 'name', width: 150 },
    {
        title: 'Plan',
        dataIndex: 'subscription',
        key: 'subscription',
        width: 100,
        render: (plan) => (
            <Tag color={plan === 'PREMIUM' ? 'green' : 'default'}>{plan}</Tag>
        )
    },
    {
        title: 'Rol',
        dataIndex: 'role',
        key: 'role',
        width: 100,
        render: (role) => (
            <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
        )
    },
    {
        title: 'Activo',
        dataIndex: 'is_active',
        key: 'is_active',
        width: 80,
        render: (active) => (active ? '✅' : '⛔')
    },
    { title: 'Registros', dataIndex: 'record_count', key: 'record_count', width: 100 },
    {
        title: 'Acciones',
        key: 'actions',
        fixed: 'right',
        width: 100,
        render: (_, record) => {
            // Deshabilitamos acciones sobre uno mismo o sobre el superusuario ID 1
            const isDisabled = record.id === 1 || record.id === currentUser.id;

            const menu = (
                <Menu onClick={({ key }) => handleAction(key, record.id)}>
                    <Menu.Item key="plan-premium">Hacer Premium</Menu.Item>
                    <Menu.Item key="plan-free">Hacer Free</Menu.Item>
                    <Menu.Divider />
                    {record.is_active ? (
                        <Menu.Item key="deactivate" danger>Desactivar Usuario</Menu.Item>
                    ) : (
                        <Menu.Item key="activate">Activar Usuario</Menu.Item>
                    )}
                    <Menu.Divider />
                    <Menu.Item key="role-admin" disabled={record.role === 'ADMIN'}>Dar Rol Admin</Menu.Item>
                    <Menu.Item key="role-user" disabled={record.role === 'USER'}>Dar Rol User</Menu.Item>
                </Menu>
            );

            return (
                <Dropdown overlay={menu} trigger={['click']} disabled={isDisabled}>
                    <Button icon={<EllipsisOutlined />} />
                </Dropdown>
            );
        },
    },
];


export default function Admin() {
    const { user } = useAuth(); // Para el saludo y para protección
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (query = '') => {
        setLoading(true);
        try {
            const [statsData, usersData] = await Promise.all([
                api.getAdminStats(),
                api.getAdminUsers(query)
            ]);
            setStats(statsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching admin data", error);
            message.error('No se pudieron cargar los datos de administrador.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (action, id) => {
        try {
            if (action === 'plan-premium') {
                await api.adminSetPlan(id, 'PREMIUM');
            } else if (action === 'plan-free') {
                await api.adminSetPlan(id, 'FREE');
            } else if (action === 'activate') {
                await api.adminSetActive(id, true);
            } else if (action === 'deactivate') {
                await api.adminSetActive(id, false);
            } else if (action === 'role-admin') {
                await api.adminSetRole(id, 'ADMIN');
            } else if (action === 'role-user') {
                await api.adminSetRole(id, 'USER');
            }

            message.success('Acción completada');
            fetchData(); // Recargar datos de usuarios y estadísticas
        } catch (err) {
            message.error('Error al ejecutar la acción');
        }
    };

    const onSearch = (value) => {
        fetchData(value); // Llama a fetchData con el término de búsqueda
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Pasamos 'onProfileClick' nulo para deshabilitar el botón en Admin */}
            <HeaderBar profile={{ name: user?.username }} onProfileClick={null} />

            <Content style={{ padding: '24px' }}>
                <Spin spinning={loading}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>

                        {/* --- ¡TARJETAS DE ESTADÍSTICA PULIDAS! --- */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false}>
                                    <Statistic title="Usuarios Totales" value={stats.total || 0} />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false}>
                                    <Statistic title="Premium" value={stats.premium || 0} valueStyle={{ color: '#3f8600' }} />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false}>
                                    <Statistic title="Free" value={stats.free || 0} />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false}>
                                    <Statistic title="Activos (Premium)" value={stats.active || 0} valueStyle={{ color: '#1677ff' }} />
                                </Card>
                            </Col>
                        </Row>

                        {/* Tabla de Usuarios */}
                        <Card title="Gestión de Usuarios" bordered={false}>
                            <Search
                                placeholder="Buscar por usuario, email o nombre"
                                onSearch={onSearch}
                                enterButton
                                style={{ marginBottom: 16 }}
                            />
                            <Table
                                columns={getColumns(handleAction, user)} // Pasamos el usuario actual
                                dataSource={users}
                                rowKey="id"
                                scroll={{ x: 1000 }} // Habilita scroll horizontal
                            />
                        </Card>
                    </Space>
                </Spin>
            </Content>
        </Layout>
    );
}