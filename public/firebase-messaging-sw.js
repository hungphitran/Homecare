// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { notification, data } = payload;
  
  // Customize notification options
  const notificationTitle = notification.title || 'Homecare Notification';
  const notificationOptions = {
    body: notification.body || 'You have a new notification',
    icon: '/icon/logo-removeBg.png',
    badge: '/icon/logo-removeBg.png',
    image: notification.image,
    tag: data.orderId || 'general',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Xem chi tiết',
        icon: '/icon/arrow-top.svg'
      },
      {
        action: 'dismiss',
        title: 'Bỏ qua',
        icon: '/icon/error.svg'
      }
    ],
    data: data // Pass data for click handling
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const { action, data } = event;
  const notificationData = event.notification.data || {};
  
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }
  
  // Handle view action or notification click
  let targetUrl = '/';
  
  if (notificationData.type === 'order' && notificationData.orderId) {
    targetUrl = `/request/detail/${notificationData.orderId}`;
  } else if (notificationData.clickAction) {
    targetUrl = notificationData.clickAction;
  }
  
  // Focus or open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not found, check for any open window of the app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'navigate' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle push event (additional handling if needed)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    const payload = event.data.json();
    console.log('Push payload:', payload);
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});
