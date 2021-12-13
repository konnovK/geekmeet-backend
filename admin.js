const express = require('express')
const db = require('./db')
const md5 = require('md5')
const moment = require('moment')


const admin = express.Router()
admin.get('/', async (req, res) => {
    try {
        await db.truncate()

        let tag1 = await db.Tag.create({
            title: 'java script'
        })

        let tag2 = await db.Tag.create({
            title: 'gachi'
        })

        let user1 = await db.User.create({
            login: 'admin',
            password: md5('admin'),
            email: 'qq@qq.ru',
            about: 'qwerwgrt hbr hnxrkl gjhzl'
        })

        let user2 = await db.User.create({
            login: 'boy next door',
            password: md5('admin'),
            email: 'qwerty@qwerty.ru'
        })

        await db.UserTagRel.create({
            userId: user2.id,
            tagId: tag1.id
        })

        await db.UserTagRel.create({
            userId: user2.id,
            tagId: tag2.id
        })

        await db.UserTagRel.create({
            userId: user1.id,
            tagId: tag2.id
        })

        let address1 = await db.Address.create({
            name: 'punk',
            address: 'botanicheskaya 66'
        })

        let event1 = await db.Event.create({
            name: 'zashaiba',
            date: moment().add(30, 'days').toDate(),
            addressId: address1.id,
            creatorId: user1.id,
            about: 'qwerty',
            seats: 42
        })

        let event2 = await db.Event.create({
            name: 'para sherbakova',
            date: moment().add(2, 'hours').toDate(),
            addressId: address1.id,
            creatorId: user2.id,
            about: 'qwerty1231',
            seats: 0
        })

        await db.EventTagRel.create({
            eventId: event1.id,
            tagId: tag1.id
        })

        await db.EventTagRel.create({
            eventId: event1.id,
            tagId: tag2.id
        })

        await db.EventTagRel.create({
            eventId: event2.id,
            tagId: tag2.id
        })

        await db.JoinRequest.create({
            userId: user1.id,
            eventId: event2.id,
            accepted: true
        })

        // await db.JoinRequest.create({
        //     userId: user2.id,
        //     eventId: event2.id,
        //     accepted: true
        // })

        // await db.JoinRequest.create({
        //     userId: user1.id,
        //     eventId: event1.id,
        //     accepted: true
        // })

        await db.JoinRequest.create({
            userId: user2.id,
            eventId: event1.id,
            accepted: false
        })

        await db.Favorites.create({
            userId: user1.id,
            eventId: event2.id
        })

        await db.FriendRequest.create({
            fromUserId: user1.id,
            toUserId: user2.id,
            accepted: true
        })


        return res.json({})
    } catch (e) {
        console.log(e)
        return res.status(400).json({})
    }
})



module.exports = admin