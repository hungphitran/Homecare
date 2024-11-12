require('dotenv').config()
const requestController={
        //show order information
    longTermOrder: async (req, res, next) => {
        let order = req.query;
        let helpers;
        let services;
        let locations;

        helpers = await fetch(process.env.API_URL + `/helper`)
            .then(data => data.json())
            .catch(err=>console.error(err))
        services = await fetch(process.env.API_URL + '/service')
            .then(data => data.json())
            .catch(err=>console.error(err))
        locations = await fetch(process.env.API_URL+'/location')
            .then(data => data.json())
            .catch(err=>console.error(err))

        res.render('partials/longtermorder', {
            order: order,
            helper: helpers[0],
            locations:locations,
            services:services,
            layout:false
        });
    },
    shortTermOrder: async (req, res, next) => {
        console.log(req.query)
        let order = req.query;
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

        
        res.render('partials/shorttermorder', {
            order: order,
            helpers: helpers, 
            services: services,
            locations:locations,
            layout:false
        });
    },
    //GET redirect to detail order page
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
        let service = await fetch(process.env.API_URL + '/service/' + req.query.service_id)
            .then(data => data.json())

        req.query.totalCost = service.basicPrice*(req.query.dates.length/10)

        let today= new Date()
        req.query.orderDate =today.getFullYear() + "-"+(today.getMonth()+1) +"-"+today.getDate()


        let helper = await fetch(process.env.API_URL + '/helper/'+req.query.helperId)
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
            request: req.query,
            helper: helper,
            service: service,
            layout:false
        });
    },
    create: async (req,res,next)=>{
        let st =req.body.startTime;
        st= st.length <2 ?'0'+ st :st
        let et =req.body.endTime;
        et= et.length <2 ?'0'+ et :et

        req.body.startTime=`${req.body.orderDate}T${st}:00`;
        req.body.endTime=`${req.body.orderDate}T${et}:00`;
        req.body.status="Chưa tiến hành"
        
        let service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
        .then(data => data.json())
        req.body.service = {
            title: service.title,
            coefficient_service: Number.parseFloat(service.factor)||1,
            coefficient_other: 0,
            cost: service.basicPrice
        }
        res.send(req.body)
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