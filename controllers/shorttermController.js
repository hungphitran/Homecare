require('dotenv').config()
const shorttermController ={
    order: async (req,res,next)=>{
        let order=req.body;
        let helpers;
        helpers=await fetch(process.env.API_URL+'/helper')
        .then(data=>data.json())
        .then(data=>data)
        res.render('partials/shorttermOrder',{order:order,helpers:helpers});
    },
    get: async (req,res,next)=>{
        res.render('partials/shorttermOrder');
    },

    submit: async (req,res,next)=>{
        res.send(req.body)
    }
 }

module.exports =shorttermController;