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
            let phone = req.session.user;
            user = await fetch(process.env.API_URL + '/customer/' + phone)
                .then(data => data.json())
                .then(data => data)
        }
        catch (err) {
            console.error(err);
        }
        try {
            //call api to get services
            services = await fetch(process.env.API_URL + '/service')
                .then(data => data.json())
                .then(data => data)
        }
        catch (err) {
            console.error(err)
        }
        try {
            //call api to get locations
            helper = await fetch(process.env.API_URL + `/helper/` + req.params.id)
                .then(data => data.json())
                .then(data => data)
                .catch(err => console.error(err))
        }
        catch (err) {
            console.error(err);
        }

        try{
            requestDetails = await fetch(process.env.API_URL + '/requestDetail/helper/' + helper._id)
                .then(data => data.json())
                .then(data => data)
                .catch(err => console.error(err))
            requestDetails = requestDetails.slice(0, 5);
        }
        catch(err){
            console.error(err);
        }

        for(let i = 0; i < helper.jobs.length; i++){
            for(let j = 0; j < services.length; j++){
                if(helper.jobs[i] == services[j]._id){
                    console.log(services[j].title)
                    helper.jobs[i] = services[j].title;
                }
            }
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