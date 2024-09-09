const router =require('express').Router()
const mailController =require('../controllers/mailController')
router.get('/otp',mailController.sendOtp)
router.post('/',mailController.contact);

module.exports =router