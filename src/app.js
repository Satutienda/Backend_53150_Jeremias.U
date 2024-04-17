const express = require('express');

const ProductManager = require('./productManager.js');
const app = express();
const PORT = process.env.PORT || 3000; 
const productManager = new ProductManager();



app.get('/products', async (req, res) => {
    try {
        let limit = req.query.limit;
        let products = productManager.getAllProducts();
        if (limit) {
            products = products.slice(0, parseInt(limit));
        }
        res.json(products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/products/:pid', async (req, res) => {
    try {
        const id = parseInt(req.params.pid);
        const product = await productManager.findProductByCode(id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});




app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
