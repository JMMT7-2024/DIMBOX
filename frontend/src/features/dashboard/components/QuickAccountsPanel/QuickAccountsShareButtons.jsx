// src/components/dashboard/QuickAccountsPanel/QuickAccountsShareButtons.jsx - VERSIÓN MEJORADA
import React, { useCallback, useMemo } from 'react';
import {
    HStack,
    IconButton,
    Tooltip,
    useToast,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuGroup,
    Text,
    Badge,
    useBreakpointValue
} from '@chakra-ui/react';
import {
    FiImage,
    FiCopy,
    FiShare2,
    FiMoreVertical,
    FiMessageSquare,
    FiMail,
    FiFileText,
    FiCheck,
    FiDownload
} from 'react-icons/fi';

const QuickAccountsShareButtons = ({
    accountsData = [],
    userName = "Usuario",
    isPremium = false,
    size = "sm",
    variant = "outline",
    onShareComplete
}) => {
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, md: false });

    // ✅ CALCULAR ESTADÍSTICAS PARA COMPARTIR
    const shareStats = useMemo(() => {
        if (!accountsData || accountsData.length === 0) {
            return null;
        }

        const totalBalance = accountsData.reduce((sum, account) =>
            sum + (Number(account.total_amount) || 0), 0
        );

        const totalPending = accountsData.reduce((sum, account) =>
            sum + (Number(account.balance) || 0), 0
        );

        const activeAccounts = accountsData.filter(account =>
            account.status === 'active' || (account.balance > 0 && account.balance < account.total_amount)
        ).length;

        const completedAccounts = accountsData.filter(account =>
            account.status === 'completed' || account.balance === 0
        ).length;

        const progress = totalBalance > 0 ? ((totalBalance - totalPending) / totalBalance * 100) : 0;

        return {
            totalBalance,
            totalPending,
            activeAccounts,
            completedAccounts,
            progress: Math.round(progress),
            totalAccounts: accountsData.length
        };
    }, [accountsData]);

    // ✅ GENERAR TEXTO DE RESUMEN
    const generateSummaryText = useCallback((format = 'default') => {
        if (!shareStats) return '';

        const baseText = `💰 RESUMEN DE CUENTAS RÁPIDAS - ${userName}

📊 Total Cuentas: ${shareStats.totalAccounts}
✅ Activas: ${shareStats.activeAccounts}
🎯 Completadas: ${shareStats.completedAccounts}
💰 Monto Total: S/ ${shareStats.totalBalance.toFixed(2)}
📉 Pendiente: S/ ${shareStats.totalPending.toFixed(2)}
📈 Progreso: ${shareStats.progress}%

--- FinanzApp ---`;

        const detailedText = `💰 RESUMEN DETALLADO - ${userName}

📊 ESTADÍSTICAS:
• Total de Cuentas: ${shareStats.totalAccounts}
• Cuentas Activas: ${shareStats.activeAccounts}
• Cuentas Completadas: ${shareStats.completedAccounts}

💸 FINANZAS:
• Monto Total: S/ ${shareStats.totalBalance.toFixed(2)}
• Saldo Pendiente: S/ ${shareStats.totalPending.toFixed(2)}
• Progreso General: ${shareStats.progress}%

${accountsData.map((account, index) =>
            `📋 ${index + 1}. ${account.title || 'Cuenta'} - S/ ${(account.total_amount || 0).toFixed(2)} (${account.status || 'activa'})`
        ).join('\n')}

--- Generado con FinanzApp 📱 ---`;

        return format === 'detailed' ? detailedText : baseText;
    }, [shareStats, userName, accountsData]);

    // ✅ GENERAR MENSAJE WHATSAPP
    const generateWhatsAppMessage = useCallback(() => {
        if (!shareStats) return '';

        return `Hola! 👋 Te comparto mi resumen de cuentas rápidas de FinanzApp:

💰 *Resumen Financiero*
• Total Recaudado: S/ ${shareStats.totalBalance.toFixed(2)}
• Pendiente: S/ ${shareStats.totalPending.toFixed(2)}
• Progreso: ${shareStats.progress}%

📊 *Estadísticas*
• Cuentas: ${shareStats.totalAccounts}
• Activas: ${shareStats.activeAccounts}
• Completadas: ${shareStats.completedAccounts}

¡Todo bajo control! 💪

--- Gestionado con FinanzApp 📱 ---`;
    }, [shareStats]);

    // ✅ MANEJAR COMPARTIR COMO IMAGEN
    const handleShareAsImage = useCallback(async () => {
        if (!isPremium) {
            toast({
                title: "Función Premium Requerida",
                description: "Actualiza a Premium para compartir como imagen",
                status: "warning",
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        if (!shareStats) {
            toast({
                title: "Sin datos",
                description: "No hay cuentas para generar imagen",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        try {
            const toastId = toast({
                title: "🖼️ Generando imagen...",
                description: "Preparando resumen visual",
                status: "info",
                duration: null,
                isClosable: true,
            });

            // Simular generación de imagen (en una implementación real, usar html2canvas o similar)
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.close(toastId);

            toast({
                title: "✅ Imagen generada",
                description: "La imagen se ha guardado en tu galería",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            onShareComplete?.('image');
        } catch (error) {
            console.error("Error al generar imagen:", error);
            toast({
                title: "❌ Error",
                description: "No se pudo generar la imagen. Intenta nuevamente.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    }, [isPremium, shareStats, toast, onShareComplete]);

    // ✅ MANEJAR COPIAR RESUMEN
    const handleCopySummary = useCallback(async (format = 'default') => {
        try {
            if (!shareStats) {
                toast({
                    title: "Sin datos",
                    description: "No hay cuentas para copiar",
                    status: "warning",
                    duration: 2000,
                });
                return;
            }

            const textToCopy = generateSummaryText(format);
            await navigator.clipboard.writeText(textToCopy);

            toast({
                title: "✅ ¡Copiado!",
                description: format === 'detailed' ? "Resumen detallado copiado" : "Resumen copiado al portapapeles",
                status: "success",
                duration: 2000,
                isClosable: true,
            });

            onShareComplete?.('copy', { format });
        } catch (error) {
            console.error("Error al copiar:", error);
            toast({
                title: "❌ Error",
                description: "No se pudo copiar el resumen",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    }, [shareStats, generateSummaryText, toast, onShareComplete]);

    // ✅ MANEJAR COMPARTIR WHATSAPP
    const handleShareWhatsApp = useCallback(() => {
        if (!isPremium) {
            toast({
                title: "Función Premium",
                description: "Actualiza a Premium para compartir por WhatsApp",
                status: "info",
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        if (!shareStats) {
            toast({
                title: "Sin datos",
                description: "No hay cuentas para compartir",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        try {
            const message = generateWhatsAppMessage();
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

            onShareComplete?.('whatsapp');
        } catch (error) {
            console.error("Error al compartir por WhatsApp:", error);
            toast({
                title: "❌ Error",
                description: "No se pudo abrir WhatsApp",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    }, [isPremium, shareStats, generateWhatsAppMessage, toast, onShareComplete]);

    // ✅ MANEJAR EXPORTAR COMO TEXTO
    const handleExportText = useCallback(() => {
        if (!shareStats) {
            toast({
                title: "Sin datos",
                description: "No hay cuentas para exportar",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        try {
            const textContent = generateSummaryText('detailed');
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `resumen-cuentas-${userName}-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "📥 Exportado",
                description: "Archivo de texto descargado",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            onShareComplete?.('export');
        } catch (error) {
            console.error("Error al exportar:", error);
            toast({
                title: "❌ Error",
                description: "No se pudo exportar el archivo",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    }, [shareStats, generateSummaryText, userName, toast, onShareComplete]);

    // ✅ VERIFICAR SI HAY DATOS
    const hasData = shareStats && accountsData.length > 0;

    // ✅ RENDERIZAR BOTONES PRINCIPALES
    const renderMainButtons = () => (
        <HStack spacing={1}>
            {/* Compartir como imagen */}
            <Tooltip
                label={
                    !isPremium
                        ? "Actualiza a Premium para compartir como imagen"
                        : "Compartir como imagen (Premium)"
                }
            >
                <IconButton
                    icon={<FiImage />}
                    onClick={handleShareAsImage}
                    variant={variant}
                    size={size}
                    colorScheme="purple"
                    aria-label="Compartir como imagen"
                    isDisabled={!hasData || !isPremium}
                />
            </Tooltip>

            {/* Copiar resumen */}
            <Tooltip label="Copiar resumen al portapapeles">
                <IconButton
                    icon={<FiCopy />}
                    onClick={() => handleCopySummary('default')}
                    variant={variant}
                    size={size}
                    colorScheme="blue"
                    aria-label="Copiar resumen"
                    isDisabled={!hasData}
                />
            </Tooltip>

            {/* Compartir por WhatsApp */}
            <Tooltip
                label={
                    !isPremium
                        ? "Actualiza a Premium para compartir por WhatsApp"
                        : "Compartir por WhatsApp (Premium)"
                }
            >
                <IconButton
                    icon={<FiShare2 />}
                    onClick={handleShareWhatsApp}
                    variant={variant}
                    size={size}
                    colorScheme="green"
                    aria-label="Compartir por WhatsApp"
                    isDisabled={!hasData || !isPremium}
                />
            </Tooltip>
        </HStack>
    );

    // ✅ RENDERIZAR MENÚ DE OPCIONES AVANZADAS
    const renderAdvancedMenu = () => (
        <Menu placement="bottom-end">
            <Tooltip label="Más opciones de compartir">
                <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant={variant}
                    size={size}
                    aria-label="Más opciones de compartir"
                    isDisabled={!hasData}
                />
            </Tooltip>

            <MenuList minW="200px" zIndex={9999}>
                <MenuGroup title="Opciones de Compartir">
                    <MenuItem
                        icon={<FiCopy />}
                        onClick={() => handleCopySummary('detailed')}
                        isDisabled={!hasData}
                    >
                        Copiar resumen detallado
                    </MenuItem>

                    <MenuItem
                        icon={<FiMessageSquare />}
                        onClick={handleShareWhatsApp}
                        isDisabled={!hasData || !isPremium}
                    >
                        <HStack justify="space-between" width="100%">
                            <Text>Compartir por WhatsApp</Text>
                            {!isPremium && <Badge colorScheme="purple" fontSize="2xs">Premium</Badge>}
                        </HStack>
                    </MenuItem>

                    <MenuItem
                        icon={<FiImage />}
                        onClick={handleShareAsImage}
                        isDisabled={!hasData || !isPremium}
                    >
                        <HStack justify="space-between" width="100%">
                            <Text>Generar imagen</Text>
                            {!isPremium && <Badge colorScheme="purple" fontSize="2xs">Premium</Badge>}
                        </HStack>
                    </MenuItem>
                </MenuGroup>

                <MenuGroup title="Exportar">
                    <MenuItem
                        icon={<FiDownload />}
                        onClick={handleExportText}
                        isDisabled={!hasData}
                    >
                        Descargar como texto
                    </MenuItem>
                </MenuGroup>
            </MenuList>
        </Menu>
    );

    // ✅ RENDERIZAR VISTA MÓVIL (solo menú)
    if (isMobile) {
        return renderAdvancedMenu();
    }

    // ✅ RENDERIZAR VISTA DESKTOP (botones + menú)
    return (
        <HStack spacing={1}>
            {renderMainButtons()}
            {renderAdvancedMenu()}
        </HStack>
    );
};

// ✅ PROPS POR DEFECTO MEJORADOS
QuickAccountsShareButtons.defaultProps = {
    accountsData: [],
    userName: "Usuario",
    isPremium: false,
    size: "sm",
    variant: "outline",
    onShareComplete: (method, metadata) => console.log(`Compartido via ${method}`, metadata)
};

export default QuickAccountsShareButtons;