const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.get('Authorization').split(' ')[1];
    if (!token) {
        return res.send({
            error: true,
            errorLog: 'No Authorization Header'
        })
    };
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decodedToken;
        next();
    } catch (err) {
        res.send({
            error: true,
            errorLog: 'Invalid Authorization Token'
        })
    }

}