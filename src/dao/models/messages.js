const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: {
        type: String,
        required: false,
        default: "user1"
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

