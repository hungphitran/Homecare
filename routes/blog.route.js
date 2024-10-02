const blogController = require('../controllers/blogController')
const router= require('express').Router()

router.get('/',blogController.showAll)

module.exports =router;