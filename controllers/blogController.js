require('dotenv').config()

const blogController ={
    showAll: async (req,res,next)=>{
        res.render('pages/blog',{
            layout:false
        })
    }
}

module.exports = blogController;