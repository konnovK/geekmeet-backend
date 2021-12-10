const express = require('express')

const api = express.Router()

const user = require('./user')
api.use('/user', user)


// api.get('/', (req, res) => {
//     res.send('/')
// })


module.exports = api