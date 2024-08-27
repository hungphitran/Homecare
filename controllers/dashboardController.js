require('dotenv').config()
const dashboardController={
    //GET of dashboard
    show: async (req,res,next)=>{
        let locations;
        let services;
            try{
                //call api to get locations
               locations= await fetch(process.env.API_URL+'/location')
               .then(data=>data.json())
               .then(data=>data)
               
            }
            catch(err){
                console.error(err);
            }
        // give data to dashboard
        res.render('partials/index',{
            locations:locations,
            services:services
        })
    }
}

module.exports= dashboardController;