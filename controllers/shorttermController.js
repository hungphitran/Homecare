require('dotenv').config()
const shorttermController ={
    filter: async (req,res,next)=>{
        let order=req.body;
        let helpers;
        let service;
        service=await fetch(process.env.API_URL+'/service/'+req.body.service_id)
        .then(data=>data.json())
        .then(data=>data)
        helpers=await fetch(process.env.API_URL+`/helper`)
        .then(data=>data.json())
        .then(data=>data)
        helpers=helpers.filter((helper)=>{
            return helper.workingArea.province==req.body.province && helper.workingArea.districts.includes(req.body.district)&& helper.jobs.includes(service._id);
        })
        res.render('partials/shorttermorder',{order:order,
                                            helpers:helpers,service: service
                                        });
    },
    submit: async (req,res,next)=>{
        req.body.type="shortTerm";
        let service= await fetch(process.env.API_URL+'/service/'+req.body.service_id)
        .then(data=>data.json())
        req.body.fee=service.basicPrice

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
            helper:helper,
            service:service
        });
    }
 }

module.exports =shorttermController;
