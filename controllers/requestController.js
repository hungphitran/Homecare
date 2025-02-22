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


function getDayOfWeek(dateString) {
    const [day, month, year] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-based in JS
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    return daysOfWeek[date.getDay()];
}

function calculateTotalCost(service,costFactors,req) {
    const [startHour, startMinute] = req.query.startTime.split(":").map(Number);
    const [endHour, endMinute] = req.query.endTime.split(":").map(Number);

    let workingTime = endHour - startHour;
    if(endMinute < startMinute){//if endtime =0 and starttime =30
        workingTime -= 0.5;
    }
    else if(endMinute > startMinute){//if endtime =30 and starttime =0
        workingTime += 0.5;
    }
    else{//if endtime = starttime}
    }

    let serviceCostFactors = costFactors.find(e => e.title === 'Hệ số lương cho dịch vụ');
    let serviceCostFactor = serviceCostFactors.coefficientList.find(e => e.title === service.title)?.value || 1;
    let otherCoefficient = costFactors.find(e => e.title === 'Hệ số khác');
    let coefficient_overtime = 1;
    let coefficient_weekend = 1;
    let coefficient_holiday = 1;
    //if working time is in 6am-8am or 6pm-8pm
    if(startHour < 8 || endHour > 18){
        let overTime = otherCoefficient.coefficientList.find(e => e.title === 'Hệ số ngoài giờ')?.value || 1;
        workingTime = workingTime + (endHour - 18) + (8 - startHour);
        coefficient_overtime *= overTime;
    }

    //if working time is in weekend
    if(getDayOfWeek(req.query.orderDate) === 'Saturday' || getDayOfWeek(req.query.orderDate) === 'Sunday'){
        coefficient_weekend = otherCoefficient.coefficientList.find(e => e.title === 'Hệ số làm việc ngày cuối tuần')?.value || 1;
    }

    //count working date
    let workingDate = req.query.dates.split(",").length;

    req.query.service = {
        title: service.title,
        coefficient_service: Number.parseFloat(serviceCostFactor) || 1,
        coefficient_other: coefficient_weekend*coefficient_holiday*coefficient_overtime,
        cost: service.basicPrice
    }

    return service.basicPrice * serviceCostFactor * workingTime * coefficient_overtime * Math.max(coefficient_weekend, coefficient_holiday)  * workingDate;

}

const requestController={
        //show order information
    longTermOrder: async (req, res, next) => {
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
            locations:locations,
            services:services,
            layout:false
        });
    },
    //GET redirect to short term order page
    shortTermOrder: async (req, res, next) => {
        console.log(req.query)
        
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
        helpers = helpers.filter(helper=>{
            return helper.yearOfExperience >= Number.parseInt(req.query.exp) && helper.jobs.includes(req.query.service)//filter by experience and service
            //return helper.workingArea.province === order.province &&helper.workingArea.districts.contains(req.query.district) &&helper.yearOfExperience >= Number.parseInt(req.query.exp);
        })
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
        console.log(req.query)
        //format dates if ordertype is longterm
        if(req.query.orderType === 'longterm'){
            req.query.dates = req.query.dates.split("::")
            for(let i=0;i<req.query.dates.length;i++){
                req.query.dates[i] = req.query.dates[i].strip();
            }
        }

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
        let costFactors = await fetch(process.env.API_URL + '/costfactor/')
        .then(data => data.json())
        .catch(err=>console.error(err))


        //cost = basicCost * HSDV * [(HSovertime * T1) + (max(Hscuoituan, lễ) * T2)] * T3(nếu có)
        //req.query.totalCost = totalCostCalculation(req.query.orderDate, req.query.startTime, req.query.endTime, req.query, service.costFactors).finalCost;
        

        let today= new Date()
        req.query.orderDate = today.getFullYear() + "-"+(today.getMonth()+1) +"-"+today.getDate()
        req.query.totalCost= calculateTotalCost(service,costFactors,req)

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

        req.body.startTime=`${req.body.startDate}T${st}:00`;
        req.body.endTime=`${req.body.startDate}T${et}:00`;
        req.body.status = "Chưa tiến hành"
      
        let service = await fetch(process.env.API_URL + '/service/' + req.body.service_id)
        .then(data => data.json())
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