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
// Thêm helper này vào object helpers trong hbs.create

//template engine helpers
const hbs = handlebars.create({
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        },
        showdate: function(date){
            return date.split('T')[0]
        },
        formatDate: function () {
            return new Date().toISOString().split('T')[0];
        },
        formatTime: function (date) {
            return date.split('T')[1].split('.')[0];
        },
        // showdate: function(date){
        //     return date
        // },
        // formatDate: function () {
        //     return new Date().toISOString().split('T')[0]
        // },
        // formatTime: function (date) {
        //     return date
        // },
        formatContent: function () {
            return "chọn ngày"
        },
        getElement: function(arr,index){
            return JSON.stringify(arr[index]);
        },
        isEquals : function(value1,value2,options){
            if (value1 == value2) {
                return options.fn(this); 
              } else {
                return options.inverse(this); 
              }
        },
        ifCond: function(v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!=':
      return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case '!==':
      return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case '<':
      return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=':
      return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=':
      return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
},
        compareProperties:function (obj, prop, thisProp, options) {
            if (obj[prop] === this[thisProp]) {
                return options.fn(this);  // Khi hai giá trị bằng nhau
            } else {
                return options.inverse(this);  // Khi hai giá trị khác nhau
            }
        },
        getAge: function(birthDate){
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
        
            //get exactly age 
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        },
        getStatus: function(status){
            switch(status)
            {
                case "notDone": return "Chờ xác nhận"// được hủy
                case "assigned": return "Đã xác nhận"
                case "done": return "Đã hoàn thành"
                case "cancelled" : return "Đã hủy"
                case "waitPayment": return "Chờ thanh toán" // được thanh toán
                 
                default: return status;
            }
        },
        sum: function(n1,n2){
            let num1 = Number.parseInt(n1)
            let num2 = Number.parseInt(n2)
            console.log(n1,n2,num1,num2)

            return num1+num2
        },
        getButtonText: function(status){
            console.log(status)
            switch(status)
            {
                case "notDone": return "Hủy"
                case "assigned": return ""
                case "done": return ""
                case "cancelled" : return ""
                case "wayPayment": return "Xác nhận thanh toán"
                case "processing": return "Xác nhận hoàn thành"
                default: return status;
            }
        }
    }
});


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
//db.connect();


// config routes for app
route(app);

//listening
app.listen(process.env.PORT || 3000, () => {
    console.log('listening on http://localhost:3000')
})
