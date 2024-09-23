require('dotenv').config()
const requestController={
        //show order information
    longTermOrder: async (req, res, next) => {
        let order = req.body;
        let helpers;

        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
            .then(data => data)
            .catch(err=>console.error(err))

        helpers = helpers.filter((helper) => {
            return helper.workingArea.province == req.body.province && helper.workingArea.districts.includes(req.body.district) && helper.jobs.includes(service._id);
        })
        res.render('partials/longtermorder', {
            order: order,
            helpers: helpers,
            layout:false
        });
    },
    shortTermOrder: async (req, res, next) => {
        let order = req.body;
        let helpers;
        let service;
        service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
            .then(data => data.json())
            .then(data => data)
            .catch(err=>console.error(err))
        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
            .then(data => data)
            .catch(err=>console.error(err))

        helpers = helpers.filter((helper) => {
            return helper.workingArea.province == req.body.province && helper.workingArea.districts.includes(req.body.district) && helper.jobs.includes(service._id);
        })
        res.render('partials/shorttermorder', {
            order: order,
            helpers: helpers, 
            service: service,
            layout:false
        });
    },
    submit: async (req, res, next) => {
        let user;
        try {
            //call api to get current user
            let phone = req.session.user;
            if(phone){
                user = await fetch(process.env.API_URL + '/customer/' + phone)
                .then(data => data.json())
                .then(data => data)
            }
            else{
                user={
                    
                }
            }
            
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
            .catch(err=>console.error(err))

        res.render('partials/detailedRequest', {
            customer: user,
            request: req.body,
            helper: helper,
            service: service,
            layout:false
        });
    },
    create: async (req,res,next)=>{
        req.body.startTime=`${req.body.startDate}T${req.body.startTime}:00`;
        req.body.endTime=`${req.body.endDate}T${req.body.endTime}:00`;
        let option={
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }

        // fetch(process.env.API_URL+'/request',option)
        fetch(process.env.API_URL + '/request', option)
            .then((data) => {
                res.redirect('/')
            })
            .catch(err => res.send(err))

    }
}

module.exports = requestController;