require('dotenv').config()
const detailedhelperController={
    show:(req,res,next)=>{
        let id=req.body.id;
        res.render('partials/detailedhelper')
    }
}

module.exports=detailedhelperController;