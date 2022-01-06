const jwt = require('jsonwebtoken')
const { DEBUG } = require('./settings.json')

let verifyToken = (token) => {
    return jwt.verify(token, "SECRET_KEY_RANDOM")
}


let authorization = (req, res, next) => {
    if (DEBUG) {
        return next()
    }
    try {
        let token = req.headers.authorization.split(' ')[1]

        if (!token) {
            return res.status(401).json({message: 'empty token'})
        }
        const decoded = verifyToken(token)

        req._id = decoded.id

        next()
    } catch (e) {
        return res.status(401).json({message: 'wrong token'})
    }
}

module.exports = authorization