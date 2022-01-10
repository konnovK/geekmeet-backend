const express = require('express')
const db = require('../db')
const auth = require('../authorization')
const {User, Address, Tag, EventTagRel} = require("../db");

const event = express.Router()
event.use(express.json())
event.use(auth)



/**
 * Создание нового ивента
 */
event.post('/', async (req, res) => {

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let {name, date, seats, address, tags, about, photo} = req.body

    // Проверка
    if (!name) {
        res.status(400).json({message: 'name is empty'})
    }
    if (!date) {
        res.status(400).json({message: 'date is empty'})
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
    }

    // Проверка на адрес, повторяющийся в БД
    let address1 = {}
    let existingAddress = await db.Address.findOne({
        where: {
            name: address.name,
            address: address.address
        }
    })

    // Если адрес уже есть в БД, используем его ID,
    // если нет - записываем его в БД и используем ID
    if (existingAddress) {
        address1.id = existingAddress.id
    } else {
        address1 = await db.Address.create({
            name: address.name,
            address: address.address,
            metro: address.metro ? address.metro : null
        })
    }

    let event = await db.Event.create({
        name: name,
        date: date,
        addressId: address1.id,
        creatorId: req._id,
        about: about,
        photo: photo,
        seats: seats
    })

    await event.addTags(tags)

    res.json({message: `event ${event.id} has been created`})
})



/**
 * Получение информации об ивенте по id
 */
event.get('/:id', async (req, res) => {
    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let event = await db.Event.findByPk(req.params['id'], {
        attributes: {
            exclude: ["creatorId", "addressId"]
        },
        include: [
            // Подключаем юзера-создателя
            {
                model: User,
                as: "Creator",
                attributes: ["id", "avatar"]
            },
            // Подключаем адрес
            {
                model: Address,
                attributes: {exclude: ['id']}
            },
            // Подключаем тэги
            {
                model: Tag,
                as: EventTagRel,
                through: {attributes: []}
            },
            // Подключаем участников
            {
                model: User,
                as: "Member",
                attributes: ["id", "avatar"],
                through: {
                    attributes: [],
                    where: {
                        status: 'accepted'
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
                        UserId: req._id
                    }
                }
            }
        ]
    })

    // request
    let request = await db.JoinRequest.findOne({
        where: {
            UserId: req._id,
            EventId: event.id,
        },
        attributes: ["status"]
    })

    let result = {
        id: event.id,
        photo: event.photo,
        name: event.name,
        tags: event.Tags,
        seats: event.seats,
        date: event.date,
        address: event.Address,
        creator: event.Creator,
        about: event.about,
        members: event.Member,
        isFavorite: event.Favorite.length === 1,
        request: request
    }

    res.json(result)
})


/**
 * Редактирование ивента
 */
event.patch('/:id', async (req, res) => {
    let _id = req._id;
    let event = await db.Event.findByPk(req.params['id'])

    // Валидация
    if (!_id || event.creatorId !== _id) {
        return res.status(401).json({message: 'authorization error'})
    }

    // Получаем внесенные изменения
    let updates = req.body;

    // Меняем адрес
    if (updates["address"]) {
        // Проверка на адрес, повторяющийся в БД
        let address = updates["address"]
        let existingAddress = await db.Address.findOne({
            where: {
                name: address.name,
                address: address.address
            }
        })

        // Если адрес уже есть в БД, используем его ID,
        // если нет - записываем его в БД и используем ID
        if (existingAddress) {
            address.id = existingAddress.id
        } else {
            address = await db.Address.create({
                name: address.name,
                address: address.address,
                metro: address.metro ? address.metro : null
            })
        }

        // добавляем к измнениям айди нового адреса и удаляем сам адрес
        updates["addressId"] = address.id
        delete updates["address"]
    }

    // Меняем тэги
    if (updates["tags"]) {
        await event.setTags(updates["tags"])
        delete updates["tags"]
    }


    await db.Event.update(updates, {
        where: { id: event.id }
    })

    res.json()
})



/**
 * Удаление ивента
 */
event.delete('/:id', async (req, res) => {
    let _id = req._id;
    let event = await db.Event.findByPk(req.params['id'])

    // Валидация
    if (!_id || event.creatorId !== _id) {
        return res.status(401).json({message: 'authorization error'})
    }

    await db.Event.destroy({
        where: {
            id: event.id
        }
    })

    res.json()
})



module.exports = event