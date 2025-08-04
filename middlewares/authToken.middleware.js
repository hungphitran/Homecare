require('dotenv').config();

const authTokenMiddleware = async (req, res, next) => {
    try {
        // Check if user has access token
        if (req.session.accessToken) {
            // Verify token is still valid by making a test request
            try {
                const verifyResponse = await fetch(process.env.API_URL + '/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${req.session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (verifyResponse.ok) {
                    // Token is valid, proceed
                    return next();
                } else if (verifyResponse.status === 401) {
                    // Token expired, try to refresh
                    console.log('Access token expired, attempting refresh...');
                    return await refreshTokenHandler(req, res, next);
                } else {
                    // Other error, try refresh anyway
                    return await refreshTokenHandler(req, res, next);
                }
            } catch (verifyError) {
                console.log('Token verification failed, attempting refresh...');
                return await refreshTokenHandler(req, res, next);
            }
        } else if (req.session.refreshToken) {
            // No access token but have refresh token
            return await refreshTokenHandler(req, res, next);
        } else {
            // No tokens available
            return redirectToLogin(req, res);
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return await refreshTokenHandler(req, res, next);
    }
};

const refreshTokenHandler = async (req, res, next) => {
    if (!req.session.refreshToken) {
        return redirectToLogin(req, res);
    }

    try {
        const response = await fetch(process.env.API_URL + '/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken: req.session.refreshToken
            })
        });

        if (response.ok) {
            const result = await response.json();
            req.session.accessToken = result.accessToken;
            
            // Update refresh token if provided (some systems rotate refresh tokens)
            if (result.refreshToken) {
                req.session.refreshToken = result.refreshToken;
            }
            
            console.log('Token refreshed successfully');
            return next();
        } else {
            const errorData = await response.text();
            console.error('Token refresh failed:', response.status, errorData);
            return redirectToLogin(req, res);
        }
    } catch (error) {
        console.error('Token refresh request failed:', error);
        return redirectToLogin(req, res);
    }
};

const redirectToLogin = (req, res) => {
    // Clear session data
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
        }
    });

    // Handle AJAX requests differently
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(401).json({
            error: 'Token expired',
            message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
            redirectUrl: '/account'
        });
    } else {
        return res.redirect('/account?message=' + encodeURIComponent('Phiên đăng nhập đã hết hạn'));
    }
};

module.exports = authTokenMiddleware;

module.exports = authTokenMiddleware;
