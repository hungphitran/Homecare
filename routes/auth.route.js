// Token verification route for testing purposes
const router = require('express').Router();
const authTokenMiddleware = require('../middlewares/authToken.middleware');

// Route để test token validity
router.get('/verify', authTokenMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: {
            phone: req.session.phone,
            username: req.session.username
        }
    });
});

// Route để manually refresh token (cho client-side calls)
router.post('/refresh', async (req, res) => {
    try {
        if (!req.session.refreshToken) {
            return res.status(401).json({
                error: 'No refresh token',
                message: 'Không có refresh token'
            });
        }

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
            
            if (result.refreshToken) {
                req.session.refreshToken = result.refreshToken;
            }
            
            res.json({
                success: true,
                message: 'Token refreshed successfully'
            });
        } else {
            // Clear invalid tokens
            req.session.destroy();
            res.status(401).json({
                error: 'Token refresh failed',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
            });
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        req.session.destroy();
        res.status(500).json({
            error: 'Server error',
            message: 'Lỗi server khi refresh token'
        });
    }
});

module.exports = router;
