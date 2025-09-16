// Token verification route for testing purposes
const router = require('express').Router();
const authTokenMiddleware = require('../middlewares/authToken.middleware');
const notificationController = require('../controllers/notificationController');

// Route để đăng ký token notification
router.post('/register', authTokenMiddleware, notificationController.register);

module.exports = router;
