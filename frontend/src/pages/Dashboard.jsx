import React from 'react';
import {
    Box,
    Container,
    Stack,
    Grid,
    GridItem,
    Button,
    Icon,
    Flex,
    Spinner,
    Center,
    Text,
    useToast,
    useBreakpointValue,
} from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';

import api from '../api';

import HeaderBar from '../components/HeaderBar';
import GoalCard from '../components/GoalCard';
import SummaryCards from '../components/SummaryCards';
import TransactionForm from '../components/TransactionForm';
import HistoryList from '../components/HistoryList';
import CategoryChart from '../components/CategoryChart';
import ProfileModal from '../components/ProfileModal';
import EditTransactionModal from '../components/EditTransactionModal';

export default function Dashboard() {
    const toast = useToast();

    // flags para no duplicar botones
    const showHeaderEdit = useBreakpointValue({ base: true, md: false });
    const showGoalConfigure = useBreakpointValue({ base: false, md: true });

    const [period, setPeriod] = React.useState('Este mes');

    const [transactions, setTransactions] = React.useState([]);
    const [profile, setProfile] = React.useState({});

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const [isProfileModalOpen, setProfileModalOpen] = React.useState(false);
    const [isEditModalOpen, setEditModalOpen] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState(null);

    const fetchData = async () => {
        setError('');
        setLoading(true);
        try {
            const [p, t] = await Promise.all([api.getProfile(), api.getTransactions()]);
            setProfile(p || {});
            setTransactions(Array.isArray(t) ? t : []);
        } catch (e) {
            console.error('Error fetching data', e);
            setError('No se pudo cargar tus datos. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleNewTransaction = () => fetchData();

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de borrar este registro?')) return;
        try {
            await api.deleteTransaction(id);
            toast({ title: 'Registro eliminado', status: 'success' });
            fetchData();
        } catch (e) {
            console.error('Error borrando', e);
            toast({ title: 'Error al borrar el registro', status: 'error' });
        }
    };

    const handleEdit = (tx) => {
        setSelectedTransaction(tx);
        setEditModalOpen(true);
    };

    const handleTransactionUpdate = () => {
        setEditModalOpen(false);
        setSelectedTransaction(null);
        fetchData();
    };

    const handleProfileUpdate = () => {
        setProfileModalOpen(false);
        fetchData();
    };

    const handleExport = async () => {
        const id = 'export-toast';
        toast({ id, title: 'Generando tu reporte…', status: 'loading', duration: 2000, isClosable: true });
        try {
            const response = await api.exportCsv();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'mis_movimientos.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.update(id, { title: '¡Reporte descargado!', status: 'success', duration: 1500 });
        } catch {
            toast.update(id, { title: 'Error al generar el reporte', status: 'error', duration: 2500 });
        }
    };

    if (loading) {
        return (
            <Center minH="70vh" bg="var(--background)">
                <Stack align="center" spacing={3}>
                    <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="green.500" size="xl" />
                    <Text color="gray.500" fontSize="sm">Cargando…</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Center minH="70vh" bg="var(--background)">
                <Stack align="center" spacing={4}>
                    <Text color="red.500" fontWeight="semibold">{error}</Text>
                    <Button onClick={fetchData} colorScheme="green">Reintentar</Button>
                </Stack>
            </Center>
        );
    }

    return (
        <Box bg="var(--background)" minH="100vh">
            <HeaderBar
                profile={profile}
                period={period}
                onChangePeriod={setPeriod}
                onProfileClick={() => setProfileModalOpen(true)}
                showEditButton={showHeaderEdit}
            />

            <Container maxW="container.xl" py={6}>
                <Stack spacing={6}>
                    <GoalCard
                        profile={profile}
                        transactions={transactions}
                        period={period}
                        onConfigure={() => setProfileModalOpen(true)}
                        showConfigure={showGoalConfigure}
                    />

                    <SummaryCards transactions={transactions} period={period} />

                    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                        <GridItem>
                            <TransactionForm onNewTransaction={handleNewTransaction} />
                        </GridItem>
                        <GridItem>
                            <CategoryChart transactions={transactions} period={period} />
                        </GridItem>
                    </Grid>

                    <HistoryList
                        transactions={transactions}
                        handleDelete={handleDelete}
                        handleEdit={handleEdit}
                    />

                    <Box
                        border="1px solid var(--line)"
                        bg="var(--card)"
                        borderRadius="16px"
                        p={4}
                        boxShadow="var(--shadow-light)"
                    >
                        <Button leftIcon={<Icon as={FiDownload} />} onClick={handleExport} colorScheme="green">
                            Exportar todo a CSV
                        </Button>
                    </Box>
                </Stack>
            </Container>

            <ProfileModal
                open={isProfileModalOpen}
                isOpen={isProfileModalOpen}
                onCancel={() => setProfileModalOpen(false)}
                onClose={() => setProfileModalOpen(false)}
                onUpdate={handleProfileUpdate}
                profile={profile}
            />

            <EditTransactionModal
                open={isEditModalOpen}
                isOpen={isEditModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onClose={() => setEditModalOpen(false)}
                onUpdate={handleTransactionUpdate}
                transaction={selectedTransaction}
            />
        </Box>
    );
}
