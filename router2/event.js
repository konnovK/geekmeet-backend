const express = require('express')
const db = require('../db')
const auth = require('../authorization')
const moment = require('moment')

const event = express.Router()
event.use(express.json())
event.use(auth)


/**
 * Создание нового ивента
 */
event.post('/create', async (req, res) => {

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
        date: moment().add(30, 'days').toDate(),
        addressId: address1.id,
        creatorId: req._id,
        about: about,
        photo: photo,
        seats: seats
    })

    await event.addTags(tags)

    res.json({message: `event ${event.id} has been created`})
})


module.exports = event