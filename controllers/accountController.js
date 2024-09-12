const { submit } = require("./longtermController")

const accountController={
    //show login page
    showLogin: async (req,res,next)=>{
        // res.render('partials/login')
        res.render('messages/error',{layout: false})
    },
        //show login page
    showRegister: async (req,res,next)=>{
        res.render('pages/register',{layout:false})
    },
    //login and show account
    login: async (req,res,next)=>{
        console.log(req.body)
        // res.render('partials/detailedaccount')
        res.render('messages/error',{layout: false})
    },
    register: async (req,res,next)=>{
        res.send(req.body)
    }


}

module.exports = accountController;