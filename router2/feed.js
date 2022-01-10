const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const moment = require('moment')
const auth = require('../authorization')
const {Address, User, Tag, EventTagRel} = require("../db");


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

    let _id = req._id

    if (!_id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let events = await db.Event.findAll({
        where: {
            date: {
                [Op.gte]: moment().toDate()
            },
            // Проверка условий для связанных таблиц
            '$Creator.id$': {[Op.ne]: _id},     // возвращает ивенты, созданные другими пользователями
            '$Viewed.id$': {[Op.eq]: _id}       // возвращает просмотренные ивенты
        },
        include: [
            // Подключаем юзера-создателя
            {
                model: User,
                as: "Creator",
                attributes: []
            },
            // Подключаем просмотренные ивенты
            {
                model: User,
                as: "Viewed",
                attributes: []
            },
            // Подключаем адрес
            {
                model: Address,
                attributes: ["name"]
            },
            // Подключаем тэги
            {
                model: Tag,
                as: EventTagRel,
                through: {attributes: []}
            },
            // Подключаем joinRequests
            {
                model: User,
                as: "Member",
                attributes: ["id"],
                through: {
                    attributes: ["status"],
                    where: {
                        UserId: _id
                    }
                }
            },
            // Подключаем favorites
            {
                model: User,
                as: "Favorite",
                attributes: ["id"],
                through: {
                    attributes: [],
                    where: {
                        UserId: _id
                    }
                }
            }
        ]
    })

    // let favorites = await db.Favorites.findAll({
    //     where: {
    //         userId: _id
    //     }
    // })


    let result = []

    for (let event of events) {

        // let isFavorite = favorites.filter((favorite) => favorite.eventId === event.id).length > 0;

        let request = event.Member
        if (request.length === 0) {
            request = null
        }

        result.push({
            id: event.id,
            name: event.name,
            date: event.date,
            address: event.Address.name,
            photo: event.photo,
            seats: event.seats,
            tags: event.Tags,
            isFavorite: event.Favorite.length === 1,
            request: request
        })
    }

    res.json(result)
})


/**
 * Получение новых ивентов (свайпер)
 */
feed.get('/new', async (req, res) => {

    let _id = req._id

    if (!_id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let user = await db.User.findByPk(_id)

    let events = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'photo'],
        where: {
            date: {
                [Op.gte]: moment().toDate()
            },
            id: {
                [Op.notIn]: (await user.getViewed()).map(event => event.id)
            },
            '$Creator.id$': {[Op.ne]: _id},     // возвращает ивенты, созданные другими пользователями
        },
        include: [
            {
                model: User,
                as: "Creator",
                attributes: []
            },
            {
                model: Address,
                attributes: {exclude: ['id']}
            }
        ]
    })

    await user.addViewed(events)

    res.json(events)
})


module.exports = feed