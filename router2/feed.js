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
        where: {
            date: {
                [Op.gte]: moment().toDate()
            },
            id: {
                [Op.in]: (await db.ViewedEvents.findAll({where: {UserId: req._id}})).map(ve => ve.EventId)
            }
        }
    })

    let addresses = await db.Address.findAll({})

    let favorites = await db.Favorites.findAll({
        where: {
            userId: req._id
        }
    })


    let result = []

    for (let event of events) {
        let addressName = addresses.filter((address) => address.id === event.addressId)[0].name

        // Тэги соответствующие ивенту event
        let tags = await event.getTags()
        tags.forEach((tag) => delete tag["dataValues"]["EventTagRel"])

        let isFavorite = favorites.filter((favorite) => favorite.eventId === event.id).length > 0;

        result.push({
            id: event.id,
            name: event.name,
            date: event.date,
            address: addressName,
            photo: event.photo,
            seats: event.seats,
            tags: tags,
            isFavorite: isFavorite,
            request: await db.JoinRequest.findOne({attributes: ['status'], where: {UserId: req._id, EventId: event.id}})
        })
    }

    // console.log(result)
    res.json(result)
})


/**
 * Получение новых ивентов (свайпер)
 */
feed.get('/new', async (req, res) => {

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
                [Op.notIn]: (await user.getViewed()).map(event => event.id)
            }
        },
        include: [{
            model: Address,
            attributes: {exclude: ['id']}
        }]
    })

    user.addViewed(events)

    res.json(events)
})


module.exports = feed