// src/components/exports/excelUtils.js
import * as XLSX from 'xlsx';

// ✅ DATOS ESTÁTICOS PARA CATEGORÍAS (mismo que en Dashboard)
const CATEGORY_LABELS = {
    AL: 'Alimentación', TR: 'Transporte', SE: 'Servicios',
    VI: 'Vivienda', OC: 'Ocio', SA: 'Salud', ED: 'Educación', OT: 'Otros',
};

// ✅ FORMATOS PROFESIONALES PARA EXCEL
const ExcelStyles = {
    header: {
        font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
        fill: { fgColor: { rgb: '2E86AB' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: '1B5E7F' } },
            left: { style: 'thin', color: { rgb: '1B5E7F' } },
            bottom: { style: 'thin', color: { rgb: '1B5E7F' } },
            right: { style: 'thin', color: { rgb: '1B5E7F' } }
        }
    },
    title: {
        font: { bold: true, size: 16, color: { rgb: '2E86AB' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    },
    subtitle: {
        font: { bold: true, size: 12, color: { rgb: '555555' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    },
    amountPositive: {
        font: { bold: true, color: { rgb: '27AE60' } },
        numFmt: '"S/"#,##0.00'
    },
    amountNegative: {
        font: { bold: true, color: { rgb: 'E74C3C' } },
        numFmt: '"S/"#,##0.00'
    },
    normalCell: {
        border: {
            top: { style: 'thin', color: { rgb: 'E0E0E0' } },
            left: { style: 'thin', color: { rgb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
            right: { style: 'thin', color: { rgb: 'E0E0E0' } }
        }
    }
};

// ✅ FUNCIÓN PARA EXPORTAR TRANSACCIONES A EXCEL
export const exportTransactionsToExcel = (transactions, period, fileName = 'transacciones') => {
    if (!transactions || transactions.length === 0) {
        throw new Error('No hay datos para exportar');
    }

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();

    // Preparar datos para la hoja de resumen
    const totalIncome = transactions.filter(t => t.transaction_type === 'IN')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpense = transactions.filter(t => t.transaction_type === 'OUT')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const balance = totalIncome - totalExpense;

    const summaryData = [
        ['REPORTE DE TRANSACCIONES - FINANZAS PERSONALES'],
        [''],
        ['Período', getPeriodDisplayName(period)],
        ['Fecha de exportación', new Date().toLocaleDateString('es-ES')],
        ['Total de transacciones', transactions.length],
        [''],
        ['RESUMEN FINANCIERO'],
        ['Ingresos totales', totalIncome],
        ['Gastos totales', totalExpense],
        ['Balance', balance],
        [''],
        ['DETALLE DE TRANSACCIONES']
    ];

    // Preparar datos detallados
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto (S/)', 'Estado'];
    const transactionsData = transactions.map(transaction => {
        const date = new Date(transaction.date || transaction.created_at);
        const isIncome = transaction.transaction_type === 'IN';

        return [
            date.toLocaleDateString('es-ES'),
            isIncome ? 'INGRESO' : 'GASTO',
            CATEGORY_LABELS[transaction.category] || transaction.category,
            transaction.description || 'Sin descripción',
            Number(transaction.amount) || 0,
            'COMPLETADO'
        ];
    });

    // Combinar todos los datos
    const allData = [...summaryData, headers, ...transactionsData];

    // Crear hoja de trabajo
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Aplicar estilos y formatos
    applyExcelStyles(ws, allData.length - transactionsData.length, transactions);

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');

    // Generar y descargar archivo
    downloadExcelFile(wb, fileName);
};

// ✅ FUNCIÓN PARA EXPORTAR CUENTAS RÁPIDAS A EXCEL
export const exportAccountsToExcel = (accounts, fileName = 'cuentas_rapidas') => {
    if (!accounts || accounts.length === 0) {
        throw new Error('No hay datos para exportar');
    }

    const wb = XLSX.utils.book_new();

    const titleData = [
        ['REPORTE DE CUENTAS RÁPIDAS - FINANZAS PERSONALES'],
        [''],
        ['Fecha de exportación', new Date().toLocaleDateString('es-ES')],
        ['Total de cuentas', accounts.length],
        ['Saldo total', accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0)],
        [''],
        ['DETALLE DE CUENTAS RÁPIDAS']
    ];

    const headers = ['Nombre', 'Institución', 'Número de Cuenta', 'Tipo', 'Moneda', 'Saldo', 'Estado'];
    const accountsData = accounts.map(account => [
        account.name || 'Sin nombre',
        account.institution || 'No especificada',
        account.account_number || 'N/A',
        account.type || 'Cuenta',
        account.currency || 'PEN',
        Number(account.balance) || 0,
        account.status === 'active' ? 'ACTIVA' : 'INACTIVA'
    ]);

    const allData = [...titleData, headers, ...accountsData];
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Aplicar estilos
    applyExcelStyles(ws, titleData.length, accounts, 'accounts');

    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas Rápidas');

    // Generar y descargar archivo
    downloadExcelFile(wb, fileName);
};

// ✅ FUNCIÓN AUXILIAR PARA APLICAR ESTILOS
const applyExcelStyles = (worksheet, headerRowIndex, data, type = 'transactions') => {
    if (!worksheet['!ref']) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);

    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);

            if (!worksheet[cell_ref]) continue;

            // Título principal
            if (R === 0 && C === 0) {
                worksheet[cell_ref].s = ExcelStyles.title;
            }
            // Encabezados de la tabla
            else if (R === headerRowIndex && C >= 0) {
                worksheet[cell_ref].s = ExcelStyles.header;
            }
            // Montos en transacciones
            else if (type === 'transactions' && R > headerRowIndex && C === 4) {
                const transaction = data[R - headerRowIndex - 1];
                const isIncome = transaction?.transaction_type === 'IN';
                worksheet[cell_ref].s = isIncome ? ExcelStyles.amountPositive : ExcelStyles.amountNegative;
                worksheet[cell_ref].t = 'n';
            }
            // Saldos en cuentas
            else if (type === 'accounts' && R > headerRowIndex && C === 5) {
                worksheet[cell_ref].s = ExcelStyles.amountPositive;
                worksheet[cell_ref].t = 'n';
            }
            // Celdas normales
            else if (R > headerRowIndex) {
                worksheet[cell_ref].s = ExcelStyles.normalCell;
            }
        }
    }

    // Ajustar anchos de columnas
    if (type === 'transactions') {
        worksheet['!cols'] = [
            { wch: 12 }, { wch: 10 }, { wch: 15 },
            { wch: 30 }, { wch: 12 }, { wch: 12 }
        ];
    } else {
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 20 }, { wch: 20 },
            { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }
        ];
    }

    // Congelar paneles (fijar encabezados)
    worksheet['!freeze'] = { x: 0, y: headerRowIndex };
};

// ✅ FUNCIÓN PARA DESCARGAR ARCHIVO
const downloadExcelFile = (workbook, fileName) => {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

// ✅ FUNCIÓN PARA OBTENER NOMBRE DEL PERIODO
const getPeriodDisplayName = (period) => {
    const periodMap = {
        'today': 'Hoy',
        'yesterday': 'Ayer',
        'week': 'Esta semana',
        'last_week': 'Semana pasada',
        'month': 'Este mes',
        'last_month': 'Mes pasado',
        'all': 'Todos los periodos'
    };
    return periodMap[period] || period;
};

export { ExcelStyles, getPeriodDisplayName };