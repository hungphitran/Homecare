const requestController =require('../controllers/requestController')
const router =require('express').Router()

router.post('/longterm',requestController.longTermOrder)
router.post('/shortterm',requestController.shortTermOrder)
router.post('/save',requestController.create);
router.post('/',requestController.submit)
module.exports=router;