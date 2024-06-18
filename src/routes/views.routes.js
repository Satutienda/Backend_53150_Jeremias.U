const express = require('express');
const router = express.Router();
const Product = require('../dao/models/products');
const User = require('../dao/models/users');
const isAuthenticated = require('../middleware/auth');


router.post('/', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Usuario no encontrado.');
        }

        if (user.password !== password) {
            return res.status(400).send('Contraseña incorrecta.');
        }

        req.session.user = {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
        };

        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error interno del servidor');
    }
});


router.get('/productos', isAuthenticated, async (req, res) => {
    try {

        const productos = await Product.find().lean();
        res.render('home', {
            productos,
            style: "home.css",
            user: req.session.user
        });
    } catch (err) {
        console.error('Error al obtener los productos:', err);
        res.status(500).send('Error interno del servidor');
    }
});


router.get('/chat', isAuthenticated, (req, res) => {
    res.render('chat', {
        style: "chat.css"
    });
});

router.get('/', (req, res) => {
    res.render('login', {
        style: "login.css"
    });
});

router.get('/register', (req, res) => {
    res.render('register', {
        style: "register.css"
    });
});

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('El correo electrónico ya está registrado.');
        }

        const newUser = new User({
            first_name,
            last_name,
            email,
            age,
            password // Almaceno por ahora sin bcrypt
        });

        await newUser.save();
        res.status(201).send('Usuario registrado exitosamente');
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});



router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión.');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

module.exports = router;




