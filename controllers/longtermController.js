require('dotenv').config()
const longtermController = {
    //show order information
    order: async (req, res, next) => {
        let order = req.body;
        let helpers;

        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
            .then(data => data)
        res.render('partials/longtermorder', {
            order: order,
            helpers: helpers
        });
    },

    // confirm customer-information
    submit: async (req, res, next) => {
        req.body.type = "longTerm";
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
        let service = await fetch(process.env.API_URL + '/service/' + req.body.service)
            .then(data => data.json())
        req.body.fee = service.basicPrice || 0
        req.body.service_id = service._id || ''

        let helper = await fetch(process.env.API_URL + '/helper/' + req.body.helper)
            .then(data => data.json())
            .then(data => {
                if (data.length > 1) {
                    return {};
                }
                else return data;
            })
        res.render('partials/detailedRequest', {
            customer: user,
            request: req.body,
            helper: helper
        });
    }
}

module.exports = longtermController;
