const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const auth = require('../authorization')
const moment = require('moment')
const tags = require('./tags')

const feed = express.Router()
feed.use(express.json())
feed.use(auth)

/**
 * Получение ленты ивентов
 */
feed.get('/',  async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let events = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'addressId', 'seats'],
        where: {
            date: {
                [Op.gte]: moment().toDate()
            }
        }
    })

    let addresses = await db.Address.findAll({})

    let eventTagRels = await db.EventTagRel.findAll({})

    let tags = await db.Tag.findAll({})

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

    let result = []

    for (let event of events) {
        let addressName = addresses.filter((address) => address.id === event.addressId)[0].name
        let etrs = eventTagRels.filter((etr) => etr.eventId === event.id)

        // Тэги соответствующие ивенту event
        let eventTagNames = []
        for (let etr of etrs) {
            eventTagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
        }

        let isFavorite = favorites.filter((favorite) => favorite.eventId === event.id).length > 0;

        let jr = jrs.filter((jr) => jr.eventId === event.id)[0]

        let accepted = jr ? jr.accepted : null


        result.push({
            id: event.id,
            name: event.name,
            date: event.date,
            tags: eventTagNames,
            address: addressName,
            seats: event.seats,
            isFavorite: isFavorite,
            accepted: accepted
        })
    }

    res.json(result)
})

/**
 * Получение информации об ивенте по id
 */
feed.get('/:id', async (req, res) => {
    let id = req.params['id']
    let event = await db.Event.findByPk(id)

    if (event === null) {
        return res.status(400).json({message: 'event not exists'})
    }

    let address = await db.Address.findByPk(event.addressId)

    if (address === null) {
        return res.status(400).json({message: 'bad address'})
    }

    let favorites = await db.Favorites.findAll({
        where: {
            userId: req._id,
            eventId: id
        }
    })
    let isFavorite = favorites.length > 0;

    let jrs = await db.JoinRequest.findAll({
        where: {
            userId: req._id,
            eventId: id
        }
    })
    let jr = jrs[0]

    let accepted = jr ? jr.accepted : null

    let result = {
        id: id,
        name: event.name,
        date: event.date,
        about: event.about,
        creatorId: event.creatorId,
        address: {
            name: address.name,
            address: address.address,
            metro: address.metro
        },
        seats: event.seats,
        tags: await tags.getEventTags(id),
        isFavorite: isFavorite,
        accepted: accepted
    }

    return res.json(result)
})

/**
 * Получение участников ивента по id ивента
 */
feed.get('/:id/members', async (req, res) => {
    let id = req.params['id']

    let jrs = await db.JoinRequest.findAll({
        where: {
            eventId: id,
            accepted: true
        }
    })
    let members = []
    jrs.forEach((jr) => members.push(jr.userId))

    return res.json(members)
})

/**
 * Добавление в избранное или удаление из избранного
 */
feed.patch('/:id/favorites', async (req, res) => {
    let eventId = req.params['id']
    let userId = req._id

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let events = await db.Event.findByPk(eventId)
    if (!events) {
        return res.status(400).json({message: 'wrong event id'})
    }

    let favorites = await db.Favorites.findAll({
        where: {
            userId: userId,
            eventId: eventId
        }
    })

    if (favorites.length === 0) {
        await db.Favorites.create({
            userId: userId,
            eventId: eventId
        })
        return res.json({message: 'added to favorites'})
    } else {
        await db.Favorites.destroy({
            where: {
                userId: userId,
                eventId: eventId
            }
        })
        return res.json({message: 'removed from favorites'})
    }
})

/**
 * Запрос на создание ивента
 *
 *  {
 *     "name" : "string",
 *     "about" : "string",
 *     "seats" : "int",
 *     "address" : {
 *          "name" : "string",
 *          "address" : "string",
 *          "metro" : "string"
 *      }
 *  }
 */
feed.post('/create', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let name = req.body.name
    let address = req.body.address
    let about = req.body.about
    let seats = req.body.seats

    if (!name) {
        res.status(400).json({message: 'name is empty'})
    }
    if (!about) {
        res.status(400).json({message: 'about is empty'})
    }
    if (!seats) {
        res.status(400).json({message: 'seats is empty'})
    }
    if (!address) {
        res.status(400).json({message: 'address is empty'})
    } else {
        if (!address.name) {
            res.status(400).json({message: 'address.name is empty'})
        }
        if (!address.address) {
            res.status(400).json({message: 'address.address is empty'})
        }
        if (!address.metro) {
            res.status(400).json({message: 'address.metro is empty'})
        }
    }


    let address1 = await db.Address.create({
        name: address.name,
        address: address.address,
        metro: address.metro ? address.metro : null
    })

    let event1 = await db.Event.create({
        name: name,
        date: moment().toDate(),
        addressId: address1.id,
        creatorId: req._id,
        about: about,
        seats: seats
    })

    res.json({message: `event ${event1.id} has been created`})
})

/**
 * Запрос на создание заявки на ивент
 */
feed.post('/:id/join', async (req, res) => {
    let id = req.params['id']

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let jrs = await db.JoinRequest.findAll({
        where: {
            eventId: id,
            userId: req._id
        }
    })

    if (jrs.length > 0) {
        return res.status(400).json({message: 'join request is already exists'})
    }

    await db.JoinRequest.create({
        eventId: id,
        userId: req._id,
        accepted: false
    })

    return res.json({})
})

module.exports = feed