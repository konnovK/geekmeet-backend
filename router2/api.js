const express = require('express')

const api = express.Router()

const user = require('./user')
api.use('/user', user)

const tag = require('./tag')
api.use('/tag', tag)

const feed = require('./feed')
api.use('/feed', feed)

const event = require('./event')
api.use('/event', event)

module.exports = api