// src/components/HistoryList.jsx
import React from 'react';
import {
    Box, Text, Button, Tag, Flex, Spacer, Icon, Stack, // Componentes Chakra
    useColorModeValue // Hook para compatibilidad modo claro/oscuro (opcional)
} from '@chakra-ui/react';
// Importa iconos si es necesario, ej: de react-icons
import { FiEdit, FiTrash2 } from 'react-icons/fi';

export default function HistoryList({ transactions = [], handleDelete, handleEdit }) {
    // Determina color de borde según modo claro/oscuro
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    // Determina esquema de color para la etiqueta (Tag)
    const getTagColorScheme = (category) => {
        // Ejemplo simple, puedes expandir esta lógica
        const colors = ['teal', 'cyan', 'purple', 'orange', 'pink', 'blue', 'yellow', 'gray'];
        // Función hash básica para asignar color según nombre de categoría
        let hash = 0;
        for (let i = 0; i < (category?.length || 0); i++) {
            hash = category.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length] || 'gray';
    };

    // Ordena transacciones por fecha (más nuevas primero)
    const sortedList = [...transactions].sort((a, b) => {
        try {
            // Compara fechas de forma segura
            return new Date(b.date) - new Date(a.date);
        } catch {
            return 0; // Maneja fechas inválidas
        }
    });

    // Mensaje si no hay transacciones
    if (transactions.length === 0) {
        return (
            <Box bg="white" borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                <Text color="gray.500">Aún no hay movimientos registrados.</Text>
            </Box>
        );
    }

    return (
        // Contenedor principal (como una Card)
        <Box
            bg="white" // Fondo blanco
            borderRadius="lg" // Bordes redondeados
            p={{ base: 4, md: 6 }} // Padding responsivo
            borderWidth="1px" // Ancho del borde
            borderColor={borderColor} // Color del borde
            boxShadow="sm" // Sombra sutil
        >
            <Text fontWeight="bold" fontSize="lg" mb={4}>Últimos Movimientos</Text>
            {/* Stack para apilar los elementos de la lista verticalmente */}
            <Stack spacing={0}> {/* Sin espacio por defecto entre items, el padding lo controla */}
                {sortedList.map((item, index) => {
                    const isIncome = item.transaction_type === 'IN';
                    const amountColor = isIncome ? 'green.600' : 'red.600'; // Color según ingreso/gasto
                    const sign = isIncome ? '+' : '-'; // Signo +/-
                    const description = item.description || (isIncome ? 'Ingreso' : 'Gasto'); // Descripción por defecto
                    const categoryColorScheme = getTagColorScheme(item.category); // Color para la etiqueta

                    return (
                        // Flex container para cada fila de la lista
                        <Flex
                            key={item.id || index} // Usa item.id si está disponible
                            align="center" // Alinea elementos verticalmente
                            py={3} // Padding vertical
                            // Borde inferior, excepto en el último elemento
                            borderBottomWidth={index === sortedList.length - 1 ? '0px' : '1px'}
                            borderColor={borderColor}
                        >
                            {/* Lado izquierdo: Descripción y Fecha */}
                            <Box flex="1" mr={4}> {/* Ocupa el espacio disponible */}
                                <Text fontWeight="medium" isTruncated>{description}</Text> {/* Trunca texto largo */}
                                <Text fontSize="xs" color="gray.500">{item.date}</Text> {/* Fecha */}
                            </Box>

                            {/* Centro (Opcional): Etiqueta de Categoría (solo para gastos) */}
                            {!isIncome && item.category && (
                                <Tag size="sm" colorScheme={categoryColorScheme} mr={4}>
                                    {item.category}
                                </Tag>
                            )}

                            {/* Lado derecho: Monto y Acciones */}
                            <Flex align="center" gap={3}> {/* Usa 'gap' para espaciar elementos */}
                                {/* Monto */}
                                <Text fontWeight="bold" color={amountColor} whiteSpace="nowrap"> {/* Evita que el monto se parta */}
                                    {sign} S/ {parseFloat(item.amount || 0).toFixed(2)}
                                </Text>
                                {/* Botones de Acción */}
                                <Button
                                    size="xs" // Botón pequeño
                                    variant="ghost" // Estilo sutil
                                    colorScheme="blue" // Color azul
                                    leftIcon={<Icon as={FiEdit} />} // Icono
                                    onClick={() => handleEdit(item)} // Llama al handler con todo el objeto
                                    aria-label="Editar"
                                />
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red" // Color rojo
                                    leftIcon={<Icon as={FiTrash2} />}
                                    onClick={() => handleDelete(item.id)} // Llama al handler con el ID
                                    aria-label="Borrar"
                                />
                            </Flex>
                        </Flex>
                    );
                })}
            </Stack>
        </Box>
    );
}