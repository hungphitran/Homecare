const requestController =require('../controllers/requestController')
const authTokenMiddleware = require('../middlewares/authToken.middleware')
const router =require('express').Router()

router.get('/longterm',requestController.longTermOrder)
router.get('/shortterm',requestController.shortTermOrder)
router.post('/createpayment', authTokenMiddleware, requestController.createPaymentUrl)
router.post('/cancel', authTokenMiddleware, requestController.cancelOrder)
router.post('/finishpayment', authTokenMiddleware, requestController.finishPayment)
router.post('/review', authTokenMiddleware, requestController.submitReview)
router.post('/save', authTokenMiddleware, requestController.create);
router.get('/',authTokenMiddleware,requestController.submit)
module.exports=router;