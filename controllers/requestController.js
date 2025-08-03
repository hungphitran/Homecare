require('dotenv').config()

const requestController={
        //show order information
    longTermOrder: async (req, res, next) => {
        console.log("req.body in longterm: ",req.query)
        let order = req.query;
        let helpers;
        let services;
        let locations;
        req.query.exp = req.query.exp || 0;

        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
            .catch(err=>console.error(err))
        services = await fetch(process.env.API_URL + '/service')
            .then(data => data.json())
            .catch(err=>console.error(err))
        locations = await fetch(process.env.API_URL+'/location')
            .then(data => data.json())
            .catch(err=>console.error(err))

        res.render('partials/longtermorder', {
            order: order,
            helper: helpers && helpers.length > 0 ? helpers[0] : null,
            helpers:helpers || [],
            locations:locations || [],
            services:services || [],
            layout:false
        });
    },
    //GET redirect to short term order page
    shortTermOrder: async (req, res, next) => {
        console.log("req in shorterm:",req.query)
        
        let order = req.query;
        let helpers;
        let services;
        let locations;
        req.query.exp = req.query.exp || 0;
        console.log(req.query)
        //get all helpers, services, locations
        services = await fetch(process.env.API_URL + '/service')
        .then(data => data.json())
        .catch(err=>console.error(err))
        helpers = await fetch(process.env.API_URL + `/helper`)
        .then(data => data.json())
        .catch(err=>console.error(err))

        //filter helpers by experience, location
        // helpers = helpers.filter(helper=>{
        //     return helper.yearOfExperience >= Number.parseInt(req.query.exp) && helper.jobs.includes(req.query.service)//filter by experience and service
        //     //return helper.workingArea.province === order.province &&helper.workingArea.districts.contains(req.query.district) &&helper.yearOfExperience >= Number.parseInt(req.query.exp);
        // })
        //filter helpers by time off
        // helpers = helpers.filter( async (helper)=>{
        //    let timeOffs = await fetch(process.env.API_URL + `/timeoff/${helper.id}`)//get all time off of each helper
        //    .then(data=>data.json())
        //    .catch(err=>console.error(err))

        //     let isAvailable = true;
        //         timeOffs.forEach(timeOff=>{
        //             if(timeOff.dateOff === order.orderDate //if helper has time off on order date
        //                 && (timeOff.startTime >= order.startTime && timeOff.starTime <= order.endTime)
        //                 && (timeOff.endTime >= order.startTime && timeOff.endTime <= order.endTime)
        //             ){
        //                 isAvailable = false;
        //             }
        //     })
        //     return isAvailable;

        // })

        locations = await fetch(process.env.API_URL+'/location')
        .then(data => data.json())
        .catch(err=>console.error(err))

        
        res.render('partials/shorttermorder', {
            order: order,
            helpers: helpers, 
            services: services,
            locations:locations,
            layout:false
        });
    },
    //GET redirect to detail order page
    submit: async (req, res, next) => {
        //format dates if ordertype is longterm
        if(req.query.requestType == 'Dài hạn'){
            let startDate = new Date(req.query.startDate);
            let endDate = new Date(req.query.endDate);
            let dates = [];
            for(let i=startDate;i<=endDate;i.setDate(i.getDate()+1)){
                dates.push(i.toISOString().split('T')[0])
            }
            req.query.dates = dates;
        }
        else{
            req.query.dates = [req.query.dates]
        }
        req.body.orderDate = Date.now();
        console.log("req.query in submit: ",req.query)

        //get user information if user is logged in
        let user=null;
        try {
            //call api to get current user
            let phone = req.session.phone;
            if(phone){
                // Add authorization header if token exists
                let headers = {
                    'Content-Type': 'application/json'
                };
                
                if (req.session.accessToken) {
                    headers['Authorization'] = `Bearer ${req.session.accessToken}`;
                }

                user = await fetch(process.env.API_URL + '/customer/' + phone, {
                    headers: headers
                })
                .then(data => data.json())
                .catch(err => {
                    console.error('Error fetching user data:', err);
                    return null;
                });

                // Check if user and addresses exist before accessing
                if (user && user.addresses && user.addresses.length > 0) {
                    user.address = user.addresses[0].detailAddress;
                } else {
                    user.address = ''; // Set empty string if no address available
                }
            }
            else{
                user={
                    address: '' // Set default empty address
                }
            }
            
        }
        catch (err) {
            console.error(err);
            user = {
                address: '' // Set default values on error
            };
        }


        //get service information
        let service = await fetch(process.env.API_URL + '/service/' + req.query.service)
            .then(data => data.json())
            .catch(err=>console.error(err))

        //get cost factors
        let costFactorService = await fetch(process.env.API_URL + '/costfactor/service')
        .then(data => data.json())
        .then(data => {
            // Check if data is array and has elements
            if (Array.isArray(data) && data.length > 0) {
                return data[0];
            }
            return null;
        })
        .then(data => {
            if (data && data.coefficientList) {
                return data.coefficientList.find(e => e._id === service.coefficient_id);
            }
            return null;
        })
        .catch(err => {
            console.error('Error fetching cost factor service:', err);
            return null;
        })

        let costFactorOther = await fetch(process.env.API_URL + '/costfactor/other')
        .then(data => data.json())
        .catch(err=>console.error(err))

        let general = await fetch(process.env.API_URL + '/general')
        .then(data => data.json())
        .catch(err=>console.error(err))

        let today= new Date()
        req.query.orderDate = today.getFullYear() + "-"+(today.getMonth()+1>9 ? today.getMonth()+1 : "0"+(today.getMonth()+1)  ) +"-"+today.getDate()

        req.query.totalCost=0;
        
        for(let i=0;i<req.query.dates.length;i++){
            // Handle time format - can be HH:MM or just HH
            let startTime = req.query.startTime ? req.query.startTime.toString() : '00:00';
            let endTime = req.query.endTime ? req.query.endTime.toString() : '00:00';
            
            // If time doesn't contain colon, assume it's just hours and add :00
            if (!startTime.includes(':')) {
                startTime = startTime.padStart(2, '0') + ':00';
            }
            if (!endTime.includes(':')) {
                endTime = endTime.padStart(2, '0') + ':00';
            }
            
            // Validate time format (should be HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime)) {
                console.error('Invalid startTime format:', req.query.startTime);
                continue; // Skip this iteration
            }
            if (!timeRegex.test(endTime)) {
                console.error('Invalid endTime format:', req.query.endTime);
                continue; // Skip this iteration
            }
            
            let startTimeFormatted = startTime + ':00.000Z';
            let endTimeFormatted = endTime + ':00.000Z';
            
            let costData = {
                serviceId: service._id,
                startTime: req.query.dates[i] + 'T' + startTimeFormatted,
                endTime: req.query.dates[i] + 'T' + endTimeFormatted,
                location: {
                    province: req.query.province,
                    district: req.query.district,
                    ward: req.query.ward
                }
            };

            console.log('Sending cost calculation request:', costData);
            console.log('Date validation check:', {
                startTimeString: costData.startTime,
                endTimeString: costData.endTime,
                startTimeDate: new Date(costData.startTime),
                endTimeDate: new Date(costData.endTime),
                isValidStart: !isNaN(new Date(costData.startTime)),
                isValidEnd: !isNaN(new Date(costData.endTime))
            });

            let response= await fetch(process.env.API_URL + '/request/calculateCost',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(costData)
            }).then(data=>data.json())
            .catch(err=>{
                console.error('Error calculating cost:', err);
                return { totalCost: 0 }; // Return default cost on error
            })
            
            if (response && response.totalCost !== undefined) {
                req.query.totalCost += response.totalCost;
            }
        }

        

        //get helper information
        let helper = await fetch(process.env.API_URL + '/helper/'+req.query.helperId)
            .then(data => data.json())
            .then(data => {
                if (data.length > 1) {
                    return {};
                }
                else return data;
            })
            .catch(err=>console.error(err))

        res.render('partials/detailedRequest', {
            customer: user,
            request: req.query,
            helper: helper,
            service: service,
            layout:false
        });
    },
    create: async (req,res,next)=>{
        console.log('Full request body received:', JSON.stringify(req.body, null, 2));
        console.log('Location data specifically:', req.body.location);
        console.log('Location type:', typeof req.body.location);
        
        // Handle time format - can be HH:MM or just HH
        let st = req.body.startTime ? req.body.startTime.toString() : '00:00';
        let et = req.body.endTime ? req.body.endTime.toString() : '00:00';
        
        // If time doesn't contain colon, assume it's just hours and add :00
        if (!st.includes(':')) {
            st = st.padStart(2, '0') + ':00';
        }
        if (!et.includes(':')) {
            et = et.padStart(2, '0') + ':00';
        }
        
        // Validate time format (should be HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(st)) {
            console.error('Invalid startTime format:', req.body.startTime);
            return res.status(400).json({ error: 'Invalid start time format. Expected HH:MM or HH' });
        }
        
        if (!timeRegex.test(et)) {
            console.error('Invalid endTime format:', req.body.endTime);
            return res.status(400).json({ error: 'Invalid end time format. Expected HH:MM or HH' });
        }

        // Check if dates array exists and has elements
        if (!req.body.dates || !Array.isArray(req.body.dates) || req.body.dates.length === 0) {
            console.error('req.body.dates is invalid:', req.body.dates);
            return res.status(400).json({ error: 'Invalid dates provided' });
        }

        // Validate required fields
        if (!req.body.service) {
            console.error('Missing service data');
            return res.status(400).json({ error: 'Service information is required' });
        }

        if (!req.body.customerInfo) {
            console.error('Missing customer info');
            return res.status(400).json({ error: 'Customer information is required' });
        }

        // Ensure location object exists with default values
        if (!req.body.location) {
            req.body.location = { province: '', district: '', ward: '' };
        }

        let dates="";
        for (let i = 0; i < req.body.dates.length; i++){
            console.log(dates)
            dates+=req.body.dates[i]+",";
        }
        req.body.startDate=dates.substring(0,dates.length-1);//remove the last comma

        console.log('Creating request with times:', {
            st: st,
            et: et,
            startTimeFormatted: `${req.body.dates[0]}T${st}:00.000Z`,
            endTimeFormatted: `${req.body.dates[0]}T${et}:00.000Z`,
            dateValidation: {
                isValidStart: !isNaN(new Date(`${req.body.dates[0]}T${st}:00.000Z`)),
                isValidEnd: !isNaN(new Date(`${req.body.dates[0]}T${et}:00.000Z`))
            }
        });

        // Format according to API documentation
        let requestData = {
            service: {
                title: req.body.service?.title || '',
                coefficient_service: Number.parseFloat(req.body.service?.coefficient_service) || 1,
                coefficient_other: Number.parseFloat(req.body.service?.coefficient_other) || 1,
                cost: req.body.service?.cost || 0
            },
            startTime: `${req.body.dates[0]}T${st}:00.000Z`,
            endTime: `${req.body.dates[0]}T${et}:00.000Z`,
            customerInfo: {
                fullName: req.body.customerInfo?.fullName || '',
                phone: req.body.customerInfo?.phone || '',
                address: req.body.customerInfo?.address || '',
                usedPoint: req.body.customerInfo?.usedPoint || 0
            },
            location: {
                province: req.body.location?.province || '',
                district: req.body.location?.district || '',
                ward: req.body.location?.ward || ''
            },
            requestType: req.body.requestType || "regular",
            totalCost: req.body.totalCost
        };

        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (req.session.accessToken) {
            headers['Authorization'] = `Bearer ${req.session.accessToken}`;
        }

        let option={
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        }

        console.log(requestData)

        //create a success notification
        await fetch(process.env.API_URL + '/request', option)
            .then(data => {
                if(data.status === 200 || data.status === 201){
                    return data.json()
                    .then(data=>Promise.resolve(data.message))
                }
                else {
                    console.log(data)
                    return data.json()
                    .then(data=>Promise.reject(data.message))
                }

            })
            .then(data => {
                res.render("pages/notificationpage",{
                    layout:false,
                    noti: "Đặt lịch thành công"+ data
                })
            })
            .catch(err => {
                res.render("pages/notificationpage",{
                    layout:false,
                    noti: err
                })
            })
    },
    cancelOrder: async (req,res,next)=>{
        let orderId = req.body.orderId;
        console.log("order id: ",orderId)

        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (req.session.accessToken) {
            headers['Authorization'] = `Bearer ${req.session.accessToken}`;
        }

        let option={
            method: 'POST',
            headers: headers,
            body: JSON.stringify({id:orderId})
        }
        await fetch(process.env.API_URL + '/request/cancel', option)
        .then(data => {
            console.log(data)
            if(data.status === 200){
                res.status(200).json({message:"Hủy đơn hàng thành công"})
                return data.json()
            }
            else {
                res.status(data.status).json({message:"Hủy đơn hàng thất bại"})
            }
        })
        .catch(err=>{
            res.render("pages/notificationpage",{
                layout:false,
                noti: err
            })
        })
    },
    finishPayment: async (req, res, next) => {
        try {
            console.log("req.body in finish payment: ",req.body)
            let detailId = req.body.detailId;
            if(!detailId){
                res.status(400).json({ message: "Missing detailId" });
            }

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
                body: JSON.stringify({ detailId: detailId })
            };
            await fetch(process.env.API_URL + '/request/finishpayment', option)
                .then(data => {
                    if (data.status === 200) {
                        res.status(200).json({ message: "Payment finished successfully" });
                    }
                    else {
                        res.status(data.status).json({ message: "Payment failed" });
                    }
                })
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error in finish payment" });
        }
    },
    //POST submit review for detail order
    submitReview: async (req, res, next) => {
        try{
            console.log("req.body in review: ",req.body)
            let option={
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body)
            }
            await fetch(process.env.API_URL + '/requestDetail/review', option)
                .then(data => {
                    if(data.status === 200){
                        res.status(200).json({message:"Đánh giá thành công"})
                    }
                    else {
                        res.status(data.status).json({message:"Đánh giá thất bại"})
                    }
                })
                .catch(err=>{
                    res.status(500).json({message:"Error in submit review"})
                })
        }
        catch (err) {
            res.status(500).json({ message: "Error in submit review" });
        }
    }
}
module.exports = requestController;