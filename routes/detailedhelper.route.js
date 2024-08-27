const helperController= require('../controllers/detailedhelperController')
const router= require('express').Router()

router.get('/:id',helperController.show)
router.get('/',helperController.show)


module.exports= router;