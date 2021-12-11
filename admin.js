const express = require('express')
const db = require('./db')
const md5 = require('md5')


const admin = express.Router()
admin.get('/', async (req, res) => {
    try {
        await db.truncate()

        let user1 = await db.User.create({
            login: 'admin',
            password: md5('admin'),
            email: 'qq@qq.ru'
        })

        let tag1 = await db.Tag.create({
            title: 'java script'
        })

        let tag2 = await db.Tag.create({
            title: 'gachi'
        })

        let address1 = await db.Address.create({
            name: 'punk',
            address: 'botanicheskaya 66'
        })

        let event1 = await db.Event.create({
            name: 'zashaiba',
            date: new Date(),
            addressId: address1.id,
            creatorId: user1.id,
            about: 'qwerty',
            seats: 42
        })

        await db.EventTagRel.create({
            eventId: event1.id,
            tagId: tag1.id
        })

        await db.EventTagRel.create({
            eventId: event1.id,
            tagId: tag2.id
        })

        return res.json({})
    } catch (e) {
        console.log(e)
        return res.status(400).json({})
    }
})



module.exports = admin