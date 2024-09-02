const nodemailer= require('nodemailer');
require('dotenv').config()
const mailController={
    send: async (req,res,next)=>{
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
        await transporter.sendMail(mailOptions,(err,infor)=>{
            if(err==null){
                res.status(200).redirect('back')
            }
            else{
                console.log(err)
                res.status(500).redirect('back');
            }
        })
    },

    test: async (req,res,next)=>{
        res.send(req.body)
    }
}

module.exports = mailController;