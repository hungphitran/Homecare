const admin = require('firebase-admin');
const FCMToken = require('../models/fcmToken.model');

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.messaging = null;
  }

  // Initialize Firebase Admin SDK
  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Kiểm tra xem có service account key không
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccountBase64) {
        // Từ Base64 encoded JSON (recommended for production)
        try {
          const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
          const serviceAccountKey = JSON.parse(decodedServiceAccount);
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountKey.project_id
          });
          
          console.log('Firebase Admin SDK initialized with Base64 credentials');
        } catch (decodeError) {
          console.error('Error decoding Base64 service account key:', decodeError.message);
          throw decodeError;
        }
      } else if (serviceAccountJson) {
        // Từ environment variable (JSON string) - fallback method
        const serviceAccountKey = JSON.parse(serviceAccountJson);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountKey.project_id
        });
        
        console.log('Firebase Admin SDK initialized with JSON credentials');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Từ file path
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        
        console.log('Firebase Admin SDK initialized with credentials file');
      } else {
        console.warn('Firebase credentials not found. Notification service will be disabled.');
        console.warn('Please set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 or FIREBASE_SERVICE_ACCOUNT_KEY in your .env file');
        return;
      }

      this.messaging = admin.messaging();
      this.initialized = true;
      
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      // Don't throw error, just log it
    }
  }

  // Send notification to specific token
  async sendToToken(token, notification, data = {}) {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      if (!this.messaging) {
        console.warn('Firebase messaging not initialized. Skipping notification.');
        return null;
      }

      const message = {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: data.type || 'general'
        },
        // Android specific options
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        // iOS specific options
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        // Web push specific options
        webpush: {
          headers: {
            'TTL': '300'
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon/logo-removeBg.png',
            badge: '/icon/logo-removeBg.png',
            ...(notification.imageUrl && { image: notification.imageUrl }),
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'Xem chi tiết'
              },
              {
                action: 'dismiss',
                title: 'Bỏ qua'
              }
            ]
          },
          fcmOptions: {
            link: data.clickAction || '/'
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('Successfully sent message:', response);
      
      // Update last used for the token
      await FCMToken.updateOne(
        { token: token }, 
        { lastUsed: new Date() }
      );

      return response;
    } catch (error) {
      console.error('Error sending notification to token:', error);
      
      // If token is invalid, deactivate it
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-registration-token') {
        await FCMToken.updateOne(
          { token: token }, 
          { isActive: false }
        );
        console.log('Deactivated invalid token:', token);
      }
      
      throw error;
    }
  }

  // Send notification to multiple tokens
  async sendToMultipleTokens(tokens, notification, data = {}) {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      if (!this.messaging) {
        console.warn('Firebase messaging not initialized. Skipping notification.');
        return null;
      }

      if (!tokens || tokens.length === 0) {
        throw new Error('No tokens provided');
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: data.type || 'general'
        },
        tokens: tokens.slice(0, 500), // FCM limit is 500 tokens per request
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        webpush: {
          headers: {
            'TTL': '300'
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon/logo-removeBg.png',
            badge: '/icon/logo-removeBg.png',
            ...(notification.imageUrl && { image: notification.imageUrl }),
            requireInteraction: true
          },
          fcmOptions: {
            link: data.clickAction || '/'
          }
        }
      };

      const response = await this.messaging.sendEachForMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
            
            // Deactivate invalid tokens
            if (resp.error?.code === 'messaging/registration-token-not-registered' ||
                resp.error?.code === 'messaging/invalid-registration-token') {
              FCMToken.updateOne({ token: tokens[idx] }, { isActive: false });
            }
          }
        });
        console.log(`Failed to send to ${response.failureCount} tokens`);
      }

      console.log(`Successfully sent to ${response.successCount} tokens`);
      return response;
    } catch (error) {
      console.error('Error sending multicast message:', error);
      throw error;
    }
  }

  // Send to user by userId
  async sendToUser(userId, notification, data = {}) {
    try {
      const tokens = await FCMToken.getUserTokens(userId);
      if (!tokens || tokens.length === 0) {
        console.log('No active tokens found for user:', userId);
        return null;
      }

      const tokenList = tokens.map(t => t.token);
      return await this.sendToMultipleTokens(tokenList, notification, data);
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  // Send to user by phone number (QUAN TRỌNG cho việc map với đơn hàng)
  async sendToPhone(phone, notification, data = {}) {
    try {
      const tokens = await FCMToken.getTokensByPhone(phone);
      if (!tokens || tokens.length === 0) {
        console.log('No active tokens found for phone:', phone);
        return null;
      }

      const tokenList = tokens.map(t => t.token);
      return await this.sendToMultipleTokens(tokenList, notification, data);
    } catch (error) {
      console.error('Error sending notification to phone:', error);
      throw error;
    }
  }

  // Send order notification (dành riêng cho thông báo đơn hàng)
  async sendOrderNotification(phone, orderData) {
    const notification = {
      title: orderData.title || 'Cập nhật đơn hàng',
      body: orderData.message || 'Đơn hàng của bạn có cập nhật mới'
    };

    const data = {
      type: 'order',
      orderId: orderData.orderId,
      orderStatus: orderData.status,
      clickAction: `/order-detail/${orderData.orderId}`,
      ...orderData.extraData
    };

    return await this.sendToPhone(phone, notification, data);
  }

  // Subscribe token to topic
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      if (!this.messaging) {
        console.warn('Firebase messaging not initialized. Skipping subscription.');
        return null;
      }
      
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      
      // Update database
      for (const token of tokens) {
        await FCMToken.updateOne(
          { token: token },
          { $addToSet: { topics: topic }, lastUsed: new Date() }
        );
      }
      
      console.log('Successfully subscribed to topic:', response);
      return response;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Unsubscribe token from topic
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      if (!this.messaging) {
        console.warn('Firebase messaging not initialized. Skipping unsubscription.');
        return null;
      }
      
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      
      // Update database
      for (const token of tokens) {
        await FCMToken.updateOne(
          { token: token },
          { $pull: { topics: topic }, lastUsed: new Date() }
        );
      }
      
      console.log('Successfully unsubscribed from topic:', response);
      return response;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  // Clean up invalid tokens
  async cleanupInvalidTokens() {
    try {
      const result = await FCMToken.updateMany(
        { lastUsed: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } }, // 60 days old
        { isActive: false }
      );
      console.log(`Deactivated ${result.modifiedCount} old tokens`);
      return result;
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      throw error;
    }
  }

  // Send notification to authenticated users by phone
  async sendToAuthenticatedPhone(phone, notification, data = {}) {
    try {
      const tokens = await FCMToken.find({ 
        phone: phone, 
        isActive: true,
        isAuthenticated: true 
      }).select('token');
      
      if (!tokens || tokens.length === 0) {
        console.log('No active authenticated tokens found for phone:', phone);
        return null;
      }

      const tokenList = tokens.map(t => t.token);
      return await this.sendToMultipleTokens(tokenList, notification, {
        ...data,
        isAuthenticated: 'true',
        targetPhone: phone
      });
    } catch (error) {
      console.error('Error sending notification to authenticated phone:', error);
      throw error;
    }
  }

  // Send notification to topic (for authenticated users)
  async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      if (!this.messaging) {
        console.warn('Firebase messaging not initialized. Skipping topic notification.');
        return null;
      }

      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: data.type || 'topic'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        webpush: {
          headers: {
            'TTL': '300'
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon/logo-removeBg.png',
            badge: '/icon/logo-removeBg.png',
            ...(notification.imageUrl && { image: notification.imageUrl }),
            requireInteraction: true
          },
          fcmOptions: {
            link: data.clickAction || '/'
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('Successfully sent topic notification:', response);
      return { successCount: 1, failureCount: 0, response: response };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      return { successCount: 0, failureCount: 1, error: error.message };
    }
  }

  // Send personalized notification to authenticated user with preferences check
  async sendPersonalizedNotification(phone, notification, data = {}, checkPreferences = true) {
    try {
      const tokens = await FCMToken.find({ 
        phone: phone, 
        isActive: true,
        isAuthenticated: true 
      });
      
      if (!tokens || tokens.length === 0) {
        console.log('No active authenticated tokens found for phone:', phone);
        return null;
      }

      // Filter tokens based on notification preferences if enabled
      let filteredTokens = tokens;
      if (checkPreferences && data.type) {
        filteredTokens = tokens.filter(token => {
          const preferences = token.notificationPreferences || {};
          // Default to true if preference not set
          return preferences[data.type] !== false;
        });
      }

      if (filteredTokens.length === 0) {
        console.log('All tokens filtered out by preferences for phone:', phone);
        return { successCount: 0, failureCount: 0, filtered: true };
      }

      const tokenList = filteredTokens.map(t => t.token);
      return await this.sendToMultipleTokens(tokenList, notification, {
        ...data,
        isAuthenticated: 'true',
        targetPhone: phone,
        personalized: 'true'
      });
    } catch (error) {
      console.error('Error sending personalized notification:', error);
      throw error;
    }
  }

  // Get authenticated user statistics
  async getAuthenticatedUserStats() {
    try {
      const totalAuthenticated = await FCMToken.countDocuments({ 
        isActive: true, 
        isAuthenticated: true 
      });
      
      const platformStats = await FCMToken.aggregate([
        { $match: { isActive: true, isAuthenticated: true } },
        { $group: { _id: '$platform', count: { $sum: 1 } } }
      ]);

      const recentActivity = await FCMToken.countDocuments({
        isActive: true,
        isAuthenticated: true,
        lastUsed: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      return {
        totalAuthenticatedTokens: totalAuthenticated,
        platformBreakdown: platformStats,
        activeInLast24Hours: recentActivity
      };
    } catch (error) {
      console.error('Error getting authenticated user stats:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();
