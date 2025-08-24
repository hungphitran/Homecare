const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authorizeLogin = require('../middlewares/authorizeLogin.middleware');

// Register FCM token (general)
router.post('/register', notificationController.registerToken);

// Register FCM token for authenticated users (requires login)
router.post('/register-authenticated', authorizeLogin, notificationController.registerTokenAuthenticated);

// Subscribe to topic
router.post('/subscribe', notificationController.subscribeToTopic);

// Unsubscribe from topic
router.post('/unsubscribe', notificationController.unsubscribeFromTopic);

// Send general notification
router.post('/send', notificationController.sendNotification);

// Send notification to authenticated users (admin only)
router.post('/send-to-authenticated', notificationController.sendToAuthenticatedUsers);

// Send notification to current authenticated user
router.post('/send-to-user', authorizeLogin, notificationController.sendToCurrentUser);

// Send order notification
router.post('/order', notificationController.sendOrderNotification);

// Get current user's tokens (requires login)
router.get('/user-tokens', authorizeLogin, notificationController.getCurrentUserTokens);

// Update notification preferences (requires login)
router.post('/update-preferences', authorizeLogin, notificationController.updateNotificationPreferences);

// Deactivate token (logout)
router.delete('/token', notificationController.deactivateToken);

// Get tokens by phone (for debugging)
router.get('/tokens/:phone', notificationController.getTokensByPhone);

module.exports = router;
