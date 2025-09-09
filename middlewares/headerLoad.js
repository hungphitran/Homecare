module.exports = async (req, res, next) => {
    try {
        // Fetch services data
        let services = await fetch(process.env.API_URL + '/service')
            .then(data => data.json())
            .catch(err => {
                console.error('Error fetching services:', err);
                return []; // Return empty array on error
            });

        // Fetch general data
        let general = await fetch(process.env.API_URL + '/general')
            .then(data => data.json())
            .catch(err => {
                console.error('Error fetching general data:', err);
                return {}; // Return empty object on error
            });

        // Add data to res.locals so it's available in all views
        res.locals.services = services;
        res.locals.general = general;
        
        // Load user info from session if available
        if (req.session && req.session.phone && req.session.username) {
            res.locals.user = {
                phone: req.session.phone,
                fullName: req.session.username
            };
            res.locals.phone = req.session.phone; // Add phone to locals for meta tag
        } else {
            res.locals.user = null;
            res.locals.phone = null;
        }
        
        // Call next() to continue to the next middleware/controller
        next();
    } catch (error) {
        console.error('HeaderLoad middleware error:', error);
        // Set default values and continue
        res.locals.services = [];
        res.locals.general = {};
        res.locals.user = null;
        next();
    }
}