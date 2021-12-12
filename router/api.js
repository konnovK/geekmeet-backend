const express = require('express')

const api = express.Router()

const user = require('./user')
api.use('/user', user)

const feed = require('./feed')
api.use('/event', feed)

// const profile = require('./profile')
// api.use('/profile', profile)


// api.get('/', (req, res) => {
//     res.send('/')
// })


module.exports = api