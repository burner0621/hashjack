const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    treasury_id: {
        required: true,
        type: String
    },
    treasury_prv_key: {
        required: false,
        type: String
    },
    treasury_fee_id: {
        required: true,
        type: String
    },
    username: {
        required: true,
        type: String
    },
    nettype: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
})

module.exports = Admin = mongoose.model('Admin', AdminSchema);