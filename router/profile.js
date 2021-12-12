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
        tags: tags.getUserTags(user.id),
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
profile.get('/', async (req, res) => {

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
    frs.forEach((frs) => {
        newFriends.push({
            id: frs.id,
            login: frs.login,
            about: frs.about,
            tags: tags.getUserTags(frs.id)
        })
    })

    return res.json(newFriends)
})

/**
 * Получение списка ваших ивентов: [избранные, подана заявка, заявка одобрена, вы админ]
 */
profile.get('/', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let allEvents = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'addressId', 'seats'],
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
        // Если да, добавляем в компоненту соответствующее значение
        // Если нет, проверяем, на избранное и подачу заявки
        if (event.creatorId === req._id) {
            eventComponent.isAdmin = true
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
            if (!accepted) {
                requestedEvents.push(eventComponent)
            } else {
                acceptedEvents.push(eventComponent)
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

module.exports = profile