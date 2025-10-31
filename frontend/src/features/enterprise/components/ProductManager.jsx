// src/features/enterprise/components/ProductManager.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, Text, Button, Input, Table, Thead, Tbody, Tr, Th, Td,
    Card, CardBody, useToast, IconButton, FormControl, FormLabel,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, useDisclosure, Badge,
    useColorModeValue, Alert, AlertIcon, Grid // ✅ AGREGADO Grid
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiDollarSign } from 'react-icons/fi';
import api from '../../../lib/api';

const ProductManager = ({ isOpen, onClose, onProductSelect }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sku: '',
        stock: ''
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const toast = useToast();

    const cardBg = useColorModeValue('white', 'gray.750');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const loadProducts = async () => {
        try {
            setLoading(true);

            // ✅ VERIFICAR SI EL USUARIO TIENE ACCESO EMPRESARIAL PRIMERO
            try {
                const userData = await api.getProfile();
                const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

                if (!isEnterpriseUser) {
                    toast({
                        title: "Plan requerido",
                        description: "Esta función requiere un plan Enterprise",
                        status: "warning",
                        duration: 3000,
                    });
                    setProducts([]);
                    return;
                }
            } catch (profileError) {
                console.log('ℹ️ No se pudo verificar el perfil, continuando...');
            }

            // ✅ INTENTAR CARGAR PRODUCTOS CON MANEJO DE ERRORES
            try {
                const response = await api.getEnterpriseProducts();
                setProducts(response.data || []);
            } catch (apiError) {
                console.log('ℹ️ Endpoint de productos no disponible aún');
                // ✅ DATOS DE EJEMPLO PARA DESARROLLO
                setProducts([
                    {
                        id: 1,
                        name: "Producto Ejemplo",
                        description: "Descripción del producto",
                        price: 99.99,
                        sku: "PROD-001",
                        stock: 10
                    },
                    {
                        id: 2,
                        name: "Servicio Premium",
                        description: "Servicio de consultoría",
                        price: 199.99,
                        sku: "SERV-001",
                        stock: null
                    }
                ]);
            }

        } catch (error) {
            console.error('Error loading products:', error);
            toast({
                title: "Info",
                description: "Los productos estarán disponibles pronto",
                status: "info",
                duration: 3000,
            });
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!formData.name || !formData.price) {
            toast({
                title: "Error",
                description: "Nombre y precio son obligatorios",
                status: "error",
                duration: 3000,
            });
            return;
        }

        try {
            // ✅ SIMULAR GUARDADO EN DESARROLLO
            const newProduct = {
                id: editingProduct ? editingProduct.id : Date.now(),
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                sku: formData.sku,
                stock: parseInt(formData.stock) || 0
            };

            if (editingProduct) {
                // Actualizar producto existente
                setProducts(prev => prev.map(p =>
                    p.id === editingProduct.id ? newProduct : p
                ));
                toast({
                    title: "Producto actualizado",
                    status: "success",
                    duration: 2000,
                });
            } else {
                // Agregar nuevo producto
                setProducts(prev => [...prev, newProduct]);
                toast({
                    title: "Producto creado",
                    status: "success",
                    duration: 2000,
                });
            }

            resetForm();

        } catch (error) {
            toast({
                title: "Info",
                description: "La función de guardado estará disponible pronto",
                status: "info",
                duration: 3000,
            });
        }
    };

    const handleDeleteProduct = async (product) => {
        if (window.confirm(`¿Eliminar producto ${product.name}?`)) {
            try {
                // ✅ SIMULAR ELIMINACIÓN EN DESARROLLO
                setProducts(prev => prev.filter(p => p.id !== product.id));
                toast({
                    title: "Producto eliminado",
                    status: "success",
                    duration: 2000,
                });
            } catch (error) {
                toast({
                    title: "Info",
                    description: "La función de eliminación estará disponible pronto",
                    status: "info",
                    duration: 3000,
                });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            sku: '',
            stock: ''
        });
        setEditingProduct(null);
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            sku: product.sku || '',
            stock: product.stock?.toString() || ''
        });
        setEditingProduct(product);
    };

    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={2}>
                        <FiPackage />
                        <Text>Gestión de Productos</Text>
                        <Badge colorScheme="purple" fontSize="xs">
                            ENTERPRISE
                        </Badge>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {/* ✅ ALERTA INFORMATIVA */}
                    <Alert status="info" mb={4} fontSize="sm">
                        <AlertIcon />
                        <Box>
                            <Text fontWeight="medium">Función en desarrollo</Text>
                            <Text fontSize="xs">Los datos se guardan localmente por ahora</Text>
                        </Box>
                    </Alert>

                    <Grid templateColumns="1fr 2fr" gap={6}>
                        {/* Formulario */}
                        <Card bg={cardBg} border="1px" borderColor={borderColor}>
                            <CardBody>
                                <VStack spacing={4}>
                                    <Text fontWeight="bold" fontSize="lg">
                                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                    </Text>

                                    <FormControl>
                                        <FormLabel>Nombre del Producto *</FormLabel>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ej: Laptop Dell XPS"
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Descripción</FormLabel>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Descripción breve"
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>SKU/Código</FormLabel>
                                        <Input
                                            value={formData.sku}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                            placeholder="Código interno"
                                        />
                                    </FormControl>

                                    <HStack spacing={3} w="full">
                                        <FormControl>
                                            <FormLabel>Precio (S/) *</FormLabel>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                                placeholder="0.00"
                                            />
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>Stock</FormLabel>
                                            <Input
                                                type="number"
                                                value={formData.stock}
                                                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                                placeholder="0"
                                            />
                                        </FormControl>
                                    </HStack>

                                    <Button
                                        colorScheme="blue"
                                        w="full"
                                        onClick={handleSaveProduct}
                                        isLoading={loading}
                                    >
                                        {editingProduct ? 'Actualizar' : 'Guardar'} Producto
                                    </Button>

                                    {editingProduct && (
                                        <Button
                                            variant="outline"
                                            w="full"
                                            onClick={resetForm}
                                        >
                                            Cancelar Edición
                                        </Button>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* Lista de Productos */}
                        <Card bg={cardBg} border="1px" borderColor={borderColor}>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold" fontSize="lg">
                                            Productos ({products.length})
                                        </Text>
                                        <Button
                                            size="sm"
                                            leftIcon={<FiPlus />}
                                            onClick={() => onProductSelect && onProductSelect(products)}
                                            isDisabled={products.length === 0}
                                        >
                                            Usar en Venta
                                        </Button>
                                    </HStack>

                                    {products.length === 0 ? (
                                        <Alert status="info">
                                            <AlertIcon />
                                            No hay productos registrados
                                        </Alert>
                                    ) : (
                                        <Box overflowX="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Producto</Th>
                                                        <Th>Precio</Th>
                                                        <Th>Stock</Th>
                                                        <Th>Acciones</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {products.map(product => (
                                                        <Tr key={product.id}>
                                                            <Td>
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="medium">{product.name}</Text>
                                                                    {product.description && (
                                                                        <Text fontSize="xs" color="gray.500">
                                                                            {product.description}
                                                                        </Text>
                                                                    )}
                                                                </VStack>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme="green">
                                                                    S/ {parseFloat(product.price).toFixed(2)}
                                                                </Badge>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme={product.stock > 0 ? "blue" : "red"}>
                                                                    {product.stock || 0}
                                                                </Badge>
                                                            </Td>
                                                            <Td>
                                                                <HStack spacing={1}>
                                                                    <IconButton
                                                                        icon={<FiEdit2 />}
                                                                        size="sm"
                                                                        onClick={() => handleEdit(product)}
                                                                        aria-label="Editar"
                                                                    />
                                                                    <IconButton
                                                                        icon={<FiTrash2 />}
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        onClick={() => handleDeleteProduct(product)}
                                                                        aria-label="Eliminar"
                                                                    />
                                                                </HStack>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </Box>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ProductManager;