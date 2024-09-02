const router =require('express').Router()
const mailController =require('../controllers/mailController')

router.post('/',mailController.send);

module.exports =router