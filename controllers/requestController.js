require('dotenv').config()
const { formatDateTimeForAPI } = require('../util/datetime');

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
        // Validate that required parameters exist
        console.log("req.query in submit: ",req.query)
        if (!req.query.service) {
            return res.redirect('/?error=missing_parameters');
        }
        
        // Set default helperId if not provided (skip helper selection)
        if (!req.query.helperId) {
            req.query.helperId = ''; // We'll handle this in the template
        }
        
        //format dates if ordertype is longterm
        if(req.query.requestType == 'Dài hạn'){
            let startDate = new Date(req.query.startDate);
            let endDate = new Date(req.query.endDate);
            
            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.redirect('/?error=invalid_dates');
            }
            
            if (startDate > endDate) {
                return res.redirect('/?error=start_date_after_end_date');
            }
            
            let dates = [];
            let currentDate = new Date(startDate);
            
            // Safer date iteration
            while(currentDate <= endDate){
                dates.push(currentDate.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            req.query.dates = dates;
        }
        else{
            // Handle both array format and string format (from flatpickr multiple mode)
            if (typeof req.query.dates === 'string' && req.query.dates.includes(' :: ')) {
                req.query.dates = req.query.dates.split(' :: ').map(date => date.trim()).filter(date => date);
            } else if (typeof req.query.dates === 'string') {
                req.query.dates = [req.query.dates];
            } else if (!Array.isArray(req.query.dates)) {
                req.query.dates = [req.query.dates];
            }
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

        let idOrTitle = req.query.service;
        //get service information
        let service = await fetch(process.env.API_URL + '/service/' + idOrTitle)
            .then(data => data.json())
            .catch(err=>{
                console.error('Error fetching service:', err);
                return null;
            })

        console.log('Service data received:', service);
        console.log('Service ID from query:', req.query.service);

        // Validate service data - if null, return error or use fallback
        if (!service || !service._id) {
            console.error('Service not found or invalid service data');
            // Try to create a fallback service object
            service = {
                _id: req.query.service, // Use the service query param as fallback
                title: req.query.service || 'Unknown Service',
                cost: 0,
                coefficient_id: null
            };
        }

        //get cost factors
        let costFactorService = null;
        if (service && service.coefficient_id) {
            costFactorService = await fetch(process.env.API_URL + '/costfactor/service')
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
            });
        } else {
            console.log('Service has no coefficient_id, skipping cost factor fetch');
        }

        let costFactorOther = await fetch(process.env.API_URL + '/costfactor/other')
        .then(data => data.json())
        .catch(err=>console.error(err))

        let general = await fetch(process.env.API_URL + '/general')
        .then(data => data.json())
        .catch(err=>console.error(err))

        let today= new Date()
        req.query.orderDate = today.getFullYear() + "-"+(today.getMonth()+1>9 ? today.getMonth()+1 : "0"+(today.getMonth()+1)  ) +"-"+today.getDate()

        req.query.totalCost = 0;
        
        // Improved cost calculation with better validation and batch processing
        try {
            // Handle time format processing once
            let startTime, endTime;
            
            if (req.query.startTime && req.query.startTime.includes('T')) {
                // Full ISO string
                let startDate = new Date(req.query.startTime);
                let endDate = new Date(req.query.endTime);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.error('Invalid ISO datetime strings:', req.query.startTime, req.query.endTime);
                    throw new Error('Invalid time format');
                }
            
                startTime = startDate.getUTCHours().toString().padStart(2, '0') + ':' + 
                           startDate.getUTCMinutes().toString().padStart(2, '0');
                endTime = endDate.getUTCHours().toString().padStart(2, '0') + ':' + 
                         endDate.getUTCMinutes().toString().padStart(2, '0');
            } else {
                // Simple time format
                startTime = req.query.startTime ? req.query.startTime.toString() : '08:00';
                endTime = req.query.endTime ? req.query.endTime.toString() : '17:00';
                
                // If time doesn't contain colon, assume it's just hours and add :00
                if (!startTime.includes(':')) {
                    startTime = startTime.padStart(2, '0') + ':00';
                }
                if (!endTime.includes(':')) {
                    endTime = endTime.padStart(2, '0') + ':00';
                }
            }
            
            // Validate time format (should be HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                console.error('Invalid time format:', startTime, endTime);
                throw new Error('Invalid time format');
            }

            // Process all dates with validated times
            let totalCost = 0;
            const costPromises = req.query.dates.map(async (currentDate, index) => {
                // Validate date format
                if (!/^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
                    console.error('Invalid date format:', currentDate);
                    return 0;
                }
                
                let startTimeFormatted = startTime + ':00';
                let endTimeFormatted = endTime + ':00';
                // Thêm hậu tố 'Z' để chỉ định UTC
                let startTimeString = currentDate + 'T' + startTimeFormatted + 'Z';
                let endTimeString = currentDate + 'T' + endTimeFormatted + 'Z';
                
                // Validate the resulting datetime strings
                let startDateTime = new Date(startTimeString);
                let endDateTime = new Date(endTimeString);
                
                if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                    console.error('Invalid datetime for date:', currentDate);
                    return 0;
                }
                
                // Convert to ISO strings for API compatibility
                let startTimeISO = startDateTime.toISOString();
                let endTimeISO = endDateTime.toISOString();
                
                let costData = {
                    serviceId: service ? service._id : req.query.service,
                    startTime: startTimeISO,
                    endTime: endTimeISO,
                    workDate: currentDate,
                    location: {
                        province: req.query.province,
                        ward: req.query.district
                    }
                };

                console.log(`Cost calc for date ${currentDate}:`, costData);

                // Skip API call if no valid service ID
                if (!costData.serviceId) {
                    console.log('No valid service ID, skipping cost calculation for date:', currentDate);
                    return 0;
                }

                try {
                    let response = await fetch(process.env.API_URL + '/request/calculateCost', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(costData),
                        timeout: 10000 // Add 10 second timeout
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API returned ${response.status}`);
                    }
                    
                    let result = await response.json();
                    return result.totalCost || 0;
                } catch (err) {
                    console.error(`Error calculating cost for date ${currentDate}:`, err);
                    // Return a basic fallback cost calculation if API fails
                    console.log('Using fallback cost calculation...');
                    return calculateFallbackCost(startDateTime, endDateTime, service);
                }
            });

            // Wait for all cost calculations and sum them up
            const costs = await Promise.all(costPromises);
            req.query.totalCost = costs.reduce((sum, cost) => sum + cost, 0);
            
            console.log('Total cost calculated:', req.query.totalCost);
            
        } catch (error) {
            console.error('Error in cost calculation process:', error);
            req.query.totalCost = calculateBasicFallbackCost(req.query.dates, service); // Fallback calculation
        }

        // Helper function for fallback cost calculation
        function calculateFallbackCost(startDateTime, endDateTime, service) {
            try {
                const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);
                const baseCostPerHour = service && service.cost ? service.cost : 50000; // Default 50k VND per hour
                return Math.round(hours * baseCostPerHour);
            } catch (err) {
                console.error('Error in fallback cost calculation:', err);
                return 100000; // Default 100k VND per day
            }
        }

        // Helper function for basic fallback when all else fails
        function calculateBasicFallbackCost(dates, service) {
            const baseCostPerDay = service && service.cost ? service.cost : 100000; // Default 100k VND per day
            return dates.length * baseCostPerDay;
        }

        

        //get helper information
        let helper = {};
        if (req.query.helperId && req.query.helperId !== 'default') {
            helper = await fetch(process.env.API_URL + '/helper/'+req.query.helperId)
                .then(data => data.json())
                .then(data => {
                    if (data.length > 1) {
                        return {};
                    }
                    else return data;
                })
                .catch(err => {
                    console.error(err);
                    return {};
                });
        }
        // Fetch locations list (provinces/districts/wards) for dynamic ward dropdown
        let locations = [];
        try {
            locations = await fetch(process.env.API_URL + '/location')
                .then(d => d.json());
        } catch (e) {
            console.error('Failed to fetch locations for detailedRequest page:', e);
        }
        req.query.ward = req.query.district || '';

        res.render('partials/detailedRequest', {
            customer: user,
            request: req.query,
            helper: helper,
            service: service || { title: '', _id: '', cost: 0 },
            locations: locations || [],
            layout:false
        });
    },
    create: async (req,res,next)=>{
        console.log('Full request body received:', JSON.stringify(req.body, null, 2));
        console.log('Location data specifically:', req.body.location);
        console.log('Location type:', typeof req.body.location);
        
        // Validate that dates array exists and is not empty
        // Handle both array format and string format (from flatpickr multiple mode)
        let datesArray = [];
        if (req.body.dates) {
            if (Array.isArray(req.body.dates)) {
                datesArray = req.body.dates;
            } else if (typeof req.body.dates === 'string') {
                // Handle flatpickr multiple mode format (dates separated by " :: ")
                datesArray = req.body.dates.split(' :: ').map(date => date.trim()).filter(date => date);
            }
        }
        
        if (datesArray.length === 0) {
            console.error('No valid dates provided:', req.body.dates);
            return res.status(400).json({ error: 'Invalid dates provided' });
        }
        
        // Replace req.body.dates with the properly formatted array
        req.body.dates = datesArray;
        console.log('Processed dates array:', req.body.dates);
        
        // Handle time format - can be HH:MM, just HH, or full ISO string
        let st, et;
        
        // Check if startTime and endTime are full ISO strings or just time
        if (req.body.startTime && req.body.startTime.includes('T')) {
            // Full ISO string like "2025-08-09T06:30:00.000Z"
            let startDate = new Date(req.body.startTime);
            let endDate = new Date(req.body.endTime);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error('Invalid ISO datetime strings:', req.body.startTime, req.body.endTime);
                return res.status(400).json({ error: 'Invalid datetime format' });
            }
            
            // Extract time components from ISO string
            st = startDate.getUTCHours().toString().padStart(2, '0') + ':' + 
                 startDate.getUTCMinutes().toString().padStart(2, '0');
            et = endDate.getUTCHours().toString().padStart(2, '0') + ':' + 
                 endDate.getUTCMinutes().toString().padStart(2, '0');
                 
            console.log('Extracted times from ISO strings:', { st, et });
        } else {
            // Simple time format like "06:30" or "6"
            st = req.body.startTime ? req.body.startTime.toString() : '00:00';
            et = req.body.endTime ? req.body.endTime.toString() : '00:00';
            
            // If time doesn't contain colon, assume it's just hours and add :00
            if (!st.includes(':')) {
                st = st.padStart(2, '0') + ':00';
            }
            if (!et.includes(':')) {
                et = et.padStart(2, '0') + ':00';
            }
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

        // Check if dates array exists and has elements (already validated above)
        if (!req.body.dates || !Array.isArray(req.body.dates) || req.body.dates.length === 0) {
            console.error('req.body.dates is invalid after processing:', req.body.dates);
            return res.status(400).json({ error: 'Invalid dates provided after processing' });
        }

        // Validate required fields
        if (!req.body.service && !req.body.service_id) {
            console.error('Missing service data');
            return res.status(400).json({ error: 'Service information is required' });
        }

        if (!req.body.customerInfo) {
            console.error('Missing customer info');
            return res.status(400).json({ error: 'Customer information is required' });
        }

        // Handle service data - could be string (title) or object
        let serviceData;
        if (typeof req.body.service === 'string') {
            // If service is sent as title string, create service object
            serviceData = {
                title: req.body.service,
                _id: req.body.service_id || '',
                coefficient_service: 1,
                cost: 0
            };
        } else if (typeof req.body.service === 'object') {
            // If service is already an object
            serviceData = req.body.service;
        } else {
            // Parse JSON string if needed
            try {
                serviceData = JSON.parse(req.body.service);
            } catch (e) {
                serviceData = {
                    title: req.body.service || '',
                    _id: req.body.service_id || '',
                    coefficient_service: 1,
                    coefficient_other: 1,
                    cost: 0
                };
            }
        }

        // Handle customerInfo - could be JSON string or object
        let customerInfoData;
        if (typeof req.body.customerInfo === 'string') {
            try {
                customerInfoData = JSON.parse(req.body.customerInfo);
            } catch (e) {
                console.error('Error parsing customerInfo JSON:', e);
                customerInfoData = {
                    fullName: '',
                    phone: '',
                    address: '',
                    usedPoint: 0
                };
            }
        } else if (typeof req.body.customerInfo === 'object') {
            customerInfoData = req.body.customerInfo;
        } else {
            customerInfoData = {
                fullName: '',
                phone: '',
                address: '',
                usedPoint: 0
            };
        }

        // Ensure location object exists with default values
        if (!req.body.location) {
            req.body.location = { 
                province: req.body.province || '', 
                ward: req.body.ward || '' 
            };
        }

        let dates="";
        for (let i = 0; i < req.body.dates.length; i++){
            console.log(dates)
            dates+=req.body.dates[i]+",";
        }
        req.body.startDate=dates.substring(0,dates.length-1);//remove the last comma

        // Validate and format the first date
        let firstDate = req.body.dates[0];
        
        // Ensure date is in YYYY-MM-DD format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDate)) {
            console.error('Invalid date format:', firstDate);
            return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
        }

        // Create properly formatted datetime strings
        // Parse the time components properly
        let [startHour, startMinute] = st.split(':').map(num => parseInt(num));
        let [endHour, endMinute] = et.split(':').map(num => parseInt(num));
        
        // Create Date objects with explicit components to avoid timezone issues
        let startDateTime = new Date(firstDate + 'T00:00:00.000Z');
        startDateTime.setUTCHours(startHour, startMinute, 0, 0);
        
        let endDateTime = new Date(firstDate + 'T00:00:00.000Z');
        endDateTime.setUTCHours(endHour, endMinute, 0, 0);
        
        // Validate that the resulting dates are valid
        if (isNaN(startDateTime.getTime())) {
            console.error('Invalid start datetime:', {
                firstDate,
                st,
                startHour,
                startMinute,
                startDateTime
            });
            return res.status(400).json({ error: 'Invalid start date/time combination' });
        }
        
        if (isNaN(endDateTime.getTime())) {
            console.error('Invalid end datetime:', {
                firstDate,
                et,
                endHour,
                endMinute,
                endDateTime
            });
            return res.status(400).json({ error: 'Invalid end date/time combination' });
        }
        
        // Get ISO strings in UTC format
        let startTimeISO = startDateTime.toISOString();
        let endTimeISO = endDateTime.toISOString();
        
        // Try different formats for API compatibility
        let startTimeLocal = `${firstDate}T${st}:00`; // Local time without Z
        let endTimeLocal = `${firstDate}T${et}:00`; // Local time without Z
        
        console.log('Testing different datetime formats:', {
            isoFormat: { start: startTimeISO, end: endTimeISO },
            localFormat: { start: startTimeLocal, end: endTimeLocal },
            dateOnly: firstDate,
            timeOnly: { start: st, end: et }
        });

        console.log('Creating request with times:', {
            originalStartTime: req.body.startTime,
            originalEndTime: req.body.endTime,
            processedSt: st,
            processedEt: et,
            firstDate: firstDate,
            finalStartTime: startTimeISO,
            finalEndTime: endTimeISO,
            startTimeFormatted: startTimeLocal,
            endTimeFormatted: endTimeLocal,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            dateValidation: {
                isValidStart: !isNaN(startDateTime.getTime()),
                isValidEnd: !isNaN(endDateTime.getTime())
            }
        });

        // Format according to API documentation
        // Try local time format instead of UTC
        let requestData = {
            service: {
                title: serviceData.title || '',
                coefficient_service: Number.parseFloat(serviceData.coefficient_service) || 1,
                coefficient_other: Number.parseFloat(serviceData.coefficient_other) || 1,
                cost: serviceData.cost || 0
            },
            startTime: startTimeLocal+'.000', // Try local format first
            endTime: endTimeLocal+'.000', // Try local format first
            startDate: req.body.startDate, // Add startDate for API compatibility
            customerInfo: {
                fullName: customerInfoData.fullName || '',
                phone: customerInfoData.phone || '',
                address: customerInfoData.address || '',
                usedPoint: customerInfoData.usedPoint || 0
            },
            location: {
                province: req.body.province || '',
                ward: req.body.ward || ''
            },
            requestType: req.body.requestType || "Ngắn hạn",
            totalCost: req.body.totalCost,
            helperId: req.body.helperId || req.body.helper_id || "" // Add helperId for API compatibility
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

        console.log('Request data being sent to API:', JSON.stringify(requestData, null, 2));
        console.log('Service data being sent:', JSON.stringify(requestData.service, null, 2));

        //create a success notification
        async function tryApiRequest(timeFormat) {
            const testRequestData = {
                ...requestData,
                startTime: timeFormat.start,
                endTime: timeFormat.end
            };
            
            const response = await fetch(process.env.API_URL + '/request', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(testRequestData)
            });
            
            return { response, format: timeFormat.name };
        }

        // Try different time formats
        const timeFormats = [
            { 
                name: 'local', 
                start: formatDateTimeForAPI(firstDate, st, 'local'), 
                end: formatDateTimeForAPI(firstDate, et, 'local') 
            },
            { 
                name: 'vietnam', 
                start: formatDateTimeForAPI(firstDate, st, 'vietnam'), 
                end: formatDateTimeForAPI(firstDate, et, 'vietnam') 
            },
            { 
                name: 'iso', 
                start: formatDateTimeForAPI(firstDate, st, 'iso'), 
                end: formatDateTimeForAPI(firstDate, et, 'iso') 
            },
            { 
                name: 'simple', 
                start: st, 
                end: et 
            },
            { 
                name: 'timestamp', 
                start: formatDateTimeForAPI(firstDate, st, 'timestamp'), 
                end: formatDateTimeForAPI(firstDate, et, 'timestamp') 
            }
        ];

        let lastError = null;
        let success = false;

        for (const timeFormat of timeFormats) {
            try {
                console.log(`Trying time format: ${timeFormat.name}`, { start: timeFormat.start, end: timeFormat.end });
                
                const { response, format } = await tryApiRequest(timeFormat);
                
                console.log(`API Response for ${format} format - status:`, response.status);
                
                if (response.status === 200 || response.status === 201) {
                    const responseText = await response.text();
                    console.log(`Success with ${format} format:`, responseText);
                    
                    res.render("pages/notificationpage", {
                        layout: false,
                        noti: "Đặt lịch thành công"
                    });
                    success = true;
                    break;
                } else {
                    const errorText = await response.text();
                    console.log(`Failed with ${format} format:`, errorText);
                    lastError = errorText;
                }
            } catch (err) {
                console.error(`Error with ${timeFormat.name} format:`, err);
                lastError = err.message || err;
            }
        }

        if (!success) {
            console.error('All time formats failed. Last error:', lastError);
            let errorMessage = "Đặt lịch thất bại";
            if (lastError) {
                if (typeof lastError === 'string') {
                    try {
                        const parsedError = JSON.parse(lastError);
                        errorMessage += ": " + (parsedError.message || parsedError.error || lastError);
                    } catch (e) {
                        errorMessage += ": " + lastError;
                    }
                } else {
                    errorMessage += ": " + (lastError.message || lastError.error || lastError);
                }
            }
            
            res.render("pages/notificationpage", {
                layout: false,
                noti: errorMessage
            });
        }
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
            console.log('Cancel response status:', data.status)
            if(data.status === 200){
                return data.text()
                .then(responseText => {
                    // API trả về "success" string
                    if (responseText === "success") {
                        res.status(200).json({message:"Hủy đơn hàng thành công"})
                    } else {
                        try {
                            const jsonResponse = JSON.parse(responseText);
                            res.status(200).json({message: jsonResponse.message || "Hủy đơn hàng thành công"})
                        } catch (e) {
                            res.status(200).json({message:"Hủy đơn hàng thành công"})
                        }
                    }
                })
            }
            else {
                return data.json()
                .then(errorData => {
                    res.status(data.status).json({message: errorData.message || "Hủy đơn hàng thất bại"})
                })
            }
        })
        .catch(err=>{
            console.error('Error canceling order:', err);
            res.status(500).json({message: "Hủy đơn hàng thất bại: " + err})
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
                        return data.text()
                        .then(responseText => {
                            // API trả về "Success" string
                            if (responseText === "Success") {
                                res.status(200).json({ message: "Payment finished successfully" });
                            } else {
                                try {
                                    const jsonResponse = JSON.parse(responseText);
                                    res.status(200).json({ message: jsonResponse.message || "Payment finished successfully" });
                                } catch (e) {
                                    res.status(200).json({ message: "Payment finished successfully" });
                                }
                            }
                        })
                    }
                    else {
                        return data.text()
                        .then(errorText => {
                            res.status(data.status).json({ message: errorText || "Payment failed" });
                        })
                    }
                })
                .catch(fetchErr => {
                    console.error('Fetch error:', fetchErr);
                    res.status(500).json({ message: "Payment failed: " + fetchErr.message });
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
            
            // Ensure proper format according to API spec
            let reviewData = {
                detailId: req.body.detailId,
                comment: {
                    review : req.body.review || "",
                    lostThings : req.body.lostThings || "",
                    breakThings : req.body.breakThings || ""
                },
                rating: req.body.rating || 5
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
                body: JSON.stringify(reviewData)
            }
            await fetch(process.env.API_URL + '/requestDetail/review', option)
                .then(data => {
                    if(data.status === 200){
                        return data.text()
                        .then(responseText => {
                            // API trả về "success" string
                            if (responseText === "success") {
                                res.status(200).json({message:"Đánh giá thành công"})
                            } else {
                                try {
                                    const jsonResponse = JSON.parse(responseText);
                                    res.status(200).json({message: jsonResponse.message || "Đánh giá thành công"})
                                } catch (e) {
                                    res.status(200).json({message:"Đánh giá thành công"})
                                }
                            }
                        })
                    }
                    else {
                        return data.text()
                        .then(errorText => {
                            res.status(data.status).json({message: errorText || "Đánh giá thất bại"})
                        })
                    }
                })
                .catch(err=>{
                    console.error('Error submitting review:', err);
                    res.status(500).json({message:"Error in submit review: " + err.message})
                })
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error in submit review: " + err.message });
        }
    }
}
module.exports = requestController;