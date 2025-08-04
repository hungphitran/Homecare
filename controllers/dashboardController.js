const { Value } = require('sass');

require('dotenv').config()
const dashboardController = {
    //GET of dashboard
    show: async (req, res, next) => {
        let locations=[];
        let services=[];
        let helpers=[];
        let user;
        let general;
        let policies=[];
        let questions=[];
        let costFactors=[];
        try {
            //call api to get current user
            let phone = req.session.phone;
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
            //call api to get locations
            locations = await fetch(process.env.API_URL + '/location')
                .then(data => data.json())
                .then(data => data)

        }
        catch (err) {
            console.error(err);
        }
        try {
            //call api to get costFactors
            costFactors = await fetch(process.env.API_URL + '/costFactor/service')
                .then(data => data.json())
                .then(data => {
                    // Check if data is array and has elements
                    if (Array.isArray(data) && data.length > 0 && data[0].coefficientList) {
                        return data[0].coefficientList;
                    }
                    return [];
                })
                .catch(err => {
                    console.error('Error fetching cost factors:', err);
                    return [];
                });
        }
        catch (err) {
            console.error(err);
            costFactors = [];
        }
        try {
            //call api to get services
            services = await fetch(process.env.API_URL + '/service')
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching services:', err);
                    return [];
                });
            
            // Check if services and costFactors are arrays before processing
            if (Array.isArray(services) && Array.isArray(costFactors)) {
                for(let i=0;i<services.length ;i++){
                    if (services[i] && services[i].coefficient_id) {
                        let coefficient=costFactors.filter((factor=>{
                            return factor && factor._id == services[i].coefficient_id;
                        }))
                        // Check if coefficient found before accessing [0]
                        if (coefficient.length > 0) {
                            services[i].coefficient = coefficient[0].value;
                        } else {
                            services[i].coefficient = 1; // Default value
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error(err);
            services = [];
        }
        try {
            //call api to get helpers
            helpers = await fetch(process.env.API_URL + '/helper')
                .then(data => data.json())
                .then(data => data)
                .catch(err => {
                    console.error('Error fetching helpers:', err);
                    return [];
                });
            
            // Check if helpers is array before using slice
            if (Array.isArray(helpers)) {
                helpers = helpers.slice(0,5);
            } else {
                helpers = [];
            }
        }
        catch (err) {
            console.error(err);
            helpers = [];
        }

        try {
            //call api to get general information
            general = await fetch(process.env.API_URL + '/general')
                .then(data => data.json())
                .then(data => data)

        }
        catch (err) {
            console.error(err);
        }

        try{
            //call api to get policies
            policies = await fetch(process.env.API_URL+'/policy')
            .then(data=>data.json())

            for(let policy of policies){
                let contents = policy.content.split('\n');
                policy.contents = contents;
            }
        }
        catch(err){
            console.error(err);
        }

        
        try{
            //call api to get question
            questions = await fetch(process.env.API_URL+'/question')
            .then(data=>data.json())
            
            for(let question of questions){
                let answers = question.answer.split('\n');
                question.answers = answers;
            }
        }
        catch(err){
            console.error(err);

        }
        // give data to dashboard
        res.render('partials/index', {
            user: user,
            locations: locations,
            services: services,
            helpers: helpers,
            general: general,
            policies:policies,
            questions:questions
        })
    }
}

module.exports = dashboardController;