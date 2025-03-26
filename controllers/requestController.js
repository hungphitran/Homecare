require('dotenv').config()

const requestController={
        //show order information
    longTermOrder: async (req, res, next) => {
        console.log("req.body in longterm: ",req.query)
        let order = req.query;
        let helpers;
        let services;
        let locations;
        req.query.exp = req.query.exp || 0;

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
            helpers:helpers,
            locations:locations,
            services:services,
            layout:false
        });
    },
    //GET redirect to short term order page
    shortTermOrder: async (req, res, next) => {
        console.log("req in shorterm:",req.query)
        
        let order = req.query;
        let helpers;
        let services;
        let locations;
        req.query.exp = req.query.exp || 0;
        console.log(req.query)
        //get all helpers, services, locations
        services = await fetch(process.env.API_URL + '/service')
        .then(data => data.json())
        .catch(err=>console.error(err))
        helpers = await fetch(process.env.API_URL + `/helper`)
        .then(data => data.json())
        .catch(err=>console.error(err))

        //filter helpers by experience, location
        // helpers = helpers.filter(helper=>{
        //     return helper.yearOfExperience >= Number.parseInt(req.query.exp) && helper.jobs.includes(req.query.service)//filter by experience and service
        //     //return helper.workingArea.province === order.province &&helper.workingArea.districts.contains(req.query.district) &&helper.yearOfExperience >= Number.parseInt(req.query.exp);
        // })
        //filter helpers by time off
        // helpers = helpers.filter( async (helper)=>{
        //    let timeOffs = await fetch(process.env.API_URL + `/timeoff/${helper.id}`)//get all time off of each helper
        //    .then(data=>data.json())
        //    .catch(err=>console.error(err))

        //     let isAvailable = true;
        //         timeOffs.forEach(timeOff=>{
        //             if(timeOff.dateOff === order.orderDate //if helper has time off on order date
        //                 && (timeOff.startTime >= order.startTime && timeOff.starTime <= order.endTime)
        //                 && (timeOff.endTime >= order.startTime && timeOff.endTime <= order.endTime)
        //             ){
        //                 isAvailable = false;
        //             }
        //     })
        //     return isAvailable;

        // })

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
        //format dates if ordertype is longterm
        if(req.query.requestType == 'Dài hạn'){
            let startDate = new Date(req.query.startDate);
            let endDate = new Date(req.query.endDate);
            let dates = [];
            for(let i=startDate;i<=endDate;i.setDate(i.getDate()+1)){
                dates.push(i.toISOString().split('T')[0])
            }
            req.query.dates = dates;
        }
        else{
            req.query.dates = [req.query.dates]
        }
        req.body.orderDate = Date.now();
        console.log("req.query in submit: ",req.query)

        //get user information if user is logged in
        let user=null;
        try {
            //call api to get current user
            let phone = req.session.phone;
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


        //get service information
        let service = await fetch(process.env.API_URL + '/service/' + req.query.service)
            .then(data => data.json())
            .catch(err=>console.error(err))

        //get cost factors
        let costFactorService = await fetch(process.env.API_URL + '/costfactor/service')
        .then(data => data.json())
        .then(data=>data[0])
        .then(data=>{
            return data.coefficientList.find(e=>e._id === service.coefficient_id)
        })
        .catch(err=>console.error(err))

        let costFactorOther = await fetch(process.env.API_URL + '/costfactor/other')
        .then(data => data.json())
        .catch(err=>console.error(err))

        let general = await fetch(process.env.API_URL + '/general')
        .then(data => data.json())
        .catch(err=>console.error(err))

        let today= new Date()
        req.query.orderDate = today.getFullYear() + "-"+(today.getMonth()+1>9 ? today.getMonth()+1 : "0"+(today.getMonth()+1)  ) +"-"+today.getDate()

        req.query.totalCost=0;
        
        for(let i=0;i<req.query.dates.length;i++){
            let response= await fetch(process.env.API_URL + '/request/calculateCost',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    servicePrice: service.basicPrice,
                    startTime: req.query.startTime,
                    endTime: req.query.endTime,
                    workDate: req.query.dates[i],
                    officeStartTime: general.officeStartTime,
                    officeEndTime: general.officeEndTime,
                    coefficient_other:costFactorOther,
                    serviceFactor:costFactorService.value,
                })
            }).then(data=>data.json())
            .catch(err=>console.error(err))
            req.query.totalCost += response.totalCost;
        }

        

        //get helper information
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

        let dates="";
        for (let i = 0; i < req.body.dates.length; i++){
            console.log(dates)
            dates+=req.body.dates[i]+",";
        }
        req.body.startDate=dates.substring(0,dates.length-1);//remove the last comma

        req.body.startTime=`${req.body.dates[0]}T${st}:00`;
        req.body.endTime=`${req.body.dates[0]}T${et}:00`;
        let service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
        .then(data => data.json())
        .catch(err=>console.error(err))
        console.log("service: ",service)
        req.body.service = {
            title: service.title,
            coefficient_service: Number.parseFloat(service.factor)||1,
            coefficient_other: 0,
            cost: service.basicPrice
        }
      console.log(req.body)

        let option={
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }

        console.log(req.body)

        //create a success notification
        await fetch(process.env.API_URL + '/request', option)
            .then(data => {
                if(data.status === 200){
                    return data.json()
                    .then(data=>Promise.resolve(data.message))
                }
                else {
                    console.log(data)
                    return data.json()
                    .then(data=>Promise.reject(data.message))
                }

            })
            .then(data => {
                res.render("pages/notificationpage",{
                    layout:false,
                    noti: "Đặt lịch thành công"+ data
                })
            })
            .catch(err => {
                res.render("pages/notificationpage",{
                    layout:false,
                    noti: err
                })
            })
    }
}
module.exports = requestController;