const express = require('express')
const db = require('./db/connect')
const { route } = require('./routes/config.route')
const handlebars = require('express-handlebars')
const session = require('express-session')
const path = require('path')
//mongodb-url 
require('dotenv').config()

//init reference of express application
const app = express()

//config static file
app.use(express.static(path.join(__dirname, 'public')))
//template engine
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
        }
    }
});
// const Handlebars = require('handlebars');
// Handlebars.registerHelper('formatDate', function() {
//   return new Date().toISOString().split('T')[0];
// });

// Register `hbs.engine` with the Express app.
app.engine('handlebars', hbs.engine);
app.set('views', path.join(__dirname, 'resource', 'views'))
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30 // Session hết hạn sau 30 phút (tính bằng milliseconds)
    }
}));
db.connect();


// config routes for app
route(app);

//listening
app.listen(process.env.PORT || 3000, () => {
    console.log('listening on http://localhost:3000')
})
