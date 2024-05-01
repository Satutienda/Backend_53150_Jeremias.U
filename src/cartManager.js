
const { defaultMaxListeners } = require('events');
const fs = require('fs');

class CartManager {
    constructor() {
        this.cart = [];
        this.loadCartFromFile();
    }

    loadCartFromFile(filePath = 'cart.json') {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            this.cart = JSON.parse(data);
            //console.log(`Carrito cargado desde el archivo ${filePath}:`, this.cart);
        } catch (err) {
            console.error('Error al cargar el carrito desde el archivo:', err);
        }
    }

    addProductToCart(cid, pid, quantity) {
        const product = {
            id: pid,
            quantity: quantity
        };

        const cartIndex = this.cart.findIndex(cart => cart.id === cid);
        if (cartIndex !== -1) {
            const existingProductIndex = this.cart[cartIndex].products.findIndex(prod => prod.id === pid);
            if (existingProductIndex !== -1) {

                this.cart[cartIndex].products[existingProductIndex].quantity += quantity;
            } else {

                this.cart[cartIndex].products.push(product);
            }
            this.saveCartToFile();
            console.log(`Producto con ID-${pid} agregado al carrito con ID-${cid} exitosamente.`);
        } else {
            console.log(`No se encontró ningún carrito con ID-${cid}.`);
        }
    }



    getCartById(cid) {
        const cart = this.cart.find(cart => cart.id === cid);
        if (cart) {
            console.log(`Carrito encontrado con ID-${cid}:`, cart);
            return cart;
        } else {
            console.log(`No se encontró ningún carrito con ID-${cid}.`);
            return null;
        }
    }

    createCart(products) {
        const newCartId = this.getNextCartId();
        const newCart = {
            id: newCartId,
            products: products
        };
        this.cart.push(newCart);
        this.saveCartToFile();
        console.log(`Carrito con ID-${newCartId} creado exitosamente.`);
        return newCart;
    }

    getNextCartId() {
        let nextId = 1;
        if (this.cart.length > 0) {
            const maxId = Math.max(...this.cart.map(cart => cart.id));
            nextId = maxId + 1;
        }
        return nextId;
    }

    saveCartToFile(filePath = 'cart.json') {
        const data = JSON.stringify(this.cart, null, 2);
        fs.writeFileSync(filePath, data);
        console.log(`Carrito guardado en el archivo ${filePath}.`);
    }
}

module.exports= CartManager;