require('dotenv').config()


const accountController = {
    register:async (req, res) => {
        let token = req.body.token;
        let phone = req.body.phone;
        let device = req.body.deviceType;

        fetch(process.env.API_URL + '/notifications/register',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + req.session.token
                },
                body: JSON.stringify({ token: token, phone: phone, platform: device })
            }
        )
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                res.status(200).json({ success: true, message: 'Token registered successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Failed to register token' });
            }
        })
        .catch(error => console.error('Error:', error))
    },
    test:async (req, res) => {
        let phone = req.body.phone;
        let title = req.body.title;
        let body = req.body.body;
        console.log(req.body)

        fetch(process.env.API_URL + '/notifications/test',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phone, title: title, body: body })
            }
        )
        .then(response => response.json())
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => console.error('Error:', error))
    },
    check:async (req, res) => {
        let phone = req.params.phone;
        console.log(req.params)
        fetch(process.env.API_URL + '/notifications/check/' + phone,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json', 
                },
            }
        )
        .then(response => response.json())  
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => console.error('Error:', error))
    }
}

module.exports = accountController;