const accountController = require('../controllers/accountController')
const router= require('express').Router()

router.post('/sendotp',accountController.sendotp)
router.get('/detailed',accountController.showDetailed)
router.post('/register',accountController.register)
router.get('/register',accountController.showRegister)
router.post('/changepassword',accountController.changePassword)
router.get('/changepassword',accountController.showChangePassword)
router.get('/logout',accountController.logout)
router.post('/',accountController.login)
router.get('/',accountController.showLogin);


module.exports =router;