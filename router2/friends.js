const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const auth = require('../authorization')

let friends = express.Router()
friends.use(express.json())
friends.use(auth)


/**
 * Создать или удалить заявку в друзья
 */
friends.post('/:id', async (req, res) => {
    let id = req.params['id']

    let request = await db.FriendRequest.findOne({
        where: {
            [Op.or]: [
                {
                    UserId: req._id,
                    FriendId: id
                },
                {
                    UserId: id,
                    FriendId: req._id
                }
            ]
        }
    })
    if (request) {
        if (request.status === 'accepted') {
            return res.status(400).json({message: 'request is already accepted'})
        }
        if (request.status === 'rejected') {
            return res.status(400).json({message: 'request is already rejected'})
        }
        await request.destroy()
    } else {
        await db.FriendRequest.create({
            UserId: req._id,
            FriendId: id,
            status: 'sent'
        })
    }


    return res.send()
})


/**
 * Принять заявку в друзья
 */
friends.patch('/:id/accept', async (req, res) => {
    let id = req.params['id']

    let request = await db.FriendRequest.findOne({
        where: {
            UserId: id,
            FriendId: req._id
        }
    })

    if (!request) {
        return res.status(400).json({message: 'request is none'})
    }

    await request.update({status: 'accepted'})

    res.send()
})



/**
 * Отклонить заявку в друзья
 */
friends.patch('/:id/reject', async (req, res) => {
    let id = req.params['id']

    let request = await db.FriendRequest.findOne({
        where: {
            UserId: id,
            FriendId: req._id
        }
    })

    if (!request) {
        return res.status(400).json({message: 'request is none'})
    }

    await request.update({status: 'rejected'})

    res.send()
})

module.exports = friends