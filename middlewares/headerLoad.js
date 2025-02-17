module.exports = async (req, res, next) => {
    let services = await fetch(process.env.API_URL + '/service')
        .then(data => data.json())
        .then(data => data)
    let general = await fetch(process.env.API_URL + '/general')
                .then(data => data.json())
                .then(data => data)
    res.render('partials/header', { services: services, general:general }, next);
}