const FCMToken = require('../models/fcmToken.model');
const firebaseService = require('../services/firebaseService');

class NotificationController {
  // POST /notifications/register
  // Register FCM token for user
  async registerToken(req, res) {
    try {
      const { token, userId, phone, platform } = req.body;

      // Validate required fields
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required (để map với đơn hàng)'
        });
      }

      // Validate platform
      const validPlatforms = ['ios', 'android', 'web', 'unknown'];
      const validatedPlatform = validPlatforms.includes(platform) ? platform : 'unknown';

      // Extract device info from user agent
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = {
        userAgent: userAgent,
        model: this.extractDeviceModel(userAgent),
        version: this.extractAppVersion(userAgent)
      };

      // Save or update token
      const tokenData = {
        token: token,
        userId: userId || null,
        phone: phone,
        platform: validatedPlatform,
        deviceInfo: deviceInfo
      };

      const savedToken = await FCMToken.saveToken(tokenData);

      // Auto-subscribe to general notifications topic
      try {
        await firebaseService.subscribeToTopic([token], 'general');
      } catch (subscribeError) {
        console.warn('Failed to subscribe to general topic:', subscribeError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Token registered successfully',
        data: {
          tokenId: savedToken._id,
          platform: savedToken.platform,
          phone: savedToken.phone
        }
      });

    } catch (error) {
      console.error('Error registering FCM token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/subscribe
  // Subscribe token to specific topic
  async subscribeToTopic(req, res) {
    try {
      const { token, topic } = req.body;

      if (!token || !topic) {
        return res.status(400).json({
          success: false,
          message: 'Token and topic are required'
        });
      }

      // Validate topic name
      const validTopics = ['general', 'orders', 'promotions', 'system'];
      if (!validTopics.includes(topic)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid topic. Valid topics: ' + validTopics.join(', ')
        });
      }

      // Check if token exists in database
      const existingToken = await FCMToken.findOne({ token: token, isActive: true });
      if (!existingToken) {
        return res.status(404).json({
          success: false,
          message: 'Token not found or inactive'
        });
      }

      // Subscribe to topic
      await firebaseService.subscribeToTopic([token], topic);

      res.status(200).json({
        success: true,
        message: `Successfully subscribed to topic: ${topic}`
      });

    } catch (error) {
      console.error('Error subscribing to topic:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/unsubscribe
  // Unsubscribe token from specific topic
  async unsubscribeFromTopic(req, res) {
    try {
      const { token, topic } = req.body;

      if (!token || !topic) {
        return res.status(400).json({
          success: false,
          message: 'Token and topic are required'
        });
      }

      // Check if token exists in database
      const existingToken = await FCMToken.findOne({ token: token, isActive: true });
      if (!existingToken) {
        return res.status(404).json({
          success: false,
          message: 'Token not found or inactive'
        });
      }

      // Unsubscribe from topic
      await firebaseService.unsubscribeFromTopic([token], topic);

      res.status(200).json({
        success: true,
        message: `Successfully unsubscribed from topic: ${topic}`
      });

    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/send
  // Send notification (for testing or admin use)
  async sendNotification(req, res) {
    try {
      const { phone, title, body, data, type } = req.body;

      if (!phone || !title || !body) {
        return res.status(400).json({
          success: false,
          message: 'Phone, title, and body are required'
        });
      }

      const notification = { title, body };
      const notificationData = {
        type: type || 'general',
        ...data
      };

      const result = await firebaseService.sendToPhone(phone, notification, notificationData);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'No active tokens found for this phone number'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/order
  // Send order-specific notification
  async sendOrderNotification(req, res) {
    try {
      const { phone, orderId, status, message, title } = req.body;

      if (!phone || !orderId) {
        return res.status(400).json({
          success: false,
          message: 'Phone and orderId are required'
        });
      }

      const orderData = {
        orderId: orderId,
        status: status,
        title: title || 'Cập nhật đơn hàng',
        message: message || `Đơn hàng ${orderId} có cập nhật mới`,
        extraData: req.body.extraData || {}
      };

      const result = await firebaseService.sendOrderNotification(phone, orderData);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'No active tokens found for this phone number'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Order notification sent successfully',
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });

    } catch (error) {
      console.error('Error sending order notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // DELETE /notifications/token
  // Deactivate token (for logout)
  async deactivateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      await FCMToken.updateOne(
        { token: token },
        { isActive: false, lastUsed: new Date() }
      );

      res.status(200).json({
        success: true,
        message: 'Token deactivated successfully'
      });

    } catch (error) {
      console.error('Error deactivating token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /notifications/tokens/:phone
  // Get all tokens for a phone number (for debugging)
  async getTokensByPhone(req, res) {
    try {
      const { phone } = req.params;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone parameter is required'
        });
      }

      const tokens = await FCMToken.find({ phone: phone })
        .select('token platform isActive lastUsed topics createdAt')
        .sort({ lastUsed: -1 });

      res.status(200).json({
        success: true,
        data: tokens,
        count: tokens.length
      });

    } catch (error) {
      console.error('Error getting tokens by phone:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/register-authenticated
  // Register FCM token for authenticated user (uses session data)
  async registerTokenAuthenticated(req, res) {
    try {
      const { token, platform } = req.body;

      // Get user info from session (assuming user is already authenticated)
      const userPhone = req.session.phone;
      const userId = req.session.userId || req.session.user?.id;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      if (!userPhone) {
        return res.status(401).json({
          success: false,
          message: 'User must be logged in to register token'
        });
      }

      // Validate platform
      const validPlatforms = ['ios', 'android', 'web', 'unknown'];
      const validatedPlatform = validPlatforms.includes(platform) ? platform : 'unknown';

      // Extract device info from user agent
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = {
        userAgent: userAgent,
        model: this.extractDeviceModel(userAgent),
        version: this.extractAppVersion(userAgent)
      };

      // Save or update token with authenticated user info
      const tokenData = {
        token: token,
        userId: userId,
        phone: userPhone,
        platform: validatedPlatform,
        deviceInfo: deviceInfo,
        isAuthenticated: true,
        authenticatedAt: new Date()
      };

      const savedToken = await FCMToken.saveToken(tokenData);

      // Auto-subscribe to user-specific topics for authenticated users
      try {
        await firebaseService.subscribeToTopic([token], 'general');
        await firebaseService.subscribeToTopic([token], 'authenticated-users');
        await firebaseService.subscribeToTopic([token], `user-${userPhone}`);
      } catch (subscribeError) {
        console.warn('Failed to subscribe to topics:', subscribeError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Token registered successfully for authenticated user',
        data: {
          tokenId: savedToken._id,
          platform: savedToken.platform,
          phone: savedToken.phone,
          userId: savedToken.userId,
          authenticatedAt: savedToken.authenticatedAt
        }
      });

    } catch (error) {
      console.error('Error registering FCM token for authenticated user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/send-to-authenticated
  // Send notification to authenticated users (requires login)
  async sendToAuthenticatedUsers(req, res) {
    try {
      const { title, body, data, targetUsers, type } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          success: false,
          message: 'Title and body are required'
        });
      }

      const notification = { title, body };
      const notificationData = {
        type: type || 'authenticated',
        sentAt: new Date().toISOString(),
        ...data
      };

      let result;

      if (targetUsers && Array.isArray(targetUsers)) {
        // Send to specific authenticated users by phone
        const results = await Promise.all(
          targetUsers.map(phone => 
            firebaseService.sendToAuthenticatedPhone(phone, notification, notificationData)
          )
        );
        
        result = results.reduce((acc, curr) => ({
          successCount: acc.successCount + (curr?.successCount || 0),
          failureCount: acc.failureCount + (curr?.failureCount || 0)
        }), { successCount: 0, failureCount: 0 });
      } else {
        // Send to all authenticated users via topic
        result = await firebaseService.sendToTopic('authenticated-users', notification, notificationData);
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent to authenticated users successfully',
        result: result
      });

    } catch (error) {
      console.error('Error sending notification to authenticated users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/send-to-user
  // Send notification to current authenticated user
  async sendToCurrentUser(req, res) {
    try {
      const { title, body, data, type } = req.body;
      const userPhone = req.session.phone;

      if (!title || !body) {
        return res.status(400).json({
          success: false,
          message: 'Title and body are required'
        });
      }

      if (!userPhone) {
        return res.status(401).json({
          success: false,
          message: 'User must be logged in to receive notifications'
        });
      }

      const notification = { title, body };
      const notificationData = {
        type: type || 'user-specific',
        targetPhone: userPhone,
        sentAt: new Date().toISOString(),
        ...data
      };

      const result = await firebaseService.sendToAuthenticatedPhone(userPhone, notification, notificationData);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'No active authenticated tokens found for current user'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent to current user successfully',
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });

    } catch (error) {
      console.error('Error sending notification to current user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /notifications/user-tokens
  // Get current user's registered tokens
  async getCurrentUserTokens(req, res) {
    try {
      const userPhone = req.session.phone;

      if (!userPhone) {
        return res.status(401).json({
          success: false,
          message: 'User must be logged in to view tokens'
        });
      }

      const tokens = await FCMToken.find({ 
        phone: userPhone,
        isActive: true
      })
        .select('token platform isActive lastUsed topics createdAt isAuthenticated authenticatedAt')
        .sort({ lastUsed: -1 });

      res.status(200).json({
        success: true,
        data: tokens,
        count: tokens.length,
        userPhone: userPhone
      });

    } catch (error) {
      console.error('Error getting current user tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /notifications/update-preferences
  // Update notification preferences for authenticated user
  async updateNotificationPreferences(req, res) {
    try {
      const { preferences } = req.body;
      const userPhone = req.session.phone;

      if (!userPhone) {
        return res.status(401).json({
          success: false,
          message: 'User must be logged in to update preferences'
        });
      }

      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Valid preferences object is required'
        });
      }

      // Update all user's tokens with preferences
      await FCMToken.updateMany(
        { phone: userPhone, isActive: true },
        { 
          notificationPreferences: preferences,
          preferencesUpdatedAt: new Date()
        }
      );

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: preferences
      });

    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper methods
  extractDeviceModel(userAgent) {
    // Extract device model from user agent
    if (userAgent.includes('iPhone')) {
      const match = userAgent.match(/iPhone[^;]*/);
      return match ? match[0] : 'iPhone';
    } else if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android[^;)]*/);
      return match ? match[0] : 'Android';
    }
    return 'Unknown';
  }

  extractAppVersion(userAgent) {
    // Extract app version if available
    const match = userAgent.match(/Version\/([^\s]*)/);
    return match ? match[1] : '1.0.0';
  }
}

module.exports = new NotificationController();
