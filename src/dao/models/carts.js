const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ]
});

const Cart = mongoose.model('Carts', cartSchema);

module.exports = Cart;
