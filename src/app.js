const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const fs = require('fs');
const ProductManager = require('./productManager.js');
const CartManager = require('./cartManager.js');
const viewsRouter = require('../src/routes/views.routes.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const socketServer = socketIO(server);

const PORT = process.env.PORT || 8080;
const productManager = new ProductManager();
const cartManager = new CartManager();

app.use(bodyParser.json());


app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join('views'));

app.use("/", viewsRouter)


app.use(express.static(path.join(__dirname, 'public')));

app.get('/realTimeProducts', (req, res) => {


    fs.readFile('productos.json', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo de productos:', err);
            return res.status(500).send('Error interno del servidor');
        }
        const productos = JSON.parse(data);


        res.render('realTimeProducts', {
            productos,
            style: "home.css"
        });
    });
});


app.get('/api/products', async (req, res) => {
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

app.get('/api/products/:pid', async (req, res) => {
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

app.post('/api/products', (req, res) => {
    try {
        const { title, description, price, thumbnail, code, stock, status, category } = req.body;


        productManager.addProduct(title, description, price, thumbnail, code, stock, status, category);


        socketServer.emit('nuevoProducto', {
            title,
            description,
            price,
            thumbnail,
            code,
            stock,
            status,
            category
        });

        // Responder con un mensaje de éxito
        res.status(201).json({ message: 'Producto agregado exitosamente' });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/products/:pid', (req, res) => {
    try {
        const id = parseInt(req.params.pid);
        const { title, description, price, thumbnail, code, stock, status, category } = req.body;

        const updatedFields = {
            title,
            description,
            price,
            thumbnail,
            code,
            stock,
            status,
            category
        };

        productManager.updateProduct(id, updatedFields);

        res.json({ message: `Producto con ID-${id} actualizado exitosamente` });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/products/:pid', (req, res) => {
    try {
        const id = parseInt(req.params.pid);

        productManager.deleteProduct(id);

        res.json({ message: `Producto con ID-${id} eliminado exitosamente` });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.post('/api/carts', (req, res) => {
    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            res.status(400).json({ error: 'Debe proporcionar al menos un producto para crear un carrito.' });
            return;
        }

        const newCart = cartManager.createCart(products);
        res.status(201).json({ message: 'Carrito creado exitosamente', cart: newCart });
    } catch (error) {
        console.error('Error al crear el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/carts/:cid', (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const cart = cartManager.getCartById(cartId);

        if (cart) {
            res.status(200).json(cart);
        } else {
            res.status(404).json({ error: `No se encontró ningún carrito con ID-${cartId}` });
        }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/carts/:cid/products/:pid', (req, res) => {
    try {
        const cid = parseInt(req.params.cid);
        const pid = parseInt(req.params.pid);
        const { quantity } = req.body;

        if (isNaN(cid) || isNaN(pid) || isNaN(quantity) || quantity <= 0) {
            res.status(400).json({ error: 'Debe proporcionar un ID de carrito, un ID de producto y una cantidad válida.' });
            return;
        }

        const success = cartManager.addProductToCart(cid, pid, quantity);

        if (success) {
            res.status(201).json({ message: `Producto con ID-${pid} agregado al carrito con ID-${cid} exitosamente` });
        } else {
            res.status(404).json({ error: `No se encontró ningún carrito con ID-${cid}` });
        }
    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});








socketServer.on('connection', (socket) => {
    console.log('Nuevo cliente conectado al espacio de nombres "realTimeProduct"');


    socket.on('error', (error) => {
        console.error('Error en la conexión del socket:', error);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});