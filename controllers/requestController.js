require('dotenv').config()
const requestController = {
    create: async (req, res, next) => {
        req.body.startTime = `${req.body.startDate}T${req.body.startTime}:00`;
        req.body.endTime = `${req.body.endDate}T${req.body.endTime}:00`;
        let option = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }

        // fetch(process.env.API_URL+'/request',option)
        fetch(process.env.API_URL + '/request', option)
            .then((data) => {
                res.redirect('/')
            })
            .catch(err => res.send(err))

    }
}

module.exports = requestController;