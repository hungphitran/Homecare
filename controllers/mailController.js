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
        let message = req.body.name+'\n'+req.body.email+'\n' +req.body.phone+'\n'+ req.body.message;
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user:  process.env.MAIL,
              pass:  process.env.MAIL_KEY
            }
          });
        
        let mailOptions = {
            from: `PROCLEANER ${process.env.MAIL}`,
            to: 'nckhe222024@gmail.com',
            subject: 'Liên hệ',
            text: message,
          };
        transporter.sendMail(mailOptions,(err,infor)=>{
            if(err==null){
                res.status(200).render('partials/register',{account:""})
            }
            else{
                console.log(err)
                res.status(500).render('partials/register',{account:""});
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
        let mailOptions = {
            from: `PROCLEANER ${process.env.MAIL}`,
            to: req.query.account,
            subject: 'Authentication',
            text: "your OTP is: "+message,
        };

        //send email 
        transporter.sendMail(mailOptions,(err,infor)=>{
            if(err==null){
                Message.
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