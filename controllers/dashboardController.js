const dashboardController={
    show: (req,res,next)=>{
        res.render('partials/index');
    }
}

module.exports= dashboardController;