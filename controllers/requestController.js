require('dotenv').config()
const requestController={
        //show order information
    longTermOrder: async (req, res, next) => {
        let order = req.body;
        let helpers;

        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
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
        let services;
        let locations;
        services = await fetch(process.env.API_URL + '/service')
        .then(data => data.json())
        .catch(err=>console.error(err))
        helpers = await fetch(process.env.API_URL + `/helper`)
        .then(data => data.json())
        .catch(err=>console.error(err))
        locations = await fetch(process.env.API_URL+'/location')
        .then(data => data.json())
        .catch(err=>console.error(err))
        //put the choice in the last of list
        for(let i=0;i<services.length;i++){
            if(order.service_id==services[i]._id){
                let tmp = services[i]
                services[i]=services[services.length-1]
                services[services.length-1]=tmp;
                break;
            }
        }
        for(let i=0;i<locations.length;i++){
            if(order.province==locations[i].province){
                let tmp=locations[i];
                locations[i]=locations[locations.length-1]
                locations[locations.length-1]=tmp
                break;
            }
        }

        res.render('partials/shorttermorder', {
            order: order,
            helpers: helpers, 
            services: services,
            locations:locations,
            layout:false
        });
    },
    //POST redirect to detail order page
    submit: async (req, res, next) => {
        let user;
        try {
            //call api to get current user
            let phone = req.session.user;
            if(phone){
                user = await fetch(process.env.API_URL + '/customer/' + phone)
                .then(data =>data.json())
                user.address = user.addresses[0].detailAddress;
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

        fetch(process.env.API_URL + '/request', option)
            .then((data) => {
                res.redirect('/')
            })
            .catch(err => res.send(err))

    }
}

module.exports = requestController;