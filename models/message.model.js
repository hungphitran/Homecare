const mongoose = require('mongoose')

const Message = mongoose.Schema({
    authencode: String,
    customernumber: Number,
    expirestime: { type: Date, expires: 5*60, default: Date.now }
});

var messageModel = mongoose.model('Message', Message,'messages');

module.exports= messageModel;
