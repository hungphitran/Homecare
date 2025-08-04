// Token expiration handler
(function() {
    'use strict';

    // Check for token expiration messages
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message && message.includes('hết hạn')) {
        // Hiển thị thông báo token hết hạn
        showTokenExpiredNotification(message);
    }

    // Global error handler cho tất cả AJAX requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args)
            .then(response => {
                if (response.status === 401) {
                    return response.json()
                        .then(data => {
                            if (data.error === 'Token expired' || data.message.includes('hết hạn')) {
                                handleTokenExpiration(data);
                            }
                            throw new Error(data.message || 'Unauthorized');
                        })
                        .catch(jsonError => {
                            // Nếu response không phải JSON, vẫn xử lý như token expired
                            handleTokenExpiration({
                                message: 'Phiên đăng nhập đã hết hạn'
                            });
                            throw new Error('Unauthorized');
                        });
                }
                return response;
            })
            .catch(error => {
                // Log error for debugging
                console.error('Fetch error:', error);
                throw error;
            });
    };

    // Handle token expiration
    function handleTokenExpiration(data) {
        // Ngăn multiple redirects
        if (window.location.pathname === '/account') {
            return;
        }

        // Show notification
        showTokenExpiredNotification(data.message);

        // Redirect sau một chút để user có thể đọc thông báo
        setTimeout(() => {
            window.location.href = data.redirectUrl || '/account?message=' + encodeURIComponent(data.message);
        }, 2000);
    }

    // Show token expired notification
    function showTokenExpiredNotification(message) {
        // Tạo notification element
        const notification = document.createElement('div');
        notification.className = 'token-expired-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .token-expired-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: Arial, sans-serif;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-icon {
                font-size: 20px;
            }
            .notification-message {
                flex: 1;
                font-size: 14px;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        // Add to page
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Intercept form submissions để handle token expiration
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.method.toLowerCase() === 'post') {
            // Add loading state
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent || submitBtn.value;
                submitBtn.textContent = 'Đang xử lý...';
                
                // Re-enable sau 10 giây nếu không có response
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 10000);
            }
        }
    });

    // Auto-refresh token trước khi hết hạn (nếu có API endpoint)
    function scheduleTokenRefresh() {
        // Chỉ chạy nếu user đã login
        if (document.body.classList.contains('logged-in') || 
            window.location.pathname.includes('/account/detailed') ||
            window.location.pathname.includes('/account/changepassword') ||
            window.location.pathname.includes('/request')) {
            
            // Refresh token mỗi 45 phút (giả sử token có thời gian sống 1 giờ)
            setInterval(async () => {
                try {
                    // Call server endpoint that uses authToken middleware
                    const response = await fetch('/account/detailed', {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest' // Để server biết đây là AJAX request
                        }
                    });
                    
                    if (!response.ok && response.status === 401) {
                        console.log('Token refresh failed, user will need to login again');
                        const data = await response.json().catch(() => ({}));
                        handleTokenExpiration(data);
                    } else {
                        console.log('Token verification/refresh successful');
                    }
                } catch (error) {
                    console.error('Auto token refresh failed:', error);
                }
            }, 45 * 60 * 1000); // 45 minutes
        }
    }

    // Start auto-refresh
    scheduleTokenRefresh();

})();
