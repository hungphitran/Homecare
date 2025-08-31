const dashboardRoute = require('./dashboard.route')
const accountRoute = require('./account.route')
const helperRoute = require('./detailedhelper.route')
const blogRoute = require('./blog.route')
const mailRoute = require('./mail.route')
const requestRoute = require('./request.route');
const authRoute = require('./auth.route');
const headerLoad = require('../middlewares/headerLoad')

function route(app) {
    // Apply headerLoad middleware globally to all routes
    app.use(headerLoad);
    
    app.use('/auth', authRoute)
    app.use('/blog',blogRoute)
    app.use('/helper', helperRoute)
    app.use('/request', requestRoute)
    app.use('/account', accountRoute)
    app.use('/contact', mailRoute)
    //dashboard
    app.use('/Home', dashboardRoute)
    app.use('/', dashboardRoute)
    
}

module.exports = { route }