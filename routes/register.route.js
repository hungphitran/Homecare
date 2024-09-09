const registerController=require('../controllers/registerController')
const router =require('express').Router();

router.get('/',registerController.show);

module.exports = router;