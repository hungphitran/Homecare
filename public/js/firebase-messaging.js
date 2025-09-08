// !! Quan trọng: Dán lại firebaseConfig của bạn vào đây một lần nữa


const firebaseConfig = {
  apiKey: "AIzaSyDvqnWS371a_O-gdNFzBbOYeHrkRaTULAM",
  authDomain: "homecare-a46a5.firebaseapp.com",
  projectId: "homecare-a46a5",
  storageBucket: "homecare-a46a5.firebasestorage.app",
  messagingSenderId: "18882475992",
  appId: "1:18882475992:web:1a398a7348ba785c3da4ad"
};

// VAPID key (cần lấy từ Firebase Console)
const vapidKey = "BIQ-2exfnxQa9SSmd-xyHXjjhCkLG6FlLARrok0IbGDYWhgB0BgnLArdCbtBvpU15jvnluRVld1G0Nucn1_Npw0"; // Cần thay thế bằng key thực

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Đăng ký service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker đã được đăng ký:', registration);
      messaging.useServiceWorker(registration);
    })
    .catch((error) => {
      console.error('Lỗi đăng ký Service Worker:', error);
    });
}

// Cấu hình API endpoint local thay vì external
const API_BASE_URL = '/'; // Sử dụng API local

// Hàm yêu cầu quyền và lấy token
async function requestPermissionAndGetToken() {
  try {

    if (!getCurrentUserPhone()) {
      console.log('Người dùng chưa đăng nhập, không thể yêu cầu thông báo');
      return null; // Không throw error, return null
    }
    

    console.log('Đang yêu cầu quyền nhận thông báo...');
    
    if (!('Notification' in window)) {
      throw new Error('Trình duyệt không hỗ trợ thông báo');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Người dùng từ chối quyền thông báo');
      // Remove banner nếu user từ chối
      document.getElementById('notification-banner')?.remove();
      throw new Error('Người dùng từ chối quyền thông báo');
    }

    const currentToken = await messaging.getToken({ vapidKey });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      await sendTokenToServer(currentToken);
      localStorage.setItem('fcm_token', currentToken);
      
      // Remove banner sau khi thành công
      document.getElementById('notification-banner')?.remove();
      
      return currentToken;
    } else {
      throw new Error('Không thể lấy được token');
    }
  } catch (error) {
    console.error('Lỗi khi xin quyền hoặc lấy token:', error);
    throw error;
  }
}
// Bạn có thể gọi hàm này khi người dùng nhấn vào một nút nào đó,
// ví dụ: <button onclick="requestPermissionAndGetToken()">Nhận thông báo</button>


// Sửa lại hàm gửi token về server
async function sendTokenToServer(token) {
  try {
    const phone = getCurrentUserPhone(); // Lấy số điện thoại người dùng
    
    if (!phone) {
      console.log('Người dùng chưa đăng nhập, không thể đăng ký thông báo');
      return; // Không throw error, chỉ return
    }

    const response = await fetch(`${API_BASE_URL}/notification/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        phone: phone,
        deviceType: 'web' // Vì đây là web app
      })
    });

    if (!response.ok) {
      throw new Error('Không thể đăng ký token thiết bị');
    }

    const result = await response.json();
    console.log('Token đã được đăng ký thành công:', result.message);
    
    // Lưu thông tin vào localStorage
    localStorage.setItem('fcm_token', token);
    localStorage.setItem('fcm_registered', 'true');
    localStorage.setItem('user_phone', phone);
    
  } catch (error) {
    console.error('Lỗi khi đăng ký token:', error);
    throw error;
  }
}

// Thêm hàm lấy số điện thoại người dùng
function getCurrentUserPhone() {
  // Cách 1: Lấy từ meta tag
  const phoneFromMeta = document.querySelector('meta[name="user-phone"]')?.getAttribute('content');
  if (phoneFromMeta) return phoneFromMeta;
  
  // Cách 2: Lấy từ localStorage
  const phoneFromStorage = localStorage.getItem('user_phone');
  if (phoneFromStorage) return phoneFromStorage;
  
  // Cách 3: Lấy từ session/cookie
  const phoneFromSession = sessionStorage.getItem('user_phone');
  if (phoneFromSession) return phoneFromSession;
  
  // Không prompt user nữa, return null nếu không tìm thấy
  return null;
}

// Thêm hàm kiểm tra trạng thái token
async function checkTokenStatus(phone) {
  try {
    const response = await fetch(`${API_BASE_URL}/notification/check/${phone}`);
    
    if (!response.ok) {
      throw new Error('Không thể kiểm tra trạng thái token');
    }
    
    const result = await response.json();
    console.log('Token status:', result);
    return result;
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra token:', error);
    return null;
  }
}

// Thêm hàm test notification
async function sendTestNotification(phone, title = 'Test', body = 'This is a test notification') {
  try {
    const response = await fetch(`${API_BASE_URL}/notification/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        title: title,
        body: body
      })
    });

    if (!response.ok) {
      throw new Error('Không thể gửi test notification');
    }

    const result = await response.json();
    console.log('Test notification sent:', result.message);
    alert('Test notification đã được gửi!');
    
  } catch (error) {
    console.error('Lỗi khi gửi test notification:', error);
    alert('Lỗi: ' + error.message);
  }
}

// Lắng nghe tin nhắn khi web đang active
messaging.onMessage((payload) => {
  console.log('Message received. ', payload);
  
  // Hiển thị thông báo custom hoặc toast
  showInAppNotification(payload);
});

// Hàm hiển thị thông báo trong app
function showInAppNotification(payload) {
  // Tạo toast notification hoặc modal
  const notification = document.createElement('div');
  notification.className = 'toast-notification';
  notification.innerHTML = `
    <div class="toast-header">
      <strong>${payload.notification?.title || 'Thông báo'}</strong>
      <button type="button" class="close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="toast-body">
      ${payload.notification?.body || 'Bạn có tin nhắn mới'}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Tự động ẩn sau 5 giây
  setTimeout(() => {
    notification.remove();
  }, 5000);
}


// Tự động yêu cầu quyền khi load trang (tùy chọn)
document.addEventListener('DOMContentLoaded', function() {
  initializeNotificationSystem();
});

// Hiển thị banner yêu cầu quyền
function showNotificationPermissionBanner() {
  // Kiểm tra nếu đã có banner rồi thì không tạo nữa
  if (document.getElementById('notification-banner')) {
    return;
  }
  
  // Kiểm tra trạng thái permission của browser
  if ('Notification' in window) {
    if (Notification.permission === 'denied') {
      console.log('User đã từ chối quyền thông báo, không hiển thị banner');
      return;
    }
    
    if (Notification.permission === 'granted') {
      console.log('User đã cho phép thông báo, không cần hiển thị banner');
      return;
    }
  }
  
  // Kiểm tra localStorage xem user đã từ chối banner chưa
  if (localStorage.getItem('notification_banner_dismissed') === 'true') {
    console.log('User đã dismiss banner, không hiển thị lại');
    return;
  }
  
  const banner = document.createElement('div');
  banner.id = 'notification-banner';
  banner.innerHTML = `
    <div class="alert alert-info alert-dismissible">
      <strong>Nhận thông báo</strong> Cho phép nhận thông báo để không bỏ lỡ tin tức quan trọng
      <button type="button" class="btn btn-sm btn-primary ml-2" onclick="enableNotifications()">Cho phép</button>
      <button type="button" class="close" onclick="dismissNotificationBanner()">×</button>
    </div>
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
}

// Hàm được gọi khi user click "Cho phép"
async function enableNotifications() {
  try {
    await requestPermissionAndGetToken();
    document.getElementById('notification-banner')?.remove();
    
    // Hiển thị thông báo thành công và tùy chọn test
    const phone = getCurrentUserPhone();
    const testOption = confirm('Đã bật thông báo thành công! Bạn có muốn test thông báo không?');
    
    if (testOption && phone) {
      await sendTestNotification(phone, 'Chào mừng!', 'Bạn đã đăng ký nhận thông báo thành công!');
    }
    
  } catch (error) {
    alert('Không thể bật thông báo: ' + error.message);
  }
}

// Hàm dismiss banner vĩnh viễn
function dismissNotificationBanner() {
  document.getElementById('notification-banner')?.remove();
  localStorage.setItem('notification_banner_dismissed', 'true');
  console.log('Notification banner dismissed permanently');
}

// Thêm hàm kiểm tra và đồng bộ token khi load trang
async function initializeNotificationSystem() {
  const phone = getCurrentUserPhone();
  const savedToken = localStorage.getItem('fcm_token');
  const savedPhone = localStorage.getItem('user_phone');
  
  // Kiểm tra nếu phone trong localStorage khác với phone từ session
  if (savedPhone && phone && savedPhone !== phone) {
    console.log('Phone changed, clearing old FCM data');
    clearUserDataOnLogout();
    return;
  }
  
  // Nếu không có phone từ session nhưng có data trong localStorage
  if (!phone && (savedToken || savedPhone)) {
    console.log('User logged out, clearing FCM data');
    clearUserDataOnLogout();
    return;
  }
  
  // Chỉ hiển thị banner nếu user đã đăng nhập
  if (!phone) {
    console.log('Người dùng chưa đăng nhập, không khởi tạo hệ thống thông báo');
    return;
  }
  
  // Kiểm tra trạng thái permission trước
  if ('Notification' in window && Notification.permission === 'granted' && savedToken) {
    // Đã có permission và token, kiểm tra với server
    const tokenStatus = await checkTokenStatus(phone);
    
    if (tokenStatus && tokenStatus.tokens.length > 0) {
      const activeToken = tokenStatus.tokens.find(t => t.isActive);
      if (!activeToken || activeToken.token !== savedToken) {
        // Token không khớp, cần đăng ký lại
        console.log('Token không đồng bộ, đăng ký lại...');
        await requestPermissionAndGetToken();
      } else {
        console.log('FCM token đã được đồng bộ với server');
      }
    } else {
      // Chưa có token trên server nhưng đã có permission
      console.log('Chưa có token trên server, đăng ký mới...');
      await requestPermissionAndGetToken();
    }
  } else if ('Notification' in window && Notification.permission === 'default') {
    // Chưa hỏi permission, hiển thị banner
    showNotificationPermissionBanner();
  } else if ('Notification' in window && Notification.permission === 'denied') {
    console.log('User đã từ chối quyền thông báo');
  } else if (!savedToken && Notification.permission === 'granted') {
    // Có permission nhưng chưa có token
    console.log('Có permission nhưng chưa có token, đăng ký mới...');
    await requestPermissionAndGetToken();
  }
}

// Export các hàm để sử dụng global
window.requestPermissionAndGetToken = requestPermissionAndGetToken;
window.enableNotifications = enableNotifications;
window.sendTestNotification = sendTestNotification;
window.checkTokenStatus = checkTokenStatus;

// Thêm hàm cleanup khi logout
function clearUserDataOnLogout() {
  // Clear FCM related data
  localStorage.removeItem('fcm_token');
  localStorage.removeItem('fcm_registered');
  localStorage.removeItem('user_phone');
  
  // Clear session storage
  sessionStorage.removeItem('user_phone');
  
  // Clear banner dismissed state khi logout để user mới có thể thấy banner
  localStorage.removeItem('notification_banner_dismissed');
  
  console.log('User data cleared after logout');
}

// Thêm hàm unregister FCM token
async function unregisterFCMToken(phone, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/notification/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        token: token,
        deviceType: 'web'
      })
    });

    if (response.ok) {
      console.log('FCM token unregistered successfully');
      return true;
    } else {
      console.error('Failed to unregister FCM token');
      return false;
    }
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return false;
  }
}

// Export thêm các hàm mới
window.clearUserDataOnLogout = clearUserDataOnLogout;
window.unregisterFCMToken = unregisterFCMToken;
window.dismissNotificationBanner = dismissNotificationBanner;

// Thêm utility function để reset notification state
function resetNotificationState() {
  localStorage.removeItem('notification_banner_dismissed');
  localStorage.removeItem('fcm_token');
  localStorage.removeItem('fcm_registered');
  console.log('Notification state reset - banner sẽ hiển thị lại lần tới');
}

window.resetNotificationState = resetNotificationState;