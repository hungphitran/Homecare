require('dotenv').config()
const shorttermController ={
    filter: async (req,res,next)=>{
        let order=req.body;
        let helpers;
        helpers=await fetch(process.env.API_URL+`/helper`)
        .then(data=>data.json())
        .then(data=>data)
        res.render('partials/shorttermorder',{order:order,helpers:helpers});
    },
    submit: async (req,res,next)=>{
        req.body.type="shortTerm";
        let service= await fetch(process.env.API_URL+'/service/'+req.body.service)
        .then(data=>data.json())
        req.body.fee=service.basicPrice
        req.body.service_id=service._id

        let helper = await fetch(process.env.API_URL+'/helper/'+req.body.helper)
        .then(data=>data.json())
        .then(data=>{
            if(data.length>1){
                return {};
            }
            else return data;
        })
        res.render('partials/detailedRequest',{customer:{
            email:"Email",
            name:"Name",
            address:"Address"},
            request: req.body,
            helper:helper
        });
    }
 }

module.exports =shorttermController;
