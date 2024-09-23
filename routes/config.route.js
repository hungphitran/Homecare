const dashboardRoute = require('./dashboard.route')
const accountRoute = require('./account.route')
const helperRoute = require('./detailedhelper.route')
//const accountRoute=require('./detailedaccount.route')

const mailRoute = require('./mail.route')
const requestRoute = require('./request.route');
const headerLoad = require('../middlewares/headerLoad')

function route(app) {
    app.use('/helper', helperRoute)
    app.use('/request', requestRoute)
    app.use('/account', accountRoute)
    app.use('/contact', mailRoute)
    //dashboard
    app.use('/Home', headerLoad, dashboardRoute)
    app.use('/', headerLoad, dashboardRoute)
}

module.exports = { route }