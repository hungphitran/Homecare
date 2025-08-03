const accountController = require('../controllers/accountController')
const authorizeLoginMiddleware = require('../middlewares/authorizeLogin.middleware')
const authTokenMiddleware = require('../middlewares/authToken.middleware')
const router= require('express').Router()

router.post('/update', authTokenMiddleware, accountController.updateAccount)
router.post('/sendotp', authorizeLoginMiddleware, accountController.sendotp)
router.get('/detailed', authTokenMiddleware, accountController.showDetailed)
router.post('/register', accountController.register)
router.get('/register', accountController.showRegister)
router.post('/changepassword', authTokenMiddleware, accountController.changePassword)
router.get('/changepassword', authTokenMiddleware, accountController.showChangePassword)
router.get('/logout', accountController.logout)
router.post('/', accountController.login)
router.get('/', accountController.showLogin);


module.exports =router;