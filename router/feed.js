const express = require('express')
const db = require('../db')
const auth = require('../authorization')

const feed = express.Router()
feed.use(express.json())
feed.use(auth)

feed.get('/',  async (req, res) => {
    let events = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'addressId', 'seats']
    })

    let addresses = await db.Address.findAll({})

    let eventTagRels = await db.EventTagRel.findAll({})
    let tags = await db.Tag.findAll({})

    let result = []

    for (let event of events) {
        let addressName = addresses.filter((address) => address.id === event.addressId)[0].name
        let etrs = eventTagRels.filter((etr) => etr.eventId === event.id)

        // Тэги соответствующие ивенту event
        let eventTagNames = []
        for (let etr of etrs) {
            eventTagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
        }
        result.push({
            id: event.id,
            name: event.name,
            date: event.date,
            tags: eventTagNames,
            address: addressName,
            seats: event.seats
        })
    }

    res.json(result)
})

feed.get('/:id', async (req, res) => {
    let id = req.params['id']
    let event = await db.Event.findByPk(id)

    if (event === null) {
        return res.status(400).json({message: 'event not exists'})
    }

    let eventTagRels = await db.EventTagRel.findAll({
        where: {
            eventId: id
        }
    })
    let tags = await db.Tag.findAll({})

    let eventTagNames = []
    eventTagRels.forEach((etr) => {
        eventTagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
    })

    let address = await db.Address.findByPk(event.addressId)

    if (address === null) {
        return res.status(400).json({message: 'bad address'})
    }

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
        tags: eventTagNames
    }

    return res.json(result)
})

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
feed.patch('/:id', async (req, res) => {
    let eventId = req.params['id']
    let userId = req._id

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
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