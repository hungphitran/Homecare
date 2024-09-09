const dashboardRoute= require('./dashboard.route')
const registerRoute=require('./register.route')
const longtermRoute=require('./longtermOrder.route')
const shorttermRoute =require('./shorttermOrder.route')
const helperRoute=require('./detailedhelper.route')
//const accountRoute=require('./detailedaccount.route')
const mailRoute = require('./mail.route')
const requestRoute =require('./request.route');

function route(app){
    app.use('/helper',helperRoute)
    app.use('/request',requestRoute)
    // app.use('/account',accountRoute)
    app.use('/long-term',longtermRoute)
    app.use('/short-term',shorttermRoute)
    app.use('/register',registerRoute)
    app.use('/contact',mailRoute)
    //dashboard
    app.use('/Home',dashboardRoute)
    app.use('/',dashboardRoute)
}

module.exports={route}