const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const auth = require('../authorization')
const {Tag} = require("../db");

let friends = express.Router()
friends.use(express.json())
friends.use(auth)


/**
 * Получить все заявки в друзья
 */
friends.get('/', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let requestIds = (await db.FriendRequest.findAll({
        where: {
            FriendId: req._id,
            status: 'sent'
        }
    })).map(request => request.UserId)

    let users = (await db.User.findAll({
        attributes: ['id', 'avatar', 'login', 'about'],
        where: {
            id: {
                [Op.in]: requestIds
            }
        },
        include: {
            model: Tag,
            as: 'tags',
            through: {attributes: []}
        }
    }))

    res.json(users)
})


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
        if (request.UserId === req._id) {
            await request.destroy()
            return res.json({message: 'delete request'})
        } else {
            return res.status(400).json({message: `user ${id} has already sent friend request to you`})
        }
    } else {
        await db.FriendRequest.create({
            UserId: req._id,
            FriendId: id,
            status: 'sent'
        })
        return res.json({message: 'create request'})
    }
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


/**
 * Удалить чела из друзей
 */
friends.delete('/:id', async (req, res) => {
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

    if (!request) {
        return res.status(400).json({message: 'request is none'})
    }

    if (request.status === 'accepted') {
        await request.destroy()
    } else {
        return res.status(400).json({message: 'he is not your friend'})
    }

    res.send()
})




module.exports = friends