require('dotenv').config()


const accountController = {
    //show login page
    showLogin: async (req, res, next) => { 
        if(req.session.phone){
            res.redirect('/account/detailed');
        }
        //render login page
        res.render('pages/login', { layout: false });

    },
    //show login page
    showRegister: async (req, res, next) => {
        if(req.session.phone){
            res.redirect('/account/detailed');
        }
        //render register page
        res.render('pages/register', { layout: false })
    },
    //login and show account
    login: async (req, res, next) => {
        if(req.session.phone){//already logged in
            res.redirect('/account/detailed');
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
                // Save authentication info in session
                req.session.phone = result.user.phone;
                req.session.username = result.user.fullName;
                req.session.accessToken = result.accessToken;
                req.session.refreshToken = result.refreshToken;
                res.redirect('/account/detailed');
            } else {
                console.log("Login failed");
                res.render('pages/login', { layout: false, error: "Thông tin đăng nhập không chính xác" });
            }
        } catch (err) {
            console.error(err);
            res.render('pages/login', { layout: false, error: "Đăng nhập thất bại" });
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
        //format register data according to API
        let registerData = {
            phone: req.body.phone,
            password: req.body.password,
            fullName: req.body.name,
            email: req.body.email
        };

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
                res.status(200).redirect('/account');
            } else {
                let error = await response.json();
                res.render('pages/register', { layout: false, err: error.message || "Đăng ký thất bại" });
            }
        } catch (err) {
            console.error(err);
            res.render('pages/register', { layout: false, err: "Đăng ký thất bại" });
        }
    },
    //show account page
    showDetailed: async (req,res,next)=>{
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
        .then(data => data.json())
        .then(data=>{
            return data
        })        
        .catch(err=>{
            console.error(err);
            res.redirect('/')
        })
        if(user==null){
            res.redirect('/account');
        }
        else if(user.points ==null || user.points.length==0){
            user.points=[{point:0},]//if there's no point, set it to 0;
            
            // Check if addresses exist and have at least one element
            if(user.addresses && user.addresses.length > 0){
                let address = user.addresses[0] //get first address
                user.address = address.detailAddress + " " + address.ward + " " + address.district + ' ' //format address
            } else {
                user.address = '' // Set empty string if no address available
            }
        }
        else if(user.points.length>0){
            
            // Check if addresses exist and have at least one element
            if(user.addresses && user.addresses.length > 0){
                let address = user.addresses[0] //get first address
                user.address = address.detailAddress + " " + address.ward + " " + address.district + ' ' //format address
            } else {
                user.address = '' // Set empty string if no address available
            }
            user.point=user.points[user.points.length-1].point;//format to display only latest point
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

        //get all schedule ids of all requests
        let schedule_ids="";
        
        // Check if requests is array before processing
        if (Array.isArray(requests)) {
            for(let request of requests){
                // Check if request has scheduleIds array
                if (request && Array.isArray(request.scheduleIds)) {
                    for(let id of request.scheduleIds){
                        //concat all schedule ids with "," to query
                        schedule_ids+=id+',';
                    }
                }
            }
        }
        
        let requestDetails = [];
        if (schedule_ids.length > 0) {
            schedule_ids = schedule_ids.slice(0, schedule_ids.length - 1)//eliminate last ","
            //GET call api to get all details with ids on query
            requestDetails = await fetch(process.env.API_URL+'/requestDetail?ids='+schedule_ids)
            .then(data=>data.json())   
            .catch(err=>{
                console.error(err);
                return [];
            })
        }
        
        // Check if requestDetails is array
        if (!Array.isArray(requestDetails)) {
            requestDetails = [];
        }
        
        //match all detail with its request
        let startIndex=0;
        if (Array.isArray(requests)) {
            for(let i=0;i<requests.length;i++){
                if (requests[i]) {
                    //format date
                    let orderDate = requests[i].orderDate;
                    if (orderDate && typeof orderDate === 'string') {
                        requests[i].orderDate = orderDate.slice(0, 10);
                    }
                    requests[i].schedules=[];
                    
                    //get all details of each request
                    if (Array.isArray(requests[i].scheduleIds)) {
                        for(let j=startIndex;j<startIndex+requests[i].scheduleIds.length;j++){
                            try{
                                //format date and status of each detail
                                if (requestDetails[j]) {
                                    requests[i].schedules.push(requestDetails[j]);
                                }
                            }
                            catch(err){
                                console.error(err);
                            }
                        }
                        //update start index
                        startIndex+=requests[i].scheduleIds.length;
                    }
                }
            }
        }

        //format date to display
        if (Array.isArray(requests)) {
            for(let i=0;i<requests.length;i++){
                if (requests[i]) {
                    requests[i].startTime = requests[i].startTime;
                    requests[i].endTime = requests[i].endTime;
                }
            }
        }

        // Ensure requests is array before filtering
        if (!Array.isArray(requests)) {
            requests = [];
        }

        let longTermRequests = requests.filter(request => 
            request && request.requestType && request.requestType.toLowerCase() === "dài hạn"
        );
        let shortTermRequests = requests.filter(request => 
            request && request.requestType && request.requestType.toLowerCase() === "ngắn hạn"
        );
        
        res.render('partials/detailedaccount',{
            user:user,
            longTermRequests:longTermRequests,
            shortTermRequests:shortTermRequests,
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
            oldPassword: req.body.oldPassword, // Assuming form has old password
            newPassword: req.body.password
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
                res.redirect('/account');
            } else {
                res.redirect('/account/changepassword?err=Đổi mật khẩu thất bại');
            }
        } catch (err) {
            console.error(err);
            res.redirect('/account/changepassword?err=Đổi mật khẩu thất bại');
        }
    },
    updateAccount: async (req,res,next) =>{
        console.log("update");
        let account = req.body;
        console.log(account)

        // Server-side validation
        if (!account.name || !account.name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Họ tên không được để trống"
            });
        }

        if (!account.address || !account.address.trim()) {
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
        account.name = account.name.trim();
        account.address = account.address.trim();
        if (account.phone) {
            account.phone = account.phone.trim();
        }

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
            body: JSON.stringify(account)
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
        req.session.destroy();
        res.redirect('/');
    }

}

module.exports = accountController;