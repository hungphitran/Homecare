require('dotenv').config()


const accountController = {
    //show notification page
    showNotification: async (req, res, next) => {
        const { type, noti } = req.query;
        res.render('pages/notificationpage', {
            layout: false,
            type: type || 'info',
            noti: noti || 'Thông báo hệ thống'
        });
    },
    //show login page
    showLogin: async (req, res, next) => { 
        if(req.session.phone){
            return res.redirect('/account/detailed');
        }
        //render login page
        return res.render('pages/login', { layout: false });

    },
    //show login page
    showRegister: async (req, res, next) => {
        if(req.session.phone){
            return res.redirect('/account/detailed');
        }
        
        let locations = [];
        try {
            //call api to get locations
            locations = await fetch(process.env.API_URL + '/location')
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching locations:', err);
                    return [];
                });
        } catch (err) {
            console.error(err);
        }
        
        //render register page
        return res.render('pages/register', { 
            layout: false,
            locations: locations 
        })
    },
    //login and show account
    login: async (req, res, next) => {
        if(req.session.phone){//already logged in
            return res.redirect('/account/detailed');
        }

        //call authentication API
        let loginData = {
            phone: req.body.phone,
            password: req.body.password
        };

        let option = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        }

        try {
            let response = await fetch(process.env.API_URL + '/auth/login/customer', option);
            
            if (response.ok) {
                let result = await response.json();
                // Save authentication info in session according to API response format
                req.session.phone = result.user.phone;
                req.session.username = result.user.fullName;
                req.session.accessToken = result.accessToken;
                req.session.refreshToken = result.refreshToken;
                
                // Đăng ký FCM token nếu có
                if (req.body.fcm_token) {
                    option = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            phone: req.session.phone,
                            token: req.body.fcm_token,
                            deviceType: 'web' 
                        })
                    }

                    try {
                        await fetch(process.env.API_URL + '/notification/register', option)
                            .then(data => data.json())
                            .then(data => {
                                console.log('FCM token registered successfully:', data);
                            });
                    } catch (err) {
                        console.error('Error registering FCM token:', err);
                        // Không fail login nếu đăng ký token thất bại
                    }
                }
                
                // Save session before redirect
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                    }
                    // Redirect to home page with success notification and force refresh
                    return res.redirect('/?type=success&noti=' + encodeURIComponent('Đăng nhập thành công! Chào mừng bạn trở lại.') + '&refresh=1');
                });
            } else {
                console.log("Login failed with status:", response.status);
                let errorData = await response.json();
                return res.render('pages/login', { 
                    layout: false, 
                    error: errorData.message || "Thông tin đăng nhập không chính xác" 
                });
            }
        } catch (err) {
            console.error('Login error:', err);
            return res.render('pages/login', { layout: false, error: "Đăng nhập thất bại" });
        }
    },
    //show change password page
    showChangePassword: async( req,res,next)=>{
        res.render('pages/changePassword',
            {
                phone:req.session.user,
                err:req.query.err,
                layout:false
            }
        )
    },

    //handle register
    register: async (req, res, next) => {
        console.log("Register request body:", req.body);
        // Get locations for error cases
        let locations = [];
        try {
            locations = await fetch(process.env.API_URL + '/location')
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching locations:', err);
                    return [];
                });
        } catch (err) {
            console.error(err);
        }

        //format register data according to API
        let registerData = {
            phone: req.body.phone,
            password: req.body.password,
            fullName: req.body.name,
            email: req.body.email,
            address: {
                province: req.body.province,
                ward: req.body.ward,
                detailAddress: req.body.address
            }
        };
        console.log("Register data:", registerData);

        let option = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        }

        try {
            let response = await fetch(process.env.API_URL + '/auth/register/customer', option);
            
            if (response.ok) {
                let result = await response.json();
                // Registration successful, redirect to login page with success notification
                return res.redirect('/account?type=success&noti=' + encodeURIComponent('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.'));
            } else {
                let error = await response.json();
                console.error('Registration failed:', error);
                return res.render('pages/register', { 
                    layout: false, 
                    err: error.message || "Đăng ký thất bại",
                    locations: locations
                });
            }
        } catch (err) {
            console.error('Registration error:', err);
            return res.render('pages/register', { 
                layout: false, 
                err: "Đăng ký thất bại",
                locations: locations
            });
        }
    },
    //show account page
    showDetailed: async (req,res,next)=>{
        // Get locations for address dropdowns
        
        let locations = [];
        try {
            locations = await fetch(process.env.API_URL + '/location')
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching locations:', err);
                    return [];
                });
        } catch (err) {
            console.error('Error fetching locations:', err);
        }

        //GET call api to get user's information with authentication
        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (req.session.accessToken) {
            headers['Authorization'] = `Bearer ${req.session.accessToken}`;
        }

        let user = await fetch(process.env.API_URL + '/customer/' + req.session.phone, {
            headers: headers
        })
        .then(data => {
            if (data.status === 401) {
                // Token expired, middleware should have handled this
                throw new Error('Token expired');
            }
            if (!data.ok) {
                throw new Error(`HTTP error! status: ${data.status}`);
            }
            return data.json();
        })
        .then(data=>{
            return data
        })        
        .catch(err=>{
            console.error('Error fetching user data:', err);
            if (err.message === 'Token expired') {
                // Redirect to login if token expired
                return res.redirect('/account?message=' + encodeURIComponent('Phiên đăng nhập đã hết hạn'));
            }
            return res.redirect('/')
        })
        if(user==null){
            return res.redirect('/account');
        }
        else if(user.points ==null || user.points.length==0){
            user.points=[{point:0},]//if there's no point, set it to 0;
        }

        //GET call api getting all requests which were created by current user
        let requestHeaders = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (req.session.accessToken) {
            requestHeaders['Authorization'] = `Bearer ${req.session.accessToken}`;
        }

        let requests = await fetch(process.env.API_URL + '/request/' + req.session.phone, {
            headers: requestHeaders
        })
        .then(data => data.json())
        .catch(err => {
            console.error(err);
            return [];
        });
        // Process requests data - API already returns schedules array
        if (Array.isArray(requests)) {
            for(let i = 0; i < requests.length; i++) {
                if (requests[i]) {
                    // Format orderDate
                    let orderDate = requests[i].orderDate;
                    if (orderDate && typeof orderDate === 'string') {
                        requests[i].orderDate = orderDate.slice(0, 10);
                    }
                    
                    // Process schedules if they exist
                    if (Array.isArray(requests[i].schedules)) {
                        for(let j = 0; j < requests[i].schedules.length; j++) {
                            let schedule = requests[i].schedules[j];
                            
                            // Format workingDate if it exists
                            if (schedule.workingDate && typeof schedule.workingDate === 'string') {
                                schedule.workingDate = schedule.workingDate.slice(0, 10);
                            }
                            
                            // Add comment field for template compatibility (API doesn't return comment)
                            if (!schedule.comment) {
                                schedule.comment = { review: '' };
                            }
                            
                            // Ensure all required fields exist
                            if (!schedule.status) {
                                schedule.status = 'pending';
                            }
                            if (!schedule.cost) {
                                schedule.cost = 0;
                            }
                        }
                    } else {
                        // If no schedules array, create empty array
                        requests[i].schedules = [];
                    }
                }
            }
        }
        
        // Ensure requests is array before filtering
        if (!Array.isArray(requests)) {
            requests = [];
        }

        // Filter requests based on number of schedules
        // Long term: multiple schedules (multiple days)
        // Short term: single schedule (single day)
        let longTermRequests = requests.filter(request => {
            if (!request || !Array.isArray(request.schedules)) return false;
            return request.schedules.length > 1; // Multiple schedules = long term
        });
        
        let shortTermRequests = requests.filter(request => {
            if(request.status=="waitPayment" && request.totalCost==540000){
                console.log("waitPayment request:",request);
            }
            if (!request || !Array.isArray(request.schedules)) return false;
            return request.schedules.length === 1; // Single schedule = short term

        });
        user.address = user.addresses[0]
        return res.render('partials/detailedaccount',{
            user:user,
            longTermRequests:longTermRequests,
            shortTermRequests:shortTermRequests,
            locations: locations,
            layout:false
        });
    },
    sendotp: async(req,res,next)=>{
        if(req.body.phone){
            let option = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body)
            }
            //POST call api for send sms with otp code
            await fetch(process.env.API_URL+'/message',option)
            .then(()=>res.status(200).end())
            .catch(err=>{
                console.error(err)
            })
        }
        else{
            res.redirect('/account/changepassword?err=số không hợp lệ')
        }
    },
    changePassword: async (req,res,next)=>{
        //Call API to change password with authentication
        let changePasswordData = {
            currentPassword: req.body.currentPassword || req.body.oldPassword,
            newPassword: req.body.newPassword || req.body.password
        };

        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (req.session.accessToken) {
            headers['Authorization'] = `Bearer ${req.session.accessToken}`;
        }

        let option = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(changePasswordData)
        }

        try {
            let response = await fetch(process.env.API_URL + '/auth/change-password', option);
            
            if (response.ok) {
                let result = await response.json();
                return res.status(200).json({
                    success: true,
                    message: "Đổi mật khẩu thành công"
                });
            } else {
                let errorData = await response.json();
                return res.status(response.status).json({
                    success: false,
                    message: errorData.message || "Đổi mật khẩu thất bại"
                });
            }
        } catch (err) {
            console.error('Change password error:', err);
            return res.status(500).json({
                success: false,
                message: "Lỗi server, vui lòng thử lại sau"
            });
        }
    },
    updateAccount: async (req,res,next) =>{
        let account = req.body;
        console.log("datasend",account)

        // Server-side validation
        const fullName = (account.fullName || account.name || '').trim();
        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: "Họ tên không được để trống"
            });
        }

        // Gather address parts from either flat fields or addresses object
        const incomingAddresses = account.addresses;
        let addrObj = {};
        if (incomingAddresses && typeof incomingAddresses === 'object') {
            // If array provided, use first; if object, use directly
            if (Array.isArray(incomingAddresses)) {
                addrObj = incomingAddresses[0] || {};
            } else {
                addrObj = incomingAddresses;
            }
        }
        const detailAddress = account.addresses[0].detailAddress.trim();
        const province = account.addresses[0].province 
        const ward = account.addresses[0].ward
        if (!detailAddress) {
            return res.status(400).json({
                success: false,
                message: "Địa chỉ không được để trống"
            });
        }

        // Phone validation - check if phone exists and is valid format
        // Since phone should not be changeable, we still validate the format but allow existing phone
        if (account.phone && !account.phone.match(/^0\d{9,10}$/)) {
            return res.status(400).json({
                success: false,
                message: "Số điện thoại không hợp lệ (phải có 10-11 số và bắt đầu bằng số 0)"
            });
        }

        // Sanitize input data
        account.fullName = fullName;
        account.address = detailAddress; // normalize for internal usage
        if (account.phone) {
            account.phone = account.phone.trim();
        }
        if (account.email) {
            account.email = account.email.trim();
        }
        
        // Sanitize address components
        account.province = province;
        account.ward = ward;

        // Format data according to API spec
        let updateData = {
            fullName: account.fullName,
            email: account.email || "",
            addresses: [
                {
                    province: account.province || "",
                    ward: account.ward || "",
                    detailAddress: account.address
                }
            ]
        };

        let updateHeaders = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (req.session.accessToken) {
            updateHeaders['Authorization'] = `Bearer ${req.session.accessToken}`;
        }

        let option = {
            method: 'PATCH',
            headers: updateHeaders,
            body: JSON.stringify(updateData)
        }
        
        try {
            //PATCH call api for update customer info
            const response = await fetch(process.env.API_URL + '/customer/' + (req.body.phone || req.session.phone), option);
            
            if (response.ok) {
                res.status(200).json({
                    success: true,
                    message: "Cập nhật thông tin thành công"
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                res.status(response.status).json({
                    success: false,
                    message: errorData.message || "Có lỗi xảy ra khi cập nhật thông tin"
                });
            }
        } catch (err) {
            console.error("Update account error:", err);
            res.status(500).json({
                success: false,
                message: "Lỗi server, vui lòng thử lại sau"
            });
        }

    },
    //handle logout
    logout: async (req, res, next) => {
        // Lấy thông tin FCM token trước khi destroy session
        // const userPhone = req.session.phone;
        // const fcmToken = req.body.fcm_token || req.query.fcm_token;
        
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.redirect('/?type=error&noti=' + encodeURIComponent('Có lỗi xảy ra khi đăng xuất'));
            } else {
                // Redirect với flag để clear localStorage
                return res.redirect('/?type=success&noti=' + encodeURIComponent('Đăng xuất thành công! Hẹn gặp lại bạn.') + '&refresh=1&logout=1');
            }
        });
    }

}

module.exports = accountController;