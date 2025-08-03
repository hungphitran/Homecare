module.exports = async (req, res, next) => {
    if(!req.session.phone){
        return res.redirect('/account'); // Add return to prevent further execution
    }
    else {
        next();
    }
}