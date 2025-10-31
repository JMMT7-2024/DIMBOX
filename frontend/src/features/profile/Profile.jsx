// src/features/profile/Profile.jsx - VERSIÓN MEJORADA
import React, { useState, useCallback, useMemo } from 'react';
import {
    Box, Container, VStack, HStack, Text, Avatar, Card, CardBody,
    Button, Input, FormControl, FormLabel, FormHelperText,
    useToast, useColorModeValue, Badge, Divider,
    Grid, GridItem, Progress, Stat, StatLabel, StatNumber,
    StatHelpText, StatArrow, IconButton, Tooltip, Alert, AlertIcon,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, useDisclosure, Switch,
    Tabs, TabList, TabPanels, Tab, TabPanel, Spinner
} from '@chakra-ui/react';
import {
    FiUser, FiMail, FiCalendar, FiEdit, FiSave, FiX,
    FiLock, FiBell, FiShield, FiDollarSign, FiTrendingUp,
    FiCreditCard, FiStar, FiDownload, FiTrash2, FiEye,
    FiEyeOff, FiCheck, FiAlertTriangle
} from 'react-icons/fi';
import { useAuth } from '../../auth/AuthContext';

const Profile = () => {
    const { user, updateProfile, logout, isPremium } = useAuth();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        currency: 'PEN',
        language: 'es',
        notifications: true,
        biometrics: false
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    // ✅ ESTILOS Y TEMAS
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const accentColor = useColorModeValue('green.500', 'green.300');
    const mutedColor = useColorModeValue('gray.600', 'gray.400');

    // ✅ ESTADÍSTICAS DEL USUARIO (datos de ejemplo)
    const userStats = useMemo(() => ({
        totalTransactions: 147,
        monthlyAverage: 3250,
        savingsRate: 25,
        categoriesUsed: 12,
        accountAge: '3 meses',
        successRate: 89
    }), []);

    // ✅ MANEJADORES DE FORMULARIO
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handlePasswordChange = useCallback((field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleSaveProfile = useCallback(async () => {
        if (!formData.displayName.trim()) {
            toast({
                title: 'Nombre requerido',
                description: 'El nombre no puede estar vacío',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsLoading(true);
        try {
            await updateProfile({
                displayName: formData.displayName,
                phone: formData.phone
            });

            toast({
                title: '✅ Perfil actualizado',
                description: 'Tus datos se han guardado correctamente',
                status: 'success',
                duration: 3000,
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            toast({
                title: '❌ Error',
                description: 'No se pudo actualizar el perfil',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, updateProfile, toast]);

    const handlePasswordUpdate = useCallback(async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Contraseñas no coinciden',
                description: 'Las contraseñas deben ser iguales',
                status: 'error',
                duration: 3000,
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast({
                title: 'Contraseña muy corta',
                description: 'La contraseña debe tener al menos 6 caracteres',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsLoading(true);
        try {
            // Aquí iría la lógica para actualizar la contraseña
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast({
                title: '✅ Contraseña actualizada',
                description: 'Tu contraseña se ha cambiado correctamente',
                status: 'success',
                duration: 3000,
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast({
                title: '❌ Error',
                description: 'No se pudo cambiar la contraseña',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [passwordData, toast]);

    const handleExportData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Simular exportación de datos
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast({
                title: '📥 Datos exportados',
                description: 'Tu información se ha descargado correctamente',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: '❌ Error en exportación',
                description: 'No se pudieron exportar tus datos',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleDeleteAccount = useCallback(async () => {
        setIsLoading(true);
        try {
            // Aquí iría la lógica para eliminar la cuenta
            await new Promise(resolve => setTimeout(resolve, 2000));
            await logout();
            toast({
                title: '👋 Cuenta eliminada',
                description: 'Tu cuenta ha sido eliminada correctamente',
                status: 'info',
                duration: 4000,
            });
        } catch (error) {
            toast({
                title: '❌ Error',
                description: 'No se pudo eliminar la cuenta',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
            onDeleteClose();
        }
    }, [logout, toast, onDeleteClose]);

    // ✅ COMPONENTES DE INTERFAZ
    const UserAvatarSection = () => (
        <VStack spacing={4} align="center" py={6}>
            <Avatar
                size="2xl"
                name={user?.displayName || 'Usuario'}
                src={user?.photoURL}
                bg={accentColor}
                color="white"
                border="4px solid"
                borderColor={accentColor}
            />
            <VStack spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                    {user?.displayName || 'Usuario'}
                </Text>
                <Text color={mutedColor} textAlign="center">
                    {user?.email}
                </Text>
                <HStack spacing={2}>
                    <Badge
                        colorScheme={isPremium ? "purple" : "gray"}
                        fontSize="sm"
                        px={3}
                        py={1}
                    >
                        <HStack spacing={1}>
                            <FiStar size={14} />
                            <Text>{isPremium ? "PREMIUM" : "GRATIS"}</Text>
                        </HStack>
                    </Badge>
                    <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                        ✅ Verificado
                    </Badge>
                </HStack>
            </VStack>
        </VStack>
    );

    const StatsOverview = () => (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={6}>
            <StatCard
                label="Transacciones Totales"
                value={userStats.totalTransactions}
                helpText="Desde el registro"
                icon={FiTrendingUp}
                colorScheme="blue"
            />
            <StatCard
                label="Tasa de Ahorro"
                value={`${userStats.savingsRate}%`}
                helpText="Este mes"
                icon={FiDollarSign}
                colorScheme="green"
            />
            <StatCard
                label="Éxito Financiero"
                value={`${userStats.successRate}%`}
                helpText="Metas cumplidas"
                icon={FiCheck}
                colorScheme="purple"
            />
        </Grid>
    );

    const StatCard = ({ label, value, helpText, icon: Icon, colorScheme = 'blue' }) => (
        <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
            <CardBody>
                <Stat>
                    <HStack justify="space-between" align="flex-start">
                        <Box>
                            <StatLabel color={mutedColor} fontSize="sm">
                                {label}
                            </StatLabel>
                            <StatNumber fontSize="2xl" fontWeight="bold" color={`${colorScheme}.600`}>
                                {value}
                            </StatNumber>
                            <StatHelpText fontSize="xs">
                                {helpText}
                            </StatHelpText>
                        </Box>
                        <Box
                            p={2}
                            borderRadius="md"
                            bg={`${colorScheme}.100`}
                            color={`${colorScheme}.600`}
                        >
                            <Icon size={20} />
                        </Box>
                    </HStack>
                </Stat>
            </CardBody>
        </Card>
    );

    const ProfileForm = () => (
        <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="md">
            <CardBody>
                <VStack spacing={6} align="stretch">
                    <HStack justify="space-between" align="center">
                        <Text fontSize="xl" fontWeight="bold">
                            Información Personal
                        </Text>
                        {!isEditing ? (
                            <Button
                                leftIcon={<FiEdit />}
                                onClick={() => setIsEditing(true)}
                                colorScheme="blue"
                                size="sm"
                            >
                                Editar
                            </Button>
                        ) : (
                            <HStack spacing={2}>
                                <Button
                                    leftIcon={<FiSave />}
                                    onClick={handleSaveProfile}
                                    colorScheme="green"
                                    size="sm"
                                    isLoading={isLoading}
                                >
                                    Guardar
                                </Button>
                                <Button
                                    leftIcon={<FiX />}
                                    onClick={() => setIsEditing(false)}
                                    variant="outline"
                                    size="sm"
                                >
                                    Cancelar
                                </Button>
                            </HStack>
                        )}
                    </HStack>

                    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                        <FormControl>
                            <FormLabel>Nombre completo</FormLabel>
                            <Input
                                value={formData.displayName}
                                onChange={(e) => handleInputChange('displayName', e.target.value)}
                                isDisabled={!isEditing}
                                placeholder="Tu nombre completo"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Correo electrónico</FormLabel>
                            <Input
                                value={formData.email}
                                isDisabled
                                type="email"
                                placeholder="tu@email.com"
                            />
                            <FormHelperText>El email no se puede cambiar</FormHelperText>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Teléfono</FormLabel>
                            <Input
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                isDisabled={!isEditing}
                                placeholder="+51 999 999 999"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Moneda preferida</FormLabel>
                            <Input
                                value={formData.currency}
                                isDisabled
                                placeholder="PEN"
                            />
                        </FormControl>
                    </Grid>

                    {isEditing && (
                        <Alert status="info" borderRadius="md" fontSize="sm">
                            <AlertIcon />
                            Los cambios se guardarán automáticamente al hacer clic en "Guardar"
                        </Alert>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );

    const SecuritySection = () => (
        <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="md">
            <CardBody>
                <VStack spacing={6} align="stretch">
                    <Text fontSize="xl" fontWeight="bold">
                        Seguridad y Privacidad
                    </Text>

                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>Contraseña actual</FormLabel>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                placeholder="••••••••"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Nueva contraseña</FormLabel>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                placeholder="••••••••"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Confirmar contraseña</FormLabel>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                placeholder="••••••••"
                            />
                        </FormControl>

                        <HStack justify="space-between">
                            <HStack spacing={2}>
                                <Switch
                                    isChecked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                    size="sm"
                                />
                                <Text fontSize="sm">Mostrar contraseñas</Text>
                            </HStack>

                            <Button
                                leftIcon={<FiLock />}
                                onClick={handlePasswordUpdate}
                                colorScheme="blue"
                                size="sm"
                                isLoading={isLoading}
                                isDisabled={!passwordData.currentPassword || !passwordData.newPassword}
                            >
                                Cambiar Contraseña
                            </Button>
                        </HStack>
                    </VStack>

                    <Divider />

                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">Autenticación biométrica</Text>
                                <Text fontSize="sm" color={mutedColor}>
                                    Usar huella dactilar o rostro
                                </Text>
                            </VStack>
                            <Switch
                                isChecked={formData.biometrics}
                                onChange={(e) => handleInputChange('biometrics', e.target.checked)}
                                colorScheme="green"
                            />
                        </HStack>

                        <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">Notificaciones push</Text>
                                <Text fontSize="sm" color={mutedColor}>
                                    Alertas y recordatorios
                                </Text>
                            </VStack>
                            <Switch
                                isChecked={formData.notifications}
                                onChange={(e) => handleInputChange('notifications', e.target.checked)}
                                colorScheme="green"
                            />
                        </HStack>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );

    const DangerZone = () => (
        <Card bg="red.50" border="1px" borderColor="red.200" shadow="md">
            <CardBody>
                <VStack spacing={4} align="stretch">
                    <Text fontSize="xl" fontWeight="bold" color="red.700">
                        Zona de Peligro
                    </Text>

                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">Exportar mis datos</Text>
                                <Text fontSize="sm" color="red.600">
                                    Descarga toda tu información en formato Excel
                                </Text>
                            </VStack>
                            <Button
                                leftIcon={<FiDownload />}
                                onClick={handleExportData}
                                colorScheme="orange"
                                variant="outline"
                                size="sm"
                                isLoading={isLoading}
                            >
                                Exportar
                            </Button>
                        </HStack>

                        <Divider borderColor="red.200" />

                        <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">Eliminar mi cuenta</Text>
                                <Text fontSize="sm" color="red.600">
                                    Esta acción no se puede deshacer
                                </Text>
                            </VStack>
                            <Button
                                leftIcon={<FiTrash2 />}
                                onClick={onDeleteOpen}
                                colorScheme="red"
                                variant="outline"
                                size="sm"
                            >
                                Eliminar Cuenta
                            </Button>
                        </HStack>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );

    return (
        <Container maxW="6xl" py={8}>
            <VStack spacing={8} align="stretch">
                {/* HEADER DEL PERFIL */}
                <UserAvatarSection />

                {/* ESTADÍSTICAS */}
                <StatsOverview />

                {/* TABS PRINCIPALES */}
                <Tabs colorScheme="green" variant="enclosed">
                    <TabList>
                        <Tab fontWeight="medium">
                            <HStack spacing={2}>
                                <FiUser size={16} />
                                <Text>Información Personal</Text>
                            </HStack>
                        </Tab>
                        <Tab fontWeight="medium">
                            <HStack spacing={2}>
                                <FiShield size={16} />
                                <Text>Seguridad</Text>
                            </HStack>
                        </Tab>
                        <Tab fontWeight="medium">
                            <HStack spacing={2}>
                                <FiBell size={16} />
                                <Text>Preferencias</Text>
                            </HStack>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0} pt={6}>
                            <VStack spacing={6} align="stretch">
                                <ProfileForm />
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0} pt={6}>
                            <VStack spacing={6} align="stretch">
                                <SecuritySection />
                                <DangerZone />
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0} pt={6}>
                            <VStack spacing={6} align="stretch">
                                <Text color={mutedColor} textAlign="center" py={8}>
                                    Configuración de preferencias en desarrollo...
                                </Text>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR CUENTA */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader color="red.600">
                        <HStack spacing={2}>
                            <FiAlertTriangle />
                            <Text>Eliminar Cuenta</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Alert status="error" borderRadius="md">
                                <AlertIcon />
                                Esta acción no se puede deshacer
                            </Alert>
                            <Text>
                                ¿Estás seguro de que quieres eliminar tu cuenta? Se perderán todos tus datos:
                            </Text>
                            <VStack spacing={1} align="start" pl={4}>
                                <Text>• {userStats.totalTransactions} transacciones</Text>
                                <Text>• {userStats.categoriesUsed} categorías personalizadas</Text>
                                <Text>• Tu historial financiero completo</Text>
                            </VStack>
                            <Text fontWeight="medium" color="red.600">
                                Esta acción es permanente.
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <HStack spacing={3}>
                            <Button onClick={onDeleteClose} variant="ghost">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleDeleteAccount}
                                colorScheme="red"
                                isLoading={isLoading}
                                leftIcon={<FiTrash2 />}
                            >
                                Sí, Eliminar Cuenta
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default Profile;