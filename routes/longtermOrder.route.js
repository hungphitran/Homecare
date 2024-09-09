const longtermController = require('../controllers/longtermController')
const router = require('express').Router()

router.post('/submit',longtermController.submit);
router.post('/',longtermController.order);
module.exports = router;