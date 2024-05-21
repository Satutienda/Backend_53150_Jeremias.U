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
        let limit = req.query.limit;
        let products = await Product.find();
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
        const product = await Product.findById(req.params.pid);
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

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();

        socketServer.emit('nuevoProducto', savedProduct);

        res.status(201).json({ message: 'Producto agregado exitosamente', product: savedProduct });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/products/:pid', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.pid, req.body, { new: true });
        if (updatedProduct) {
            res.json({ message: `Producto con ID-${req.params.pid} actualizado exitosamente`, product: updatedProduct });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/products/:pid', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.pid);
        if (deletedProduct) {
            res.json({ message: `Producto con ID-${req.params.pid} eliminado exitosamente` });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas para Carritos
app.post('/api/carts', async (req, res) => {
    try {
        const newCart = new Cart(req.body);
        const savedCart = await newCart.save();
        const populatedCart = await Cart.findById(savedCart._id).populate('products.product').lean().exec();

        res.status(201).json({
            message: 'Carrito creado exitosamente',
            cart: populatedCart
        });
    } catch (error) {
        console.error('Error al crear el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/carts/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product');
        if (cart) {
            res.status(200).json(cart);
        } else {
            res.status(404).json({ error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/carts/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (cart) {
            const product = { product: req.params.pid, quantity: req.body.quantity };
            cart.products.push(product);
            await cart.save();
            res.status(201).json({ message: `Producto con ID-${req.params.pid} agregado al carrito con ID-${req.params.cid} exitosamente` });
        } else {
            res.status(404).json({ error: `No se encontró ningún carrito con ID-${req.params.cid}` });
        }
    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas para Mensajes
app.post('/api/mensajes', async (req, res) => {
    try {
        const nuevoMensaje = new Message(req.body);
        const savedMessage = await nuevoMensaje.save();
        res.status(201).json({ message: 'Mensaje creado exitosamente', message: savedMessage });
    } catch (error) {
        console.error('Error al crear el mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/mensajes', async (req, res) => {
    try {
        const messages = await Message.find().populate('user').lean().exec();
        res.json(messages);
    } catch (error) {
        console.error('Error al obtener los mensajes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Configuración de Socket.io para el chat
socketServer.on('connection', (socket) => {
    console.log('Nuevo cliente conectado al chat');

    // Manejo de mensajes de chat
    socket.on('chatMessage', async (msg) => {
        try {
            const message = new Message({ message: msg, user: 'Usuario' }); // Ajusta según tus necesidades
            const savedMessage = await message.save();
            socketServer.emit('message', { user: 'Usuario', message: msg }); // Emitir el mensaje a todos los clientes conectados
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

server.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
