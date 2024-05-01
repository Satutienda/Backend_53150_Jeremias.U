
const express = require('express');
const router = express.Router();
const fs = require('fs');



router.get('/', (req, res) => {

    fs.readFile('productos.json', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo de productos:', err);
            return res.status(500).send('Error interno del servidor');
        }
        const productos = JSON.parse(data);


        res.render('home', {
            productos,
            style: "home.css"
        });
    });
});



module.exports = router;