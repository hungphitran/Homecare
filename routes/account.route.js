const accountController = require('../controllers/accountController')
const router= require('express').Router()
router.get('/detailed',accountController.showDetailed)
router.post('/register',accountController.register)
router.get('/register',accountController.showRegister)
router.post('/',accountController.login)
router.get('/',accountController.showLogin);


module.exports =router;