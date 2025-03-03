const requestController =require('../controllers/requestController')
const router =require('express').Router()

router.get('/longterm',requestController.longTermOrder)
router.get('/shortterm',requestController.shortTermOrder)
router.post('/save',requestController.create);
router.get('/',requestController.submit)
module.exports=router;