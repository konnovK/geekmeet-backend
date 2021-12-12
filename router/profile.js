const express = require('express')
const db = require('../db')
const auth = require('../authorization')

const profile = express.Router()
profile.use(express.json())
profile.use(auth)

/**
 * Информация о пользователе (Вы)
 */
profile.get('/', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let user = await db.User.findByPk(req._id)
    if (user === null) {
        return res.status(400).json({message: 'user not exists'})
    }

    let result = {
        id: user.id,
        login: user.login,
        // TODO: add tags
        // было лень делать тэги
        about: user.about
    }

    return res.json(result)
})

/**
 * Получение списка друзей
 */
profile.get('/', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    // Ваш id = fromUserId, id друга = toUserId
    let frs1 = await db.FriendRequest.findAll({
        where: {
            fromUserId: req._id,
            accepted: true
        }
    })

    // Ваш id = toUserId, id друга = fromUserId
    let frs2 = await db.FriendRequest.findAll({
        where: {
            toUserId: req._id,
            accepted: true
        }
    })

    let friends = []
    // Список друзей по заявкам от Вас к ним
    frs1.forEach((frs) => {
        if (!friends.includes(frs.toUserId)) {
            friends.push(frs.toUserId)
        }
    })
    // Список друзей по заявкам от них к Вам
    frs2.forEach((frs) => {
        if (!friends.includes(frs.fromUserId)) {
            friends.push(frs.fromUserId)
        }
    })

    return res.json(friends)
})

/**
 * Получение списка заявок в друзья
 */
// profile.get('/', async (req, res) => {
//
// })

/**
 * Получение списк
 */
// profile.get('/', async (req, res) => {
//
// })

module.exports = profile