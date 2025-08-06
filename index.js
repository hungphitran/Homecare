const express = require('express')
const db = require('./db/connect')
const { route } = require('./routes/config.route')//file contains root-route
const handlebars = require('express-handlebars')//lib for template engine
const session = require('express-session')//lib for modifying session
const MongoStore = require('connect-mongo')//MongoDB session store
const path = require('path')
//mongodb-url 
require('dotenv').config()
// Trong file cấu hình handlebars (thường là app.js hoặc server.js)
// const { isWaitPayment } = require('./utils/helpers');

// // Đăng ký helper
// hbs.registerHelper('isWaitPayment', isWaitPayment);
//init reference of express application
const app = express()

//config static file
app.use(express.static(path.join(__dirname, 'public')))
// Thêm helper này vào object helpers trong hbs.create

//template engine helpers
const hbs = handlebars.create({
    helpers: {
        isWaitPayment: function(status) {
            return status === 'waitPayment';
        },
        json: function (context) {
            return JSON.stringify(context);
        },
        contains: function(str, searchStr) {
            if (typeof str === 'string' && typeof searchStr === 'string') {
                return str.toLowerCase().includes(searchStr.toLowerCase());
            }
            return false;
        },
        showdate: function(date){
            return date.split('T')[0]
        },
        formatDate: function () {
            return new Date().toISOString().split('T')[0];
        },
        formatTime: function (date) {
            if (!date) return '';
            
            // If it's already in HH:MM format
            if (typeof date === 'string' && /^\d{1,2}:\d{2}$/.test(date)) {
                return date;
            }
            
            // If it's an ISO string
            if (typeof date === 'string' && date.includes('T')) {
                try {
                    const dateObj = new Date(date);
                    if (!isNaN(dateObj.getTime())) {
                        const hours = dateObj.getUTCHours().toString().padStart(2, '0');
                        const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                    }
                } catch (e) {
                    console.error('Error parsing date for formatTime:', date, e);
                }
            }
            
            // Fallback: try to split by 'T' 
            if (typeof date === 'string' && date.includes('T')) {
                return date.split('T')[1].split('.')[0].substring(0, 5); // Get HH:MM
            }
            
            return date;
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
        // Helper để debug dữ liệu
        debug: function(data) {
            console.log('Template Debug:', data);
            return JSON.stringify(data, null, 2);
        },
        // Helper để kiểm tra array có phần tử không
        hasItems: function(array) {
            return array && Array.isArray(array) && array.length > 0;
        },
        // Helper để so sánh giá trị
        eq: function(a, b) {
            return a === b;
        },
        // Helper để kiểm tra có schedule nào cần thanh toán không
        hasWaitPaymentSchedules: function(schedules) {
            if (!schedules || !Array.isArray(schedules)) return false;
            return schedules.some(schedule => schedule.status === 'waitPayment');
        },
        // Helper để tính tổng tiền cần thanh toán
        getTotalWaitPaymentCost: function(schedules) {
            if (!schedules || !Array.isArray(schedules)) return 0;
            return schedules
                .filter(schedule => schedule.status === 'waitPayment')
                .reduce((total, schedule) => total + (schedule.cost || 0), 0);
        },
        // Helper để kiểm tra có schedule nào chưa thực hiện không
        hasNotDoneSchedules: function(schedules) {
            if (!schedules || !Array.isArray(schedules)) return false;
            return schedules.some(schedule => schedule.status === 'notDone');
        },
        // Helper để chuyển đổi object thành JSON string
        json: function(obj) {
            return JSON.stringify(obj);
        },
        // Helper để format số tiền
        formatMoney: function(amount) {
            if (!amount && amount !== 0) return '0 VNĐ';
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
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
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL,
        touchAfter: 24 * 3600 // lazy session update
    }),
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
