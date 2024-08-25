const mongoose = require('mongoose')

const Message = mongoose.Schema({
    authencode: Number,
    customernumber: Number,
    thoigianhethan: { type: Date, expires: 5*60, default: Date.now }
});

var tinnhanDB = mongoose.model('Message', tinnhanSchema,'messages');

//ham random ma xac nhan
function taoMaXacNhan(){
    var min = 10000;
    var max = 99999;
    var random = Math.floor(Math.random() * (max - min + 1)) + min;
    return random;
}
function luuXacNhan(sdtkhachhang){

}
function timXacNhan(sdtkhachhang){
}
function xoaXacNhan(sdtkhachhang){
}

//exports