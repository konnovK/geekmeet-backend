const express = require('express')
const db = require('../db')
const auth = require('../authorization')
const tags = require('./tags')
const {Op} = require("sequelize");
const moment = require("moment");

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
        tags: await tags.getUserTags(user.id),
        about: user.about
    }

    return res.json(result)
})

/**
 * Получение списка друзей и количества новых заявок в друзья
 */
profile.get('/friends', async (req, res) => {

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

    let newCount = await db.FriendRequest.count({
        where: {
            toUserId: req._id,
            accepted: false
        }
    })

    return res.json({
        friends: friends,
        newCount: newCount
    })
})

/**
 * Получение списка заявок в друзья
 */
profile.get('/friends/new', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let frs = await db.FriendRequest.findAll({
        where: {
            toUserId: req._id,
            accepted: false
        }
    })

    let newFriends = []
    for (const fr of frs) {
        newFriends.push({
            id: fr.id,
            login: fr.login,
            about: fr.about,
            tags: await tags.getUserTags(fr.id)
        })
    }

    return res.json(newFriends)
})

/**
 * Получение списка ваших ивентов: [избранные, подана заявка, заявка одобрена, вы админ]
 */
profile.get('/events', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let allEvents = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'addressId', 'creatorId', 'seats'],
        where: {
            date: {
                [Op.gte]: moment().toDate()
            }
        }
    })

    let favorites = await db.Favorites.findAll({
        where: {
            userId: req._id
        }
    })
    let jrs = await db.JoinRequest.findAll({
        where: {
            userId: req._id
        }
    })

    // избранные, подана заявка, заявка одобрена, вы админ
    let favEvents = []
    let requestedEvents = []
    let acceptedEvents = []
    let yourEvents = []

    let addresses = await db.Address.findAll({})

    let eventTagRels = await db.EventTagRel.findAll({})

    let tags = await db.Tag.findAll({})
    for (let event of allEvents) {
        // адрес ивента
        let addressName = addresses.filter((address) => address.id === event.addressId)[0].name

        // Тэги соответствующие ивенту event
        let etrs = eventTagRels.filter((etr) => etr.eventId === event.id)

        let eventTagNames = []
        for (let etr of etrs) {
            eventTagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
        }

        // Собираем компоненту ивента
        let eventComponent = {
            id: event.id,
            name: event.name,
            date: event.date,
            tags: eventTagNames,
            address: addressName,
            seats: event.seats
        }

        // Проверяем, если пользователь - создатель ивента
        // Если да, добавляем в компоненту число новых заявок на ивент
        // Если нет, проверяем, на избранное и подачу заявки
        if (event.creatorId === req._id) {
            eventComponent.isAdmin = true
            eventComponent.newRequests = await db.JoinRequest.count({
                where: {
                    eventId: event.id,
                    accepted: false
                }
            })
            yourEvents.push(eventComponent)
        } else {
            let isFavorite = favorites.filter((favorite) => favorite.eventId === event.id).length > 0;

            let jr = jrs.filter((jr) => jr.eventId === event.id)[0]

            let accepted = jr ? jr.accepted : null
            eventComponent.isFavorite = isFavorite
            eventComponent.accepted = accepted

            if (isFavorite) {
                favEvents.push(eventComponent)
            }
            if (accepted !== null) {
                if (!accepted) {
                    requestedEvents.push(eventComponent)
                } else {
                    acceptedEvents.push(eventComponent)
                }
            }
        }
    }

    // Возвращаем объект с ивентами, разбитыми по разделам
    return res.json({
        favEvents: favEvents,
        requestedEvents: requestedEvents,
        acceptedEvents: acceptedEvents,
        yourEvents: yourEvents
    })
})

/**
 * Принять/отклонить заявку в друзья
 */
// profile.patch('/friends/new', async (req, res) => {
//
//     if (!req._id) {
//         return res.status(401).json({message: 'authorization error'})
//     }
//
//
// })

module.exports = profile