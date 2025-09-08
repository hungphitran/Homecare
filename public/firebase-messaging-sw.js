// Import các thư viện cần thiết của Firebase
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDvqnWS371a_O-gdNFzBbOYeHrkRaTULAM",
  authDomain: "homecare-a46a5.firebaseapp.com",
  projectId: "homecare-a46a5",
  storageBucket: "homecare-a46a5.firebasestorage.app",
  messagingSenderId: "18882475992",
  appId: "1:18882475992:web:1a398a7348ba785c3da4ad"
};

// Khởi tạo Firebase App
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Xử lý thông báo nền
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Homecare Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/img/testi1.jpg', // Đổi đường dẫn icon phù hợp
    badge: '/img/testi1.jpg',
    tag: 'homecare-notification',
    requireInteraction: true,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Sửa lại xử lý notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Tìm tab đã mở
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Mở tab mới nếu không tìm thấy
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});