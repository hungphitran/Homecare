const express=require('express')
const db=require('./db/connect')
const {route}=require('./routes/config')
require('dotenv').config()
const app= express()
db.connect();
route(app);
app.listen(process.env.PORT||3000,()=>{
    console.log('listening on http://localhost:3000')
})