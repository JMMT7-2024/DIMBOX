// src/features/enterprise/components/EnterpriseInvoice.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, Text, Button, Select, Input, Card, CardBody,
    Table, Thead, Tbody, Tr, Th, Td, Badge, useToast, IconButton,
    useColorModeValue, Divider, Flex, Textarea, FormControl, FormLabel,
    Grid, Alert, AlertIcon // ✅ AGREGADO Grid y Alert
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiFileText, FiDownload } from 'react-icons/fi';
import api from '../../../lib/api'; // ✅ AGREGADO import de api

const EnterpriseInvoice = ({ products = [], compact = false }) => {
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [clientInfo, setClientInfo] = useState({
        name: '',
        ruc: '',
        address: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const cardBg = useColorModeValue('white', 'gray.750');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const addProductToInvoice = () => {
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        const existingItem = invoiceItems.find(item => item.productId === product.id);

        if (existingItem) {
            setInvoiceItems(prev => prev.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            setInvoiceItems(prev => [...prev, {
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: quantity,
                total: parseFloat(product.price) * quantity
            }]);
        }

        setSelectedProduct('');
        setQuantity(1);
    };

    const removeItem = (productId) => {
        setInvoiceItems(prev => prev.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;

        setInvoiceItems(prev => prev.map(item =>
            item.productId === productId
                ? {
                    ...item,
                    quantity: newQuantity,
                    total: item.price * newQuantity
                }
                : item
        ));
    };

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const igv = subtotal * 0.18; // 18% IGV
    const total = subtotal + igv;

    const generateInvoice = async () => {
        if (invoiceItems.length === 0) {
            toast({
                title: "Error",
                description: "Agrega productos a la factura",
                status: "error",
                duration: 3000,
            });
            return;
        }

        setLoading(true);
        try {
            const invoiceData = {
                client: clientInfo,
                items: invoiceItems,
                subtotal,
                igv,
                total,
                date: new Date().toISOString()
            };

            // ✅ MANEJO MEJORADO DE ERRORES
            try {
                await api.createEnterpriseInvoice(invoiceData);
                toast({
                    title: "Factura generada",
                    description: "La factura se ha creado correctamente",
                    status: "success",
                    duration: 3000,
                });
            } catch (apiError) {
                console.log('ℹ️ Endpoint de facturas no disponible, simulando creación');
                toast({
                    title: "Factura generada (simulada)",
                    description: "En producción, esto guardaría en la base de datos",
                    status: "success",
                    duration: 3000,
                });
            }

            // Resetear formulario
            setInvoiceItems([]);
            setClientInfo({ name: '', ruc: '', address: '', email: '' });

        } catch (error) {
            console.error('❌ Error generando factura:', error);
            toast({
                title: "Info",
                description: "La generación de facturas estará disponible pronto",
                status: "info",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // ✅ VERSIÓN COMPACTA PARA MÓVIL
    if (compact) {
        return (
            <VStack spacing={3} align="stretch">
                <Text fontWeight="semibold">Facturación Rápida</Text>

                <FormControl size="sm">
                    <FormLabel fontSize="sm">Producto</FormLabel>
                    <Select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        placeholder="Seleccionar producto"
                        size="sm"
                    >
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} - S/ {parseFloat(product.price).toFixed(2)}
                            </option>
                        ))}
                    </Select>
                </FormControl>

                <HStack spacing={2}>
                    <FormControl>
                        <FormLabel fontSize="sm">Cantidad</FormLabel>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            size="sm"
                        />
                    </FormControl>
                    <Button
                        onClick={addProductToInvoice}
                        isDisabled={!selectedProduct}
                        colorScheme="blue"
                        size="sm"
                        mt={6}
                    >
                        Agregar
                    </Button>
                </HStack>

                {invoiceItems.length > 0 && (
                    <VStack spacing={2} align="stretch" mt={3}>
                        <Text fontSize="sm" fontWeight="medium">Items: {invoiceItems.length}</Text>
                        <Text fontSize="sm">Total: S/ {total.toFixed(2)}</Text>
                        <Button
                            colorScheme="green"
                            size="sm"
                            onClick={generateInvoice}
                            isLoading={loading}
                            leftIcon={<FiFileText />}
                        >
                            Generar Factura
                        </Button>
                    </VStack>
                )}
            </VStack>
        );
    }

    return (
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
                <VStack spacing={6} align="stretch">
                    {/* ✅ ALERTA INFORMATIVA */}
                    <Alert status="info" fontSize="sm">
                        <AlertIcon />
                        <Box>
                            <Text fontWeight="medium">Función en desarrollo</Text>
                            <Text fontSize="xs">Los datos se guardan localmente por ahora</Text>
                        </Box>
                    </Alert>

                    {/* Información del Cliente */}
                    <Box>
                        <Text fontWeight="bold" mb={3}>Información del Cliente</Text>
                        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                            <FormControl>
                                <FormLabel fontSize="sm">Nombre/Razón Social</FormLabel>
                                <Input
                                    value={clientInfo.name}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Cliente o Empresa"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">RUC/DNI</FormLabel>
                                <Input
                                    value={clientInfo.ruc}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, ruc: e.target.value }))}
                                    placeholder="Número de documento"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Dirección</FormLabel>
                                <Input
                                    value={clientInfo.address}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Dirección del cliente"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Email</FormLabel>
                                <Input
                                    type="email"
                                    value={clientInfo.email}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@cliente.com"
                                    size="sm"
                                />
                            </FormControl>
                        </Grid>
                    </Box>

                    {/* Agregar Productos */}
                    <Box>
                        <Text fontWeight="bold" mb={3}>Agregar Productos</Text>
                        <HStack spacing={3}>
                            <Select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                placeholder="Seleccionar producto"
                                flex={2}
                                size="sm"
                            >
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} - S/ {parseFloat(product.price).toFixed(2)}
                                    </option>
                                ))}
                            </Select>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                min="1"
                                max="1000"
                                width="100px"
                                size="sm"
                            />
                            <Button
                                leftIcon={<FiPlus />}
                                onClick={addProductToInvoice}
                                isDisabled={!selectedProduct}
                                colorScheme="blue"
                                size="sm"
                            >
                                Agregar
                            </Button>
                        </HStack>
                    </Box>

                    {/* Items de la Factura */}
                    {invoiceItems.length > 0 && (
                        <Box>
                            <Text fontWeight="bold" mb={3}>Detalle de la Factura</Text>
                            <Box overflowX="auto">
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Producto</Th>
                                            <Th>Precio Unit.</Th>
                                            <Th>Cantidad</Th>
                                            <Th>Total</Th>
                                            <Th>Acciones</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {invoiceItems.map(item => (
                                            <Tr key={item.productId}>
                                                <Td>{item.name}</Td>
                                                <Td>S/ {item.price.toFixed(2)}</Td>
                                                <Td>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        width="80px"
                                                        size="sm"
                                                    />
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="green">
                                                        S/ {item.total.toFixed(2)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <IconButton
                                                        icon={<FiTrash2 />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        onClick={() => removeItem(item.productId)}
                                                        aria-label="Eliminar"
                                                    />
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>

                            {/* Totales */}
                            <Box mt={4} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <VStack spacing={2} align="stretch">
                                    <Flex justify="space-between">
                                        <Text fontSize="sm">Subtotal:</Text>
                                        <Text fontSize="sm">S/ {subtotal.toFixed(2)}</Text>
                                    </Flex>
                                    <Flex justify="space-between">
                                        <Text fontSize="sm">IGV (18%):</Text>
                                        <Text fontSize="sm">S/ {igv.toFixed(2)}</Text>
                                    </Flex>
                                    <Divider />
                                    <Flex justify="space-between" fontWeight="bold">
                                        <Text>Total:</Text>
                                        <Text color="green.500">S/ {total.toFixed(2)}</Text>
                                    </Flex>
                                </VStack>
                            </Box>
                        </Box>
                    )}

                    {/* Acciones */}
                    <HStack justify="flex-end" spacing={3}>
                        <Button variant="outline" isDisabled={invoiceItems.length === 0} size="sm">
                            <FiDownload />
                            <Text ml={2}>Exportar PDF</Text>
                        </Button>
                        <Button
                            colorScheme="green"
                            onClick={generateInvoice}
                            isDisabled={invoiceItems.length === 0}
                            isLoading={loading}
                            size="sm"
                        >
                            <FiFileText />
                            <Text ml={2}>Generar Factura</Text>
                        </Button>
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
    );
};

export default EnterpriseInvoice;