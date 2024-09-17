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
        user = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())

        if (!user) {
            alert('no account with phone number: ' + req.phone);
        }
        else if (user.password !== req.body.password) {
            alert('wrong password');
        }
        else {
            res.redirect('/');
        }
    },
    register: async (req, res, next) => {
        // res.send(req.body)
        // console.log(req.body);
        res.redirect('/account');
    }


}

module.exports = accountController;