const express=require('express')
const db=require('./db/connect')
const {route}=require('./routes/config.route')
const handlebars= require('express-handlebars')
const path=require('path')
//mongodb-url 
require('dotenv').config()

//init reference of express application
const app= express()

//config static file
app.use(express.static(path.join(__dirname,'public')))
//template engine
const hbs = handlebars.create({
    helpers: {
    json: function(context) {
        return JSON.stringify(context);
    }
}});

// Register `hbs.engine` with the Express app.
app.engine('handlebars', hbs.engine);
app.set('views',path.join(__dirname,'resource','views'))
app.set('view engine','handlebars')
app.use(express.urlencoded({extended:true}))
app.use(express.json())


db.connect();


// config routes for app
route(app);

//listening
app.listen(process.env.PORT||3000,()=>{
    console.log('listening on http://localhost:3000')
})