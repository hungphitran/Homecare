require('dotenv').config()


const accountController = {
    //show login page
    showLogin: async (req, res, next) => {

        // res.render('partials/login')
        res.render('pages/login', { layout: false });

    },
    //show login page
    showRegister: async (req, res, next) => {
        res.render('pages/register', { layout: false })
    },
    //login and show account
    login: async (req, res, next) => {
        //check if user is existed
        let user = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())
        if (!user) {
            res.redirect('/account')
        }
        else if (user.password !== req.body.password) {//password is incorrect
            res.redirect('/account')
        }
        else {//correct password
            req.session.user = req.body.phone;//save user's phone in session
            res.redirect('/account/detailed');
        }
    },
    showChangePassword: async( req,res,next)=>{
        res.render('pages/changePassword',
            {
                phone:req.session.user,
                err:req.query.err,
                layout:false
            }
        )
    },
    register: async (req, res, next) => {

        req.body.addresses = [{ detailedAddress: req.body.address }]
        let existed = await fetch(process.env.API_URL + '/customer/' + req.body.phone)
            .then(data => data.json())
        if (existed) {
            res.status(500).json('existed phone')
        }
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
    showDetailed: async (req,res,next)=>{
        if(!req.session.user){
            res.redirect('/account');
        }
        //
        let user = await fetch(process.env.API_URL + '/customer/' + req.session.user)
        .then(data => data.json())
        .then(data=>{
            data.point=data.points[data.points.length-1].point;//format to display only latest point
            let address = data.addresses[0]
            data.address =address.detailAddress+" "+address.ward+" "+address.district+' '       
            return data
        })        
        .catch(err=>{
            console.error(err);
            res.redirect('/')
        })
console.log(user)

        //GET call api getting all requests which were created by current user
        let requests=await fetch(process.env.API_URL+'/request').then(data=>data.json())
        requests= requests.filter((request,index)=>{
            return request.customerInfo.phone==user.phone;
        })

        let schedule_ids="";
        for(let request of requests){
            for(let id of request.scheduleIds){
                schedule_ids+=id+',';
            }
        }
        
        schedule_ids=schedule_ids.slice(0,schedule_ids.length-1)//eliminate last ","
        //GET call api to get all details with ids on query
        let requestDetails =await fetch(process.env.API_URL+'/requestDetail?ids='+schedule_ids)
        .then(data=>data.json())        
        //match all detail with its request
        let startIndex=0;
        for(let i=0;i<requests.length;i++){
            let orderDate= requests[i].orderDate
            requests[i].orderDate = orderDate.slice(0,10)
            requests[i].schedules=[];
            for(let j=startIndex;j<startIndex+requests[i].scheduleIds.length;j++){
                let str=""
                try{
                    str+=requestDetails[j].workingDate.slice(0,10)+" - "+requestDetails[j].status;
                }
                catch(err){
                    continue;
                }
                requests[i].schedules.push(str)
            }
            startIndex+=requests[i].scheduleIds.length;
        }
        for(let i=0;i<requests.length;i++){
            requests[i].startTime=requests[i].startTime.slice(11,19)
            requests[i].endTime=requests[i].endTime.slice(11,19)
        }

        res.render('partials/detailedaccount',{
            user:user,
            requests:requests,
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
    }

}

module.exports = accountController;