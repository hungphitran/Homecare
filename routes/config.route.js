const dashboardRoute= require('./dashboard.route')
const registerRoute=require('./register.route')
const longtermRoute=require('./longtermOrder.route')
const shorttermRoute =require('./shorttermOrder.route')
const helperRoute=require('./detailedhelper.route')
const accountRoute=require('./detailedaccount.route')

function route(app){
    app.use('/helper',helperRoute)
    // app.use('/account',accountRoute)
    // app.use('/long-term',longtermRoute)
    app.use('/short-term',shorttermRoute)
    app.use('/register',registerRoute)
    //dashboard
    app.use('/Home',dashboardRoute)
    app.use('/',dashboardRoute)
}

module.exports={route}