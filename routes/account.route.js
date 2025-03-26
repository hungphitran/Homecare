const accountController = require('../controllers/accountController')
const authorizeLoginMiddleware = require('../middlewares/authorizeLogin.middleware')
const router= require('express').Router()

router.post('/update',authorizeLoginMiddleware,accountController.updateAccount)
router.post('/sendotp',authorizeLoginMiddleware,accountController.sendotp)
router.get('/detailed',authorizeLoginMiddleware,accountController.showDetailed)
router.post('/register',accountController.register)
router.get('/register',accountController.showRegister)
router.post('/changepassword',authorizeLoginMiddleware,accountController.changePassword)
router.get('/changepassword',authorizeLoginMiddleware,accountController.showChangePassword)
router.get('/logout',accountController.logout)
router.post('/',accountController.login)
router.get('/',accountController.showLogin);


module.exports =router;