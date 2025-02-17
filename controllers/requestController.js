require('dotenv').config()

function totalCostCalculation(date, start, end, request, costFactors) {
    const holidays = [
        new Date(2025, 3, 30), // Ngày Giải phóng miền Nam
        new Date(2025, 4, 1), // Quốc tế Lao động
        new Date(2025, 8, 2), // Quốc khánh
        new Date(2025, 5, 1), // Quốc tế Thiếu nhi
        new Date(2025, 6, 27), // Ngày Thương binh Liệt sĩ
        new Date(2025, 10, 20) // Ngày Nhà giáo Việt Nam
    ];

    let otherCoefficientList = [];
    let time = new Date(date);
    let now = new Date(time.getFullYear(), time.getMonth(), time.getDate());
    let eightAM = new Date(now.setHours(8, 0, 0));
    let sixPM = new Date(now.setHours(18, 0, 0));

    let startTime = new Date(`${date}T${start}`);
    let endTime = new Date(`${date}T${end}`);

    let basicPrice = request.service.basicPrice;
    let basicCoefficient = 0;

    console.log(date, start, end, request, costFactors);

    for (let costFactor of costFactors) {
        if (costFactor.title === 'Hệ số lương cho dịch vụ') {
            basicCoefficient = costFactor.coefficientList.find(e => e.title === 'Dịch vụ dọn dẹp')?.value || 1;
            break;
        }
    }

    for (let costFactor of costFactors) {
        if (costFactor.title === 'Hệ số khác') {
            otherCoefficientList = costFactor.coefficientList;
        }
    }

    let totalCost = basicPrice * basicCoefficient;
    let holidayCoefficient = holidays.some(holiday => holiday.getMonth() === startTime.getMonth() && holiday.getDate() === startTime.getDate())
        ? (otherCoefficientList.find(e => e.title === 'Hệ số lễ')?.value || 1)
        : (startTime.getMonth() === 11 && startTime.getDate() === 25)
            ? (otherCoefficientList.find(e => e.title === 'Hệ số noel')?.value || 1)
            : (startTime.getMonth() === 0 && startTime.getDate() === 1)
                ? (otherCoefficientList.find(e => e.title === 'Hệ số tết')?.value || 1)
                : 1;

    let weekendCoefficient = (startTime.getDay() === 6 || startTime.getDay() === 0)
        ? (otherCoefficientList.find(e => e.title === 'Hệ số làm việc ngày cuối tuần')?.value || 1)
        : 1;

    let maxCoefficient = Math.max(holidayCoefficient, weekendCoefficient);
    let overTime = 1;
    let hours = 0;
    let newStartTime = startTime;
    let newEndTime = endTime;

    if (startTime < eightAM || endTime > sixPM) {
        overTime = otherCoefficientList.find(e => e.title === 'Hệ số ngoài giờ')?.value || 1;
        if (startTime < eightAM) {
            hours += (eightAM - startTime) / (1000 * 60 * 60);
            newStartTime = eightAM;
        }
        if (endTime > sixPM) {
            hours += (endTime - sixPM) / (1000 * 60 * 60);
            newEndTime = sixPM;
        }
    }

    let otherCoefficient = hours * overTime + (newEndTime - newStartTime) / (1000 * 60 * 60);
    otherCoefficient *= maxCoefficient;
    let finalCost = totalCost * otherCoefficient;

    return {
        basicPrice,
        totalCost,
        basicCoefficient,
        holidayCoefficient,
        weekendCoefficient,
        maxCoefficient,
        overTimeCoefficient: overTime,
        overTimeHours: hours,
        finalCost,
    };
}

function totalCostForMultipleDays(dateList, request, costFactors) {
    let totalCostSummary = {
        basicPrice: 0.0,
        totalCost: 0.0,
        basicCoefficient: 0.0,
        holidayCoefficient: 0.0,
        weekendCoefficient: 0.0,
        maxCoefficient: 0.0,
        overTimeCoefficient: 0.0,
        overTimeHours: 0.0,
        finalCost: 0.0,
    };

    if (!dateList || dateList.length === 0) {
        return totalCostSummary;
    }

    for (let date of dateList) {
        let costData = totalCostCalculation(date, request.startTime, request.endTime, request, costFactors);
        for (let key in costData) {
            if (totalCostSummary.hasOwnProperty(key)) {
                totalCostSummary[key] += costData[key];
            }
        }
    }

    return totalCostSummary;
}


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
        req.query.service = {
            title: service.title,
            coefficient_service: Number.parseFloat(service.factor)||1,
            coefficient_other: 0,
            cost: service.basicPrice
        }
        req.query.totalCost = totalCostCalculation(req.query.orderDate, req.query.startTime, req.query.endTime, req.query, service.costFactors).finalCost;

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
        req.body.status = "Chưa tiến hành"
      
        let service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
        .then(data => data.json())
        req.body.service = {
            title: service.title,
            coefficient_service: Number.parseFloat(service.factor)||1,
            coefficient_other: 0,
            cost: service.basicPrice
        }

        let option={
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }


        //create a success notification
        fetch(process.env.API_URL + '/request', option)
            .then((data) => {
                res.render("pages/notificationpage",{
                    layout:false,
                    noti: "create new order successfully"
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