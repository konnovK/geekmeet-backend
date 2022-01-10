const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const auth = require('../authorization')

let friends = express.Router()
friends.use(express.json())
friends.use(auth)


/**
 * Создать заявку в друзья
 */
friends.post('/:id', async (req, res) => {
    let id = req.params['id']

    let me = await db.User.findByPk(req._id)

    let user = await db.User.findByPk(id)

    await db.FriendRequest.create({
        UserId: req._id,
        FriendId: id,
        status: 'sent'
    })
    return res.send()
})

module.exports = friends