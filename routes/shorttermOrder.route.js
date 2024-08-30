const shorttermController =require('../controllers/shorttermController')
const router =require('express').Router();
router.post('/save',shorttermController.submit)
router.post('/',shorttermController.order);
router.get('/',shorttermController.get)
module.exports=router;