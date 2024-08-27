const dashboardRoute= require('./dashboard.route')
const registerRoute=require('./register.route')
const longtermRoute=require('./longtermOrder.route')
const sorttermRoute =require('./sorttermOrder.route')
const helperRoute=require('./detailedhelper.route')
const accountRoute=require('./detailedaccount.route')

function route(app){
    app.use('/helper',helperRoute)
    // app.use('/account',accountRoute)
    // app.use('/long-term',longtermRoute)
    // app.use('/sort-term',sorttermRoute)
    app.use('/register',registerRoute)
    //dashboard
    app.use('/Home',dashboardRoute)
    app.use('/',dashboardRoute)
}

module.exports={route}