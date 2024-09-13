const { submit } = require("./longtermController")

const accountController={
    //show login page
    showLogin: async (req,res,next)=>{
        // res.render('partials/login')
        res.render('pages/login',{layout: false})
    },
        //show login page
    showRegister: async (req,res,next)=>{
        res.render('pages/register',{layout:false})
    },
    //login and show account
    login: async (req,res,next)=>{
        // console.log(req.body)
        // res.render('partials/detailedaccount')
        res.render('pages/login',{layout: false})
    },
    register: async (req,res,next)=>{
        // res.send(req.body)
        // console.log(req.body);
        res.redirect('/account');
    }


}

module.exports = accountController;