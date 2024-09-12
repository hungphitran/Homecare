const { submit } = require("./longtermController")

const accountController={
    //show login page
    showLogin: async (req,res,next)=>{
        res.render('partials/login',{layout: false})
    },
        //show login page
    showRegister: async (req,res,next)=>{
        res.render('partials/register')
    },
    //login and show account
    login: async (req,res,next)=>{
        console.log(req.body)
        res.render('messages/error',{layout: false})
    },
    register: async (req,res,next)=>{
        res.send(req.body)
    }


}

module.exports = accountController;