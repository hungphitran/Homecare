const blogController = require('../controllers/blogController')
const router= require('express').Router()
router.get('/:id',blogController.showOne)
router.post('/',blogController.filter)
router.get('/',blogController.showAll)

module.exports =router;