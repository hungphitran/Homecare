require('dotenv').config()
const dashboardController={
    //GET of dashboard
    show: async (req,res,next)=>{
        let locations;
        let services;
        let helpers;
            try{
                //call api to get locations
               locations= await fetch(process.env.API_URL+'/location')
               .then(data=>data.json())
               .then(data=>data)
               
            }
            catch(err){
                console.error(err);
            }

            try{
                //call api to get helpers
               helpers= await fetch(process.env.API_URL+'/helper')
               .then(data=>data.json())
               .then(data=>data)
               
            }
            catch(err){
                console.error(err);
            }
        // give data to dashboard
        res.render('partials/index',{
            locations:locations,
            services:services,
            helpers:helpers
        })
    }
}

module.exports= dashboardController;