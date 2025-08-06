// Header updater utility
(function() {
    'use strict';

    // Function to update header user info
    function updateHeaderUserInfo() {
        console.log('Updating header user info...');
        
        // Make a request to get current user info
        fetch('/auth/current-user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Received user data:', data);
            updateHeaderElements(data.user);
        })
        .catch(error => {
            console.error('Error updating header:', error);
            // If error, assume user is not logged in
            updateHeaderElements(null);
        });
    }

    // Function to update header DOM elements
    function updateHeaderElements(user) {
        // Find all header menu lists (mobile and desktop)
        const menuLists = document.querySelectorAll('.header-menu__list');
        
        menuLists.forEach(menuList => {
            // Find the last few items (login/register or user name)
            const menuItems = menuList.querySelectorAll('.header-menu__item');
            const lastItems = Array.from(menuItems).slice(-3); // Get last 3 items
            
            // Remove existing user/login items
            lastItems.forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    
                    if (href === '/account' || href === '/account/register' || 
                        href === '/account/detailed' || 
                        text === 'Đăng nhập' || text === 'Đăng kí' || 
                        href.includes('/account/detailed')) {
                        item.remove();
                    }
                }
            });
            
            if (user && user.fullName) {
                // User is logged in - add user menu item
                const userItem = document.createElement('li');
                userItem.className = 'header-menu__item';
                userItem.innerHTML = `<a href="/account/detailed">${user.fullName}</a>`;
                menuList.appendChild(userItem);
            } else {
                // User is not logged in - add login and register items
                const loginItem = document.createElement('li');
                loginItem.className = 'header-menu__item';
                loginItem.innerHTML = '<a href="/account">Đăng nhập</a>';
                
                const registerItem = document.createElement('li');
                registerItem.className = 'header-menu__item';
                registerItem.innerHTML = '<a href="/account/register">Đăng kí</a>';
                
                menuList.appendChild(loginItem);
                menuList.appendChild(registerItem);
            }
        });
    }

    // Listen for custom events that indicate user status change
    window.addEventListener('userStatusChanged', function() {
        updateHeaderUserInfo();
    });

    // Listen for page load events
    window.addEventListener('DOMContentLoaded', function() {
        console.log('Header updater loaded');
        
        // Check if we just came from a login/logout action
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const noti = urlParams.get('noti');
        const refresh = urlParams.get('refresh');
        
        if (refresh === '1' && type && noti && (noti.includes('Đăng nhập thành công') || noti.includes('Đăng xuất thành công'))) {
            console.log('Detected login/logout success with refresh flag');
            
            // Remove the refresh parameter from URL to prevent infinite refresh
            const newURL = new URL(window.location);
            newURL.searchParams.delete('refresh');
            
            // Update the URL without refresh parameter
            window.history.replaceState({}, '', newURL);
            
            // Force header update
            setTimeout(updateHeaderUserInfo, 500);
        }
    });

    // Expose function globally for manual calls
    window.updateHeaderUserInfo = updateHeaderUserInfo;
})();
