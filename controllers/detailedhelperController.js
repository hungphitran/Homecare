require('dotenv').config()
const detailedhelperController = {
    //get helper with id
    show: async (req, res, next) => {
        let services;
        let helper;
        let user;
        try {
            //call api to get current user
            let phone = req.session.user;
            user = await fetch(process.env.API_URL + '/customer/' + phone)
                .then(data => data.json())
                .then(data => data)
        }
        catch (err) {
            console.error(err);
        }
        try {
            services = await fetch(process.env.API_URL + '/service')
                .then(data => data.json())
                .then(data => data)
        }
        catch (err) {
            console.error(err)
        }
        try {
            //call api to get locations
            helper = await fetch(process.env.API_URL + `/helper/` + req.params.id)
                .then(data => data.json())
                .then(data => data)
                .catch(err => console.error(err))

        }
        catch (err) {
            console.error(err);
        }
        res.render('partials/detailedhelper', {
            user: user,
            helper: helper,
            services: services,
        })
    }
}

module.exports = detailedhelperController;