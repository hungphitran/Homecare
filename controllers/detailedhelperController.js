require('dotenv').config()
const detailedhelperController = {
    //get helper with id
    show: async (req, res, next) => {
        let services;
        let helper;
        let user;
        let requestDetails=[];
        try {
            //call api to get current user
            let phone = req.session.phone; // Changed from req.session.user to req.session.phone
            if (phone) {
                let headers = {
                    'Content-Type': 'application/json'
                };
                
                // Add authorization header if token exists
                if (req.session.accessToken) {
                    headers['Authorization'] = `Bearer ${req.session.accessToken}`;
                }

                user = await fetch(process.env.API_URL + '/customer/' + phone, {
                    headers: headers
                })
                .then(data => data.json())
                .then(data => data)
            }
        }
        catch (err) {
            console.error(err);
        }
        try {
            //call api to get services
            services = await fetch(process.env.API_URL + '/service')
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching services:', err);
                    return []; // Return empty array on error
                });
        }
        catch (err) {
            console.error(err);
            services = []; // Set default value
        }
        try {
            //call api to get helper details
            helper = await fetch(process.env.API_URL + `/helper/` + req.params.id)
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching helper details:', err);
                    return {}; // Return empty object on error
                })
        }
        catch (err) {
            console.error(err);
            helper = {}; // Set default value
        }

        try{
            requestDetails = await fetch(process.env.API_URL + '/requestDetail/helper/' + helper.helper_id)
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error(err);
                    return []; // Return empty array on error
                });
            
            // Check if requestDetails is an array before using slice
            if (Array.isArray(requestDetails)) {
                requestDetails = requestDetails.slice(0, 5);
            } else {
                console.error('requestDetails is not an array:', requestDetails);
                requestDetails = []; // Set to empty array if not an array
            }
        }
        catch(err){
            console.error(err);
            requestDetails = []; // Set to empty array on error
        }

        // Check if helper and services data are valid before processing
        if (helper && Array.isArray(helper.jobs) && Array.isArray(services)) {
            for(let i = 0; i < helper.jobs.length; i++){
                for(let j = 0; j < services.length; j++){
                    if(helper.jobs[i] == services[j]._id){
                        console.log(services[j].title)
                        helper.jobs[i] = services[j].title;
                    }
                }
            }
        } else {
            console.error('Helper jobs or services data is not valid:', {
                helper: helper,
                helperJobs: helper?.jobs,
                services: services
            });
            // Set default values
            if (!helper) helper = {};
            if (!helper.jobs) helper.jobs = [];
            if (!services) services = [];
        }
        
        console.log(requestDetails.length)
        res.render('partials/detailedhelper', {
            user: user,
            helper: helper,
            services: services,
            requestDetails: requestDetails,
            layout: false   
            
        })
    }
}

module.exports = detailedhelperController;