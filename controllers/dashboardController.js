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
            user = await fetch(process.env.API_URL + '/customer/' + phone)
                .then(data => data.json())
                .then(data => data)
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
            costFactors = await fetch(process.env.API_URL + '/costfactor/service')
                .then(data => data.json())
                .then(data => data[0].coefficientList)
        }
        catch (err) {
            console.error(err)
        }
        try {
            //call api to get services
            services = await fetch(process.env.API_URL + '/service')
                .then(data => data.json())
                .then(data => data)
            for(let i=0;i<services.length ;i++){
                let coefficient=costFactors.filter((factor=>{
                    return factor._id ==services[i].coefficient_id;
                }))
                services[i].coefficient = coefficient[0].value;
            }
        }
        catch (err) {
            console.error(err)
        }
        try {
            //call api to get helpers
            helpers = await fetch(process.env.API_URL + '/helper')
                .then(data => data.json())
                .then(data => data)
            helpers=helpers.slice(0,5) 
        }
        catch (err) {
            console.error(err);
        }

        try {
            //call api to get general information
            general = await fetch(process.env.API_URL + '/general')
                .then(data => data.json())
                .then(data => data[0])

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