const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const moment = require('moment')
const auth = require('../authorization')
const {Address} = require("../db");


const feed = express.Router()
feed.use(express.json())
feed.use(auth)


/**
 * Получение ленты ивентов
 * @returns
 * [
 *   {
 *     "id": 0,
 *     "name": "string",
 *     "date": "string",
 *     "address": "string",
 *     "photo": "string",
 *     "seats": 0,
 *     "tags": [
 *       {
 *         "id": 0,
 *         "title": "string"
 *       }
 *     ],
 *     "isFavorite": true,
 *     "request": {
 *       "status": "string"
 *     }
 *   }
 * ]
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
 * Получение новых ивентов (свайпер)
 */
feed.get('/new',[auth], async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let user = await db.User.findByPk(req._id)

    let events = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'photo'],
        where: {
            date: {
                [Op.gte]: moment().toDate()
            },
            id: {
                [Op.notIn]: (await user.getEvents()).map(event => event.id)
            }
        },
        include: [{
            model: Address,
            attributes: {exclude: ['id']}
        }]
    })

    user.addEvents(events)

    res.json(events)
})


module.exports = feed