const longtermController = require('../controllers/longtermController')
const router = require('express').Router()

router.post('/',longtermController.order);
module.exports = router;