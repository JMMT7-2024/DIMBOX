// src/components/exports/ExcelExporter.jsx
import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { exportTransactionsToExcel, exportAccountsToExcel } from './excelUtils';

const ExcelExporter = ({
    data = [],
    type = 'transactions',
    period = 'mes actual',
    variant = "outline",
    size = "sm",
    isLoading = false,
    onExport,
    children = "Exportar Excel"
}) => {
    const toast = useToast();

    const handleExport = async () => {
        // Si hay un handler personalizado, lo usamos
        if (onExport) {
            onExport();
            return;
        }

        // Validar datos
        if (!data || data.length === 0) {
            toast({
                title: "Sin datos",
                description: "No hay información para exportar",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            // Mostrar feedback de inicio
            toast({
                title: "Generando Excel...",
                description: "Preparando archivo para descarga",
                status: "info",
                duration: 2000,
                isClosable: true,
            });

            // Pequeño delay para mejor UX
            setTimeout(() => {
                try {
                    if (type === 'transactions') {
                        exportTransactionsToExcel(data, period, 'reporte_transacciones');
                    } else if (type === 'accounts') {
                        exportAccountsToExcel(data, 'reporte_cuentas');
                    }

                    toast({
                        title: "✅ Exportación exitosa",
                        description: `Archivo Excel generado correctamente con ${data.length} registros`,
                        status: "success",
                        duration: 4000,
                        isClosable: true,
                    });
                } catch (error) {
                    console.error('Error en exportación:', error);
                    toast({
                        title: "❌ Error en exportación",
                        description: "No se pudo generar el archivo Excel",
                        status: "error",
                        duration: 4000,
                        isClosable: true,
                    });
                }
            }, 500);

        } catch (error) {
            console.error('Error en exportación:', error);
            toast({
                title: "Error",
                description: "No se pudo completar la exportación",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Button
            leftIcon={<FiDownload />}
            variant={variant}
            size={size}
            onClick={handleExport}
            isLoading={isLoading}
            borderColor="gray.200"
            _hover={{
                bg: 'gray.50',
                borderColor: 'gray.300'
            }}
            _dark={{
                borderColor: 'gray.600',
                _hover: {
                    bg: 'gray.700',
                    borderColor: 'gray.500'
                }
            }}
        >
            {children}
        </Button>
    );
};

export default ExcelExporter;