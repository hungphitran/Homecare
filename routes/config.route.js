const dashboardRoute= require('./dashboard.route')
const registerRoute=require('./register.route')

function route(app){

    app.use('/register',registerRoute)
        //dashboard
    app.use('/',dashboardRoute)
}

module.exports={route}