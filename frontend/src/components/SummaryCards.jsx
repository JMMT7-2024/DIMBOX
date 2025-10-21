import React, { useMemo } from 'react';
import { Box, Grid, GridItem, Flex, Text, Icon } from '@chakra-ui/react';
import { FiArrowUpRight, FiArrowDownRight, FiActivity } from 'react-icons/fi';

/** Normaliza tipo y monto desde distintos esquemas (IN/OUT, income/expense, etc.) */
const getKind = (t) => {
    const raw = (t?.type || t?.tipo || t?.transaction_type || '').toString().toLowerCase();
    if (raw === 'income' || raw === 'ingreso' || raw === 'ingresos' || raw === 'in') return 'income';
    if (raw === 'expense' || raw === 'gasto' || raw === 'gastos' || raw === 'out') return 'expense';
    const a = Number(t?.amount ?? t?.monto ?? 0);
    return a < 0 ? 'expense' : 'income';
};

const getAmount = (t) => {
    const v = Number(t?.amount ?? t?.monto ?? 0);
    // trabajamos con magnitudes positivas para sumar
    return Math.abs(isFinite(v) ? v : 0);
};

export default function SummaryCards({ transactions = [], period }) {
    const totals = useMemo(() => {
        try {
            if (!Array.isArray(transactions)) {
                return { totalIncome: 0, totalExpense: 0, balance: 0 };
            }
            let inc = 0;
            let exp = 0;
            for (const t of transactions) {
                const kind = getKind(t);
                const amt = getAmount(t);
                if (kind === 'income') inc += amt;
                else exp += amt;
            }
            return { totalIncome: inc, totalExpense: exp, balance: inc - exp };
        } catch {
            return { totalIncome: 0, totalExpense: 0, balance: 0 };
        }
    }, [transactions]);

    const { totalIncome = 0, totalExpense = 0, balance = 0 } = totals || {};

    const fmt = (n) =>
        `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const Card = ({ icon, label, value, color }) => (
        <Box
            bg="var(--card)"
            border="1px solid var(--line)"
            borderRadius="16px"
            boxShadow="var(--shadow-light)"
            p={4}
        >
            <Flex align="center" justify="space-between" mb={2}>
                <Flex align="center" gap={2}>
                    <Icon as={icon} color={color} />
                    <Text fontWeight="semibold">{label}</Text>
                </Flex>
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color={color}>
                {fmt(value)}
            </Text>
        </Box>
    );

    return (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <GridItem>
                <Card icon={FiArrowUpRight} label="Ingresos" value={totalIncome} color="green.500" />
            </GridItem>
            <GridItem>
                <Card icon={FiArrowDownRight} label="Gastos" value={totalExpense} color="red.500" />
            </GridItem>
            <GridItem>
                <Card icon={FiActivity} label="Balance" value={balance} color="blue.500" />
            </GridItem>
        </Grid>
    );
}
