// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

class FCMNotificationService {
  constructor() {
    this.messaging = messaging;
    this.vapidKey = 'YOUR_VAPID_KEY'; // Add your VAPID key here
    this.currentToken = null;
    this.notificationToast = null;
  }

  // Initialize notification toast
  initializeToast() {
    if (window.NotificationToast) {
      this.notificationToast = new NotificationToast();
    }
  }

  // Request notification permission
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        return true;
      } else {
        console.log('Notification permission denied.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getToken() {
    try {
      const permission = await this.requestPermission();
      
      if (!permission) {
        throw new Error('Notification permission not granted');
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        console.log('FCM Token:', token);
        this.currentToken = token;
        return token;
      } else {
        throw new Error('No registration token available');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      throw error;
    }
  }

  // Register token with server
  async registerToken(phone, userId = null) {
    try {
      if (!this.currentToken) {
        await this.getToken();
      }

      if (!this.currentToken) {
        throw new Error('No FCM token available');
      }

      const response = await fetch('/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: this.currentToken,
          userId: userId,
          phone: phone,
          platform: 'web'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('Token registered successfully:', result);
      
      // Store token in localStorage for future use
      localStorage.setItem('fcm_token', this.currentToken);
      localStorage.setItem('fcm_phone', phone);
      
      return result;
    } catch (error) {
      console.error('Error registering token:', error);
      throw error;
    }
  }

  // Subscribe to topic
  async subscribeToTopic(topic) {
    try {
      if (!this.currentToken) {
        this.currentToken = localStorage.getItem('fcm_token');
      }

      if (!this.currentToken) {
        throw new Error('No FCM token available');
      }

      const response = await fetch('/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: this.currentToken,
          topic: topic
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('Subscribed to topic successfully:', result);
      return result;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Handle foreground notifications
  setupForegroundListener() {
    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      const { notification, data } = payload;
      
      // Show notification toast
      if (this.notificationToast) {
        this.notificationToast.show('info', notification.body, 8000);
      }
      
      // Handle notification click action
      this.handleNotificationAction(data);
      
      // Show browser notification if page is not in focus
      if (document.hidden && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/icon/logo-removeBg.png',
          badge: '/icon/logo-removeBg.png',
          tag: data.orderId || 'general',
          requireInteraction: true
        });

        browserNotification.onclick = () => {
          window.focus();
          this.handleNotificationAction(data);
          browserNotification.close();
        };
      }
    });
  }

  // Handle notification action based on data payload
  handleNotificationAction(data) {
    if (!data) return;

    switch (data.type) {
      case 'order':
        if (data.orderId) {
          // Navigate to order detail page
          this.navigateToOrderDetail(data.orderId);
        }
        break;
      case 'general':
        if (data.clickAction) {
          window.location.href = data.clickAction;
        }
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // Navigate to order detail page
  navigateToOrderDetail(orderId) {
    const currentPath = window.location.pathname;
    
    // Check if we're already on the order detail page
    if (currentPath.includes(`/request/detail/${orderId}`)) {
      // Refresh the page to get latest data
      window.location.reload();
    } else {
      // Navigate to order detail page
      window.location.href = `/request/detail/${orderId}`;
    }
  }

  // Initialize FCM service
  async initialize(phone, userId = null) {
    try {
      // Initialize toast notification
      this.initializeToast();
      
      // Setup foreground message listener
      this.setupForegroundListener();
      
      // Check if we already have a token
      const storedToken = localStorage.getItem('fcm_token');
      const storedPhone = localStorage.getItem('fcm_phone');
      
      if (storedToken && storedPhone === phone) {
        this.currentToken = storedToken;
        console.log('Using stored FCM token');
      } else {
        // Register new token
        await this.registerToken(phone, userId);
      }
      
      // Subscribe to general notifications
      await this.subscribeToTopic('general');
      
      console.log('FCM service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing FCM service:', error);
      return false;
    }
  }

  // Cleanup on logout
  async cleanup() {
    try {
      if (this.currentToken) {
        // Deactivate token on server
        await fetch('/notifications/token', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: this.currentToken
          })
        });
      }

      // Clear stored data
      localStorage.removeItem('fcm_token');
      localStorage.removeItem('fcm_phone');
      this.currentToken = null;
      
      console.log('FCM service cleaned up');
    } catch (error) {
      console.error('Error cleaning up FCM service:', error);
    }
  }
}

// Global instance
window.FCMService = new FCMNotificationService();

// Auto-initialize if phone number is available
document.addEventListener('DOMContentLoaded', () => {
  // Try to get phone from user session or data attribute
  const userPhone = document.body.dataset.userPhone || 
                   window.userPhone || 
                   localStorage.getItem('user_phone');
  
  const userId = document.body.dataset.userId || 
                window.userId || 
                localStorage.getItem('user_id');

  if (userPhone) {
    window.FCMService.initialize(userPhone, userId);
  }
});

export default FCMNotificationService;
