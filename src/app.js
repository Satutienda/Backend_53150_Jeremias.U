const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Product = require('../src/dao/models/products.js');
const Cart = require('../src/dao/models/carts');
const Message = require('../src/dao/models/messages');
const viewsRouter = require('../src/routes/views.routes.js');
const path = require('path');


const app = express();
const server = http.createServer(app);
const socketServer = socketIO(server);

const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

// Configuración de Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.use("/", viewsRouter);

app.use(express.static(path.join(__dirname, 'public')));

// Conectar a MongoDB
const mongoDBUrl = "mongodb+srv://jerbri115:66wUqQb%3Agg5XQb8@coder.ny4cphv.mongodb.net/ecommerce"

mongoose.connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Conectado a MongoDB');
    })
    .catch(error => console.error('Error al conectar a MongoDB:', error));

// Rutas para Productos
app.get('/api/products', async (req, res) => {
    try {
        const { page = 1, limit = 5, sort, query } = req.query;

        // dejo las opciones de paginacion 
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sort ? { price: sort === 'asc' ? 1 : -1 } : undefined
        };

        // se realiza la busqueda 
        const searchQuery = query ? { category: new RegExp(query, 'i') } : {};

        // obtengo los productos paginados con filtros 
        const products = await Product.paginate(searchQuery, options);

        // configuro la respuesta 
        const response = {
            status: 'success',
            payload: products.docs,
            totalDocs: products.totalDocs,
            limit: products.limit,
            totalPages: products.totalPages,
            page: products.page,
            pagingCounter: products.pagingCounter,
            hasPrevPage: products.hasPrevPage,
            hasNextPage: products.hasNextPage,
            prevPage: products.prevPage,
            nextPage: products.nextPage
        };

        res.json(response);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.get('/api/products/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid);
        if (product) {
            res.json({ status: 'success', payload: product });
        } else {
            res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();

        socketServer.emit('nuevoProducto', savedProduct);

        res.status(201).json({ status: 'success', message: 'Producto agregado exitosamente', payload: savedProduct });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.put('/api/products/:pid', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.pid, req.body, { new: true });
        if (updatedProduct) {
            res.json({ status: 'success', message: `Producto con ID-${req.params.pid} actualizado exitosamente`, payload: updatedProduct });
        } else {
            res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.delete('/api/products/:pid', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.pid);
        if (deletedProduct) {
            res.json({ status: 'success', message: `Producto con ID-${req.params.pid} eliminado exitosamente` });
        } else {
            res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

// Rutas para Carritos
app.post('/api/carts/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (cart) {
            const product = { product: req.params.pid, quantity: req.body.quantity };
            cart.products.push(product);
            await cart.save();
            res.status(201).json({ status: 'success', message: `Producto con ID-${req.params.pid} agregado al carrito con ID-${req.params.cid} exitosamente` });
        } else {
            res.status(404).json({ status: 'error', error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.put('/api/carts/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (cart) {
            const productIndex = cart.products.findIndex(product => product.product.toString() === req.params.pid);
            if (productIndex !== -1) {
                cart.products[productIndex].quantity = req.body.quantity;
                await cart.save();
                res.json({ status: 'success', message: `Cantidad del producto con ID-${req.params.pid} actualizada en el carrito con ID-${req.params.cid}` });
            } else {
                res.status(404).json({ status: 'error', error: `Producto con ID-${req.params.pid} no encontrado en el carrito` });
            }
        } else {
            res.status(404).json({ status: 'error', error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al actualizar la cantidad del producto en el carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.delete('/api/carts/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (cart) {
            const productIndex = cart.products.findIndex(product => product.product.toString() === req.params.pid);
            if (productIndex !== -1) {
                cart.products.splice(productIndex, 1);
                await cart.save();
                res.json({ status: 'success', message: `Producto con ID-${req.params.pid} eliminado del carrito con ID-${req.params.cid}` });
            } else {
                res.status(404).json({ status: 'error', error: `Producto con ID-${req.params.pid} no encontrado en el carrito` });
            }
        } else {
            res.status(404).json({ status: 'error', error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al eliminar el producto del carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.delete('/api/carts/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (cart) {
            cart.products = [];
            await cart.save();
            res.json({ status: 'success', message: `Todos los productos del carrito con ID-${req.params.cid} han sido eliminados` });
        } else {
            res.status(404).json({ status: 'error', error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al eliminar los productos del carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.get('/api/carts/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product');
        if (cart) {
            res.status(200).json({ status: 'success', payload: cart });
        } else {
            res.status(404).json({ status: 'error', error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

// Rutas para Mensajes
app.post('/api/mensajes', async (req, res) => {
    try {
        const nuevoMensaje = new Message(req.body);
        const savedMessage = await nuevoMensaje.save();
        res.status(201).json({ status: 'success', message: 'Mensaje creado exitosamente', payload: savedMessage });
    } catch (error) {
        console.error('Error al crear el mensaje:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

app.get('/api/mensajes', async (req, res) => {
    try {
        const messages = await Message.find().populate('user').lean().exec();
        res.json({ status: 'success', payload: messages });
    } catch (error) {
        console.error('Error al obtener los mensajes:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

// Configuración de Socket.io para el chat
socketServer.on('connection', (socket) => {
    console.log('Nuevo cliente conectado al chat');

   
    socket.on('chatMessage', async (msg) => {
        try {
            const message = new Message({ message: msg, user: 'Usuario' }); 
            const savedMessage = await message.save();
            socketServer.emit('message', { user: 'Usuario', message: msg }); 
        } catch (error) {
            console.error('Error al guardar el mensaje:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado del chat');
    });

    socket.on('error', (error) => {
        console.error('Error en la conexión del socket:', error);
    });
});

app.get('/cart', async (req, res) => {
    const cartId = '664bfc626893a7077351bced'; // dejo este Id de carrito por el momento 
    try {
        const cart = await Cart.findById(cartId).populate('products.product');
        
        if (cart) {
            res.render('cart', { cart: cart.toObject() });
        } else {
            res.status(404).json({ status: 'error', error: `No se encontró ningún carrito con ID-${cartId}` });
        }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
    }
});

server.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

