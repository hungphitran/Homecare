require('dotenv').config()
const detailedhelperController={
    //get helper with id
    show:async (req,res,next)=>{
        let helper;
        try{
            //call api to get locations
           helper= await fetch(process.env.API_URL+`/helper/`+req.params.id)
           .then(data=>data.json())
           .then(data=>data)
           .catch(err=>console.error(err))
           
        }
        catch(err){
            console.error(err);
        }
        res.render('partials/detailedhelper',{
            helper:helper
        })
    }
}

module.exports=detailedhelperController;