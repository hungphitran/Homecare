require('dotenv').config()


const accountController = {
    //show login page
    showLogin: async (req, res, next) => { 
        //render login page
        res.render('pages/login', { layout: false });

    },
    //show login page
    showRegister: async (req, res, next) => {
        //render register page
        res.render('pages/register', { layout: false })
    },
    //login and show account
    login: async (req, res, next) => {
        if(req.session.phone){
            res.redirect('/account/detailed');
        }

        //check if user is existed
        let user = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())
            .catch(err=>console.error(err))
            console.log("loaded user:",user)
        if (!user) {
            //user is not existed
            console.log("user not found")
            res.render('pages/login', { layout: false});
        }
        else if (user.password !== req.body.password) {//password is incorrect
            console.log("wrong password")
            res.redirect('/account')
        }
        else {//correct password
            req.session.phone = user.phone;//save user's phone in session
            console.log("login success")
            res.redirect('/account/detailed');
        }
    },
    //show change password page
    showChangePassword: async( req,res,next)=>{
        res.render('pages/changePassword',
            {
                
                phone:req.session.user,
                err:req.query.err,
                layout:false
            }
        )
    },

    //handle register
    register: async (req, res, next) => {
        //format address
        req.body.addresses = [{ detailedAddress: req.body.address }]
        let existed = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())
        if (existed) {//phone is existed
            res.status(500).json('existed phone')
        }
        //POST call api to create new user
        let option = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }
        await fetch(process.env.API_URL + '/customer', option)
            .then(() => res.redirect('/account'))
            .catch(err => res.send(err))

    },
    //show account page
    showDetailed: async (req,res,next)=>{
        if(!req.session.phone){
            res.redirect('/account');
        }
        //GET call api to get user's information
        let user = await fetch(process.env.API_URL + '/customer/' + req.session.phone)
        .then(data => data.json())
        .then(data=>{
            if(data.points){
                data.point=data.points[data.points.length-1].point;//format to display only latest point
            } 
            let address = data.addresses[0] //get first address
            data.points=[0];
            data.address =address.detailAddress+" "+address.ward+" "+address.district+' ' //format address
            return data
        })        
        .catch(err=>{
            console.error(err);
            res.redirect('/')
        })




        //GET call api getting all requests which were created by current user
        let requests=await fetch(process.env.API_URL+'/request').then(data=>data.json())
        //filter all requests which were created by current user
        requests= requests.filter((request)=>{
            return request.customerInfo.phone==user.phone
        })

        //get all schedule ids of all requests
        let schedule_ids="";
        for(let request of requests){
            for(let id of request.scheduleIds){
                //concat all schedule ids with "," to query
                schedule_ids+=id+',';
            }
        }
        
        schedule_ids = schedule_ids.slice(0, schedule_ids.length - 1)//eliminate last ","
        //GET call api to get all details with ids on query
        let requestDetails =await fetch(process.env.API_URL+'/requestDetail?ids='+schedule_ids)
        .then(data=>data.json())   
        .catch(err=>console.error(err))     
        //match all detail with its request
        let startIndex=0;
        for(let i=0;i<requests.length;i++){
            //format date
            let orderDate= requests[i].orderDate
            requests[i].orderDate = orderDate.slice(0, 10)
            requests[i].schedules=[];
            //get all details of each request
            for(let j=startIndex;j<startIndex+requests[i].scheduleIds.length;j++){
                let str=""
                try{
                    //format date and status of each detail
                    str += requestDetails[j].workingDate.slice(0, 10) + " - " + requestDetails[j].status;
                }
                catch(err){
                    console.error(err);
                }
                //push to schedules
                requests[i].schedules.push(str)
            }
            //update start index
            startIndex+=requests[i].scheduleIds.length;
        }

        //format date to display
        for(let i=0;i<requests.length;i++){
            requests[i].startTime = requests[i].startTime.slice(10, 19)
            requests[i].endTime = requests[i].endTime.slice(10, 19)
        }

        let longTermRequests = requests.filter(request=>request.requestType.toLowerCase()==="dài hạn")
        let shortTermRequests = requests.filter(request=>request.requestType.toLowerCase()=="ngắn hạn")

        res.render('partials/detailedaccount',{
            user:user,
            longTermRequests:longTermRequests,
            shortTermRequests:shortTermRequests,
            layout:false
        });
    },
    sendotp: async(req,res,next)=>{
        if(req.body.phone){
            let option = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body)
            }
            //POST call api for send sms with otp code
            await fetch(process.env.API_URL+'/message',option)
            .then(()=>res.status(200).end())
            .catch(err=>{
                console.error(err)
            })
        }
        else{
            res.redirect('/account/changepassword?err=số không hợp lệ')
        }
    },
    changePassword: async (req,res,next)=>{
        //GET check if message exist and get it
        const message = await fetch(process.env.API_URL+'/message?phone='+req.body.phone)
        .then(data=>data.json())
        .catch(err=>console.error(err))
        //if there's no message or the otp is incorrect
        if(!message || message.otp!=req.body.otp){
            res.redirect('/account/changepassword?err=sai otp')
        }
        else{//otp is correct

            let option = {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({password:req.body.password})
            }
            //PATCH call api for update password
            await fetch(process.env.API_URL+'/customer/'+req.body.phone,option)
            .then(()=>res.redirect('/account'))
            .catch(err=>console.error(err))

        }
    },
    //handle logout
    logout: async (req, res, next) => {
        req.session.destroy();
        res.redirect('/login');
    }

}

module.exports = accountController;