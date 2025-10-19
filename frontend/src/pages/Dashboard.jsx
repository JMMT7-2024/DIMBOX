// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import { Layout, Spin, Space, message, Card, Button } from 'antd'; // Importa Card y Button
import { DownloadOutlined } from '@ant-design/icons'; // Importa el ícono

// Importa todos tus componentes
import HeaderBar from '../components/HeaderBar';
import GoalCard from '../components/GoalCard';
import SummaryCards from '../components/SummaryCards';
import TransactionForm from '../components/TransactionForm';
import HistoryList from '../components/HistoryList';
import ProfileModal from '../components/ProfileModal';
import EditTransactionModal from '../components/EditTransactionModal';
import CategoryChart from '../components/CategoryChart'; // Importa el nuevo gráfico

const { Content } = Layout;

export default function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);

    // Estado para los Modales
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Carga todos los datos del backend
    const fetchData = async () => {
        console.log("Dashboard: fetching data..."); // DEBUG
        try {
            const [profileData, transactionsData] = await Promise.all([
                api.getProfile(),
                api.getTransactions()
            ]);
            console.log("Dashboard: Nuevos datos recibidos:", profileData); // DEBUG
            setProfile(profileData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Error fetching data", error);
            message.error('Error al cargar tus datos. Intenta recargar.');
        } finally {
            if (loading) setLoading(false); // Solo quita el spinner la primera vez
        }
    };

    // Carga inicial al montar el componente
    useEffect(() => {
        fetchData();
    }, []);

    // --- MANEJADORES DE ACCIONES ---

    // Se llama cuando TransactionForm crea un nuevo registro
    const handleNewTransaction = () => {
        fetchData(); // Recarga todo
    };

    // Se llama desde HistoryList
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de borrar este registro?')) {
            try {
                await api.deleteTransaction(id);
                message.success('Registro eliminado');
                fetchData(); // Recarga los datos
            } catch (err) {
                console.error("Error borrando", err);
                message.error("Error al borrar el registro.");
            }
        }
    };

    // Se llama desde HistoryList
    const handleEdit = (transaction) => {
        setSelectedTransaction(transaction);
        setEditModalOpen(true);
    };

    // Se llama desde EditTransactionModal
    const handleTransactionUpdate = () => {
        setEditModalOpen(false);
        setSelectedTransaction(null);
        fetchData(); // Solo recarga los datos
    };

    // Se llama desde ProfileModal
    const handleProfileUpdate = () => {
        setProfileModalOpen(false); // Cierra el modal
        fetchData(); // ¡Vuelve a cargar TODO desde el backend!
    };

    // Se llama desde el nuevo botón de Exportar
    const handleExport = async () => {
        message.loading('Generando tu reporte...', 0); // Muestra "cargando" sin tiempo límite
        try {
            const response = await api.exportCsv();
            // Crea un link temporal en memoria para descargar el archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'mis_movimientos.csv'); // Nombre del archivo
            document.body.appendChild(link);
            link.click();
            link.remove(); // Limpia el link temporal
            window.URL.revokeObjectURL(url);

            message.destroy(); // Cierra el mensaje de "cargando"
            message.success('¡Reporte descargado!');
        } catch (err) {
            message.destroy(); // Cierra el mensaje de "cargando"
            message.error('Error al generar el reporte.');
        }
    };

    // Muestra el spinner solo en la carga inicial
    if (loading && transactions.length === 0) {
        return (
            <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <HeaderBar
                profile={profile}
                onProfileClick={() => setProfileModalOpen(true)}
            />

            <Content style={{ padding: '24px' }}>
                {/* Contenedor centrado para el layout vertical */}
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>

                        {/* --- ESTE ES EL ORDEN VERTICAL FINAL --- */}

                        {/* 1. Meta de Ahorro */}
                        <GoalCard profile={profile} transactions={transactions} />

                        {/* 2. Resumen del Mes */}
                        <SummaryCards transactions={transactions} />

                        {/* 3. Ingresos y Gastos (Formulario) */}
                        <TransactionForm onNewTransaction={handleNewTransaction} />

                        {/* 4. Gráfico de Gastos por Categoría */}
                        <CategoryChart transactions={transactions} />

                        {/* 5. Últimos Movimientos (Historial) */}
                        <HistoryList
                            transactions={transactions}
                            handleDelete={handleDelete}
                            handleEdit={handleEdit}
                        />

                        {/* 6. Botón de Exportar */}
                        <Card>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                            >
                                Exportar todo a CSV
                            </Button>
                        </Card>

                    </Space>
                </div>
            </Content>

            {/* --- MODALES --- */}
            <ProfileModal
                open={isProfileModalOpen}
                onCancel={() => setProfileModalOpen(false)}
                onUpdate={handleProfileUpdate}
                profile={profile}
            />

            <EditTransactionModal
                open={isEditModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onUpdate={handleTransactionUpdate}
                transaction={selectedTransaction}
            />
        </Layout>
    );
}