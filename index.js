const express = require('express')
const db = require('./db/connect')
const { route } = require('./routes/config.route')//file contains root-route
const handlebars = require('express-handlebars')//lib for template engine
const session = require('express-session')//lib for modifying session
const path = require('path')
//mongodb-url 
require('dotenv').config()

//init reference of express application
const app = express()

//config static file
app.use(express.static(path.join(__dirname, 'public')))
//template engine helpers
const hbs = handlebars.create({
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        },
        formatDate: function () {
            return new Date().toISOString().split('T')[0];
        },
        formatContent: function () {
            return "chọn ngày"
        },
        getElement: function(arr,index){
            return JSON.stringify(arr[index]);
        }
    }
});
// const Handlebars = require('handlebars');
// Handlebars.registerHelper('formatDate', function() {
//   return new Date().toISOString().split('T')[0];
// });

// Register `hbs.engine` with the Express app.
app.engine('handlebars', hbs.engine);// set up the template engine handle .handlebars file
app.set('views', path.join(__dirname, 'resource', 'views'))// set up the path to views resource
app.set('view engine', 'handlebars')//set handlebars is the default engine
app.use(express.urlencoded({ extended: true }))
app.use(express.json())//handle json data when POST and PUT
app.use(session({//setting for session
    secret:"secretkey",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30 // Session expired after 30 minutes
    }
}));
db.connect();


// config routes for app
route(app);

//listening
app.listen(process.env.PORT || 3000, () => {
    console.log('listening on http://localhost:3000')
})
