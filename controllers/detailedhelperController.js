require('dotenv').config()
const detailedhelperController={
    show:async (req,res,next)=>{
        let id=req.params.id;
        let helper;
        try{
            //call api to get locations
           helper= await fetch(process.env.API_URL+`/helper/${id}`)
           .then(data=>data.json())
           .then(data=>data)
           .catch(err=>console.error(err))
           
        }
        catch(err){
            console.error(err);
        }
        helper.birthDate=helper.birthDate.slice(0,10);
        res.render('partials/detailedhelper',{
            helper:helper
        })
    }
}

module.exports=detailedhelperController;