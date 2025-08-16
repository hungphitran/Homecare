const helperController= require('../controllers/detailedhelperController')
const authTokenMiddleware = require('../middlewares/authToken.middleware')
const router= require('express').Router()

router.get('/:id',authTokenMiddleware, helperController.show)
router.get('/',authTokenMiddleware, helperController.show)


module.exports= router;