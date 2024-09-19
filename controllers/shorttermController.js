require('dotenv').config()
const shorttermController = {
    filter: async (req, res, next) => {
        let order = req.body;
        let helpers;
        let service;
        service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
            .then(data => data.json())
            .then(data => data)
        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
            .then(data => data)
        helpers = helpers.filter((helper) => {
            return helper.workingArea.province == req.body.province && helper.workingArea.districts.includes(req.body.district) && helper.jobs.includes(service._id);
        })
        res.render('partials/shorttermorder', {
            order: order,
            helpers: helpers,
            service: service,
            layout: false
        });
    },
    submit: async (req, res, next) => {
        req.body.type = "shortTerm";
        let user;
        try {
            //call api to get current user
            let phone = req.session.user;
            user = await fetch(process.env.API_URL + '/customer/' + phone)
                .then(data => data.json())
                .then(data => {
                    if (!data) {
                        return {
                            name: "Name",
                            phone: "Phone",
                            address: "Address"
                        }
                    }
                    else {
                        let address = data.addresses[0].detailedAddress;

                        data.address = address;
                        return data;
                    }
                })
        }
        catch (err) {
            console.error(err);
        }
        let service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
            .then(data => data.json())
        req.body.fee = service.basicPrice

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
            helper: helper,
            service: service,
            layout: false
        });
    }
}

module.exports = shorttermController;
