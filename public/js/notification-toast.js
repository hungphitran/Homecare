// Notification Toast System
class NotificationToast {
    constructor() {
        this.createContainer();
    }

    createContainer() {
        // Remove existing container if exists
        const existingContainer = document.getElementById('toast-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create new container
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            font-family: 'Nunito', sans-serif;
        `;
        document.body.appendChild(container);
        this.container = container;
    }

    show(type, message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '⚠',
            warning: '!',
            info: 'ℹ'
        };

        const colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };

        const colorScheme = colors[type] || colors.info;

        toast.style.cssText = `
            background-color: ${colorScheme.bg};
            color: ${colorScheme.color};
            border: 1px solid ${colorScheme.border};
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            position: relative;
            font-size: 14px;
            line-height: 1.4;
        `;

        toast.innerHTML = `
            <span style="
                margin-right: 12px;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: ${colorScheme.color};
                color: ${colorScheme.bg};
                flex-shrink: 0;
            ">${icons[type] || icons.info}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: ${colorScheme.color};
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
        `;

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    remove(toast) {
        if (toast && toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }

    success(message, duration = 5000) {
        return this.show('success', message, duration);
    }

    error(message, duration = 7000) {
        return this.show('error', message, duration);
    }

    warning(message, duration = 6000) {
        return this.show('warning', message, duration);
    }

    info(message, duration = 5000) {
        return this.show('info', message, duration);
    }
}

// Create global instance
window.notificationToast = new NotificationToast();

// Helper functions for backward compatibility
window.showNotification = function(type, message, duration) {
    return window.notificationToast.show(type, message, duration);
};

window.showSuccessNotification = function(message, duration) {
    return window.notificationToast.success(message, duration);
};

window.showErrorNotification = function(message, duration) {
    return window.notificationToast.error(message, duration);
};

// Auto-show notifications based on URL parameters (for redirects)
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const warning = urlParams.get('warning');
    const info = urlParams.get('info');

    if (success) {
        window.notificationToast.success(decodeURIComponent(success));
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }
    if (error) {
        window.notificationToast.error(decodeURIComponent(error));
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }
    if (warning) {
        window.notificationToast.warning(decodeURIComponent(warning));
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }
    if (info) {
        window.notificationToast.info(decodeURIComponent(info));
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }
});
