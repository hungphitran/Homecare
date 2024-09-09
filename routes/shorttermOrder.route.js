const shorttermController =require('../controllers/shorttermController')
const router =require('express').Router();

router.post('/submit',shorttermController.submit)
router.post('/',shorttermController.filter);

module.exports=router;