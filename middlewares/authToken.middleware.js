require('dotenv').config();

const authTokenMiddleware = async (req, res, next) => {
    // Check if user has access token
    if (req.session.accessToken) {
        // Try to use the existing token first
        next();
    } else if (req.session.refreshToken) {
        // Try to refresh the token
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
                req.session.refreshToken = result.refreshToken;
                next();
            } else {
                // Refresh failed, redirect to login
                req.session.destroy();
                res.redirect('/account');
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            req.session.destroy();
            res.redirect('/account');
        }
    } else {
        // No tokens available, redirect to login
        res.redirect('/account');
    }
};

module.exports = authTokenMiddleware;
