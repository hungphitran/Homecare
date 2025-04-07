const dashboardController=require('../controllers/dashboardController')
const router =require('express').Router();


router.get('/',dashboardController.show);

module.exports = router;