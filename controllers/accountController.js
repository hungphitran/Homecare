const { submit } = require("./longtermController")

const accountController={
    //show login page
    showLogin: async (req,res,next)=>{
        res.render('partials/login')
    },
        //show login page

    showRegister: async (req,res,next)=>{
        res.render('partials/register')
    },
    //login and show account
    login: async (req,res,next)=>{
        console.log(req.body)
        res.render('partials/detailedaccount')
    },
    register: async (req,res,next)=>{
        res.send(req.body)
    }


}

module.exports = accountController;