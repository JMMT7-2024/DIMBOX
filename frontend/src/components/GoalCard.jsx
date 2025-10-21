import React, { useMemo } from 'react';
import { Box, Flex, Text, Button, Progress, Icon } from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';

const getKind = (t) => {
    const raw = (t?.type || t?.tipo || t?.transaction_type || '').toString().toLowerCase();
    if (raw === 'income' || raw === 'ingreso' || raw === 'ingresos' || raw === 'in') return 'income';
    if (raw === 'expense' || raw === 'gasto' || raw === 'gastos' || raw === 'out') return 'expense';
    const a = Number(t?.amount ?? t?.monto ?? 0);
    return a < 0 ? 'expense' : 'income';
};
const getAmount = (t) => Math.abs(Number(t?.amount ?? t?.monto ?? 0) || 0);

export default function GoalCard({ profile = {}, transactions = [], onConfigure, showConfigure = true }) {
    const goalName = profile?.goal_name || 'Mi ahorro';
    const goalAmount = Number(profile?.goal_amount || 0);

    const { saved = 0, progress = 0, remaining = 0 } = useMemo(() => {
        try {
            if (!Array.isArray(transactions)) return { saved: 0, progress: 0, remaining: goalAmount };
            let inc = 0, exp = 0;
            for (const t of transactions) {
                const kind = getKind(t);
                const amt = getAmount(t);
                if (kind === 'income') inc += amt; else exp += amt;
            }
            const s = inc - exp;
            const p = goalAmount > 0 ? Math.max(0, Math.min(100, Math.round((s / goalAmount) * 100))) : 0;
            return { saved: s, progress: p, remaining: Math.max(0, goalAmount - s) };
        } catch {
            return { saved: 0, progress: 0, remaining: goalAmount };
        }
    }, [transactions, goalAmount]);

    const fmt = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <Box bg="var(--card)" border="1px solid var(--line)" borderRadius="16px" boxShadow="var(--shadow-light)" p={5}>
            <Flex align="center" justify="space-between" mb={3} wrap="wrap" gap={3}>
                <Flex align="center" gap={2}>
                    <Box as="span" px={2.5} py={0.5} borderRadius="9999px" bg="rgba(0,0,0,.06)" fontSize="xs" fontWeight="semibold">
                        Meta
                    </Box>
                    <Text fontWeight="bold">{goalName}</Text>
                </Flex>

                {showConfigure && (
                    <Button leftIcon={<Icon as={FiSettings} />} variant="outline" size="sm" onClick={onConfigure}>
                        Configurar
                    </Button>
                )}
            </Flex>

            <Flex align="center" justify="space-between" mb={2}>
                <Text color="gray.600">{fmt(saved)}</Text>
                <Text color="gray.600">{fmt(goalAmount)}</Text>
            </Flex>

            <Progress value={progress} size="sm" borderRadius="8px" colorScheme="green" />

            <Flex align="center" justify="space-between" mt={2} wrap="wrap" gap={2}>
                <Text fontWeight="bold">{progress}%</Text>
                {goalAmount > 0 && (
                    <Text color="gray.600" fontSize="sm">
                        {remaining > 0 ? `Faltan ${fmt(remaining)} para tu meta.` : '¡Meta alcanzada!'}
                    </Text>
                )}
            </Flex>
        </Box>
    );
}
