const { use } = require('../routes/dashboard.route');

require('dotenv').config()


const accountController = {
    //show login page
    showLogin: async (req, res, next) => {

        // res.render('partials/login')
        res.render('pages/login', { layout: false });

    },
    //show login page
    showRegister: async (req, res, next) => {
        res.render('pages/register', { layout: false })
    },
    //login and show account
    login: async (req, res, next) => {
        console.log(req.body)
        let user = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())
        if (!user) {
            res.redirect('/account')
        }
        else if (user.password !== req.body.password) {
            res.redirect('/account')
        }
        else {
            req.session.user = req.body.phone;
            res.redirect('/account/detailed');
        }
    },
    register: async (req, res, next) => {

        req.body.addresses = [{ detailedAddress: req.body.address }]
        console.log(req.body);
        let existed = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())
        if (existed) {
            res.status(500).json('existed phone')
        }
        let option = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }

        await fetch(process.env.API_URL + '/customer', option)
            .then(() => res.redirect('/account'))
            .catch(err => res.send(err))

    },
    showDetailed: async (req,res,next)=>{
        if(!req.session.user){
            res.redirect('/account');
        }

        let user = await fetch(process.env.API_URL + '/customer/' + req.session.user)
        .then(data => data.json())
        
        let requests=await fetch(process.env.API_URL+'/request').then(data=>data.json())
        requests= requests.filter((request,index)=>{
            return request.customerInfo.phone==user.phone;
        })

        res.render('pages/detailedaccount',{
            user:user,
            requests:requests,
            layout:false
        });
    }


}

module.exports = accountController;