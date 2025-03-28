const mongoose=require('mongoose')
const Schema = mongoose.Schema;
module.exports.mongoose = mongoose;
module.exports.Schema = Schema;

require('dotenv').config()
function connect(){
    mongoose.connect(process.env.DB_URL)
    .then(()=>{
        console.log('connected to database successfully')
    })
    .catch((err)=>{
        console.error(err)
    })
}

module.exports={connect};