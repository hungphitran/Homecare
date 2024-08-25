const dashboardRoute= require('./dashboard')
const registerRoute=require('./register')

function route(app){

    app.use('/register',registerRoute)
        //dashboard
    app.use('/',dashboardRoute)
}

module.exports={route}