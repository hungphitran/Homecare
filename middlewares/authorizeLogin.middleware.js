module.exports = async (req, res, next) => {
    if(!req.session.phone){
        res.redirect('/account')
    }
    else next();
}