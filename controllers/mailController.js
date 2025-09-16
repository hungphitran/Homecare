const nodemailer= require('nodemailer');
const Message =require('../models/message.model')
require('dotenv').config()



// Function to generate OTP 
function generateOTP() { 
  
    // Declare a digits variable 
    // which stores all digits  
    let digits = '0123456789'; 
    let OTP = ''; 
    let len = digits.length 
    for (let i = 0; i < 6; i++) { 
        OTP += digits[Math.floor(Math.random() * len)]; 
    } 
    console.log('OTP: ',OTP);
    return OTP; 
}

const mailController={
    //send email to project owner
    contact: async (req,res,next)=>{

        //validate data
        if(!req.body.name || !req.body.email || !req.body.phone || !req.body.message){
            res.redirect('/?type=error&noti=Vui lòng nhập đầy đủ thông tin')
            return;
        }

        // More structured HTML with better styling
        let message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Thông tin liên hệ</h2>
            
            <div style="margin: 15px 0;">
                <h3 style="color: #3498db; margin-bottom: 5px;">Họ và tên:</h3>
                <p style="margin: 0; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #3498db;">${req.body.name}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h3 style="color: #3498db; margin-bottom: 5px;">Email:</h3>
                <p style="margin: 0; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #3498db;">${req.body.email}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h3 style="color: #3498db; margin-bottom: 5px;">Số điện thoại:</h3>
                <p style="margin: 0; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #3498db;">${req.body.phone}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h3 style="color: #3498db; margin-bottom: 5px;">Nội dung:</h3>
                <p style="margin: 0; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #3498db;">${req.body.message}</p>
            </div>
        </div>`;

        
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user:  process.env.MAIL,
              pass:  process.env.MAIL_KEY
            }
          });
        
        let mailOptions = {
            from: `HOMEKARE ${process.env.MAIL}`,
            to: 'nckhe222024@gmail.com',
            subject: 'Liên hệ',
            html: message,  // Thay đổi từ 'text' thành 'html'
          };
        transporter.sendMail(mailOptions,(err,infor)=>{
            if(err==null){// if no error, redirect index page with message
                res.redirect('/?type=success&noti=Gửi email thành công')
            }
            else{
                console.log(err)
                res.redirect('/?type=error&noti=Gửi email thất bại')
            }
        })
    },

    sendOtp: async(req,res,next)=>{
        // generate otp code
        let message = generateOTP();
        // modify transporter
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user:  process.env.MAIL,
              pass:  process.env.MAIL_KEY
            }
          });
        // modify sender and receiver

        Message.create(message)
        .then(data=>res.send(data))
        .catch(err=>res.send(err))
        let mailOptions = {
            from: `HOMEKARE.SITE - ${process.env.MAIL}`,
            to: req.query.account,
            subject: 'Authentication',
            text: "your OTP is: "+message,
        };

        //send email 
        transporter.sendMail(mailOptions,(err,infor)=>{
            if(err==null){
                res.render('partials/register',{account:req.query.account})
            }
            else{
                console.log(err)
                res.status(500).render('partials/register',{account:""});
            }
        })
    },
    //check 
    authen: async(req,res,next)=>{
        let authenCode= req.body.code;

    }
}

module.exports = mailController;