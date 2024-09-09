const requestController =require('../controllers/requestController')
const router =require('express').Router()


router.post('/',requestController.create);

module.exports=router;