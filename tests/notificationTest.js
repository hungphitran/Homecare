const firebaseService = require('../services/firebaseService');
const FCMToken = require('../models/fcmToken.model');
const OrderNotificationHelper = require('../helpers/orderNotificationHelper');

// Test script for Firebase notification service
class NotificationTester {
  
  static async testBasicNotification() {
    console.log('Testing basic notification...');
    
    try {
      const result = await firebaseService.sendToPhone('0123456789', {
        title: 'Test Notification',
        body: 'This is a test notification from Homecare app'
      }, {
        type: 'test',
        timestamp: new Date().toISOString()
      });

      console.log('Basic notification test result:', result);
    } catch (error) {
      console.error('Basic notification test failed:', error.message);
    }
  }

  static async testOrderNotification() {
    console.log('Testing order notification...');
    
    try {
      await OrderNotificationHelper.notifyOrderConfirmed('0123456789', {
        orderId: 'TEST_ORDER_001',
        helperName: 'Nguyễn Văn A',
        helperPhone: '0987654321',
        scheduledTime: 'Thứ 2, 25/08/2025 lúc 14:00'
      });

      console.log('Order notification test completed');
    } catch (error) {
      console.error('Order notification test failed:', error.message);
    }
  }

  static async testTokenRegistration() {
    console.log('Testing token registration...');
    
    try {
      // Simulate token registration
      const tokenData = {
        token: 'test_fcm_token_' + Date.now(),
        phone: '0123456789',
        platform: 'web',
        deviceInfo: {
          userAgent: 'Mozilla/5.0 Test Browser',
          model: 'Test Device',
          version: '1.0.0'
        }
      };

      const result = await FCMToken.saveToken(tokenData);
      console.log('Token registration test result:', result);

      // Cleanup test token
      await FCMToken.deleteOne({ _id: result._id });
      console.log('Test token cleaned up');
    } catch (error) {
      console.error('Token registration test failed:', error.message);
    }
  }

  static async testTokenCleanup() {
    console.log('Testing token cleanup...');
    
    try {
      const result = await firebaseService.cleanupInvalidTokens();
      console.log('Token cleanup test result:', result);
    } catch (error) {
      console.error('Token cleanup test failed:', error.message);
    }
  }

  static async runAllTests() {
    console.log('🚀 Starting Firebase Notification Service Tests...\n');

    await this.testTokenRegistration();
    console.log('---');
    
    await this.testBasicNotification();
    console.log('---');
    
    await this.testOrderNotification();
    console.log('---');
    
    await this.testTokenCleanup();
    
    console.log('\n✅ All tests completed!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Ensure database connection
  const db = require('../db/connect');
  require('dotenv').config();
  
  db.connect().then(() => {
    console.log('Database connected for testing');
    NotificationTester.runAllTests();
  }).catch(error => {
    console.error('Database connection failed:', error);
  });
}

module.exports = NotificationTester;
