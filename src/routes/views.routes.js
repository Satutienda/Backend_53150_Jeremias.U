
const express = require('express');
const router = express.Router();
const Product = require('../dao/models/products');


router.get('/', async (req, res) => {
    try {
        const productos = await Product.find().lean(); 
        res.render('home', {
            productos,
            style: "home.css" 
        });
    } catch (err) {
        console.error('Error al obtener los productos:', err);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/chat', (req, res) => {
    res.render('chat', {
        style: "chat.css"
    });
});

module.exports = router;

