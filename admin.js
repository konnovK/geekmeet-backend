const express = require('express')
const db = require('./db')
const md5 = require('md5')
const moment = require('moment')


const admin = express.Router()
admin.get('/', async (req, res) => {
    try {
        await db.truncate()

        let tag1 = await db.Tag.create({
            title: 'кино'
        })

        let tag2 = await db.Tag.create({
            title: 'программирование'
        })

        let user1 = await db.User.create({
            login: 'admin',
            password: md5('admin'),
            email: 'qq@qq.ru',
            about: 'Админ этого сервера'
        })

        let user2 = await db.User.create({
            login: 'Shoshanna',
            password: md5('admin'),
            email: 'qwerty@qwerty.ru',
            about: 'Убийственная красотка!'
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
            name: 'ПУНК',
            address: 'Ботаническая 66'
        })

        let event1 = await db.Event.create({
            name: 'Зашайба',
            date: moment().add(30, 'days').toDate(),
            addressId: address1.id,
            creatorId: user1.id,
            about: 'Времяпрепровождение несоотвествующее высокому статусу универсанта',
            seats: 42
        })

        let event2 = await db.Event.create({
            name: 'Пара Посова',
            date: moment().add(2, 'hours').toDate(),
            addressId: address1.id,
            creatorId: user2.id,
            about: 'Учим Хаскель вместе :)',
            seats: 15
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

        let user3 = await db.User.create({
            login: 'StudentX',
            password: md5('admin'),
            email: 'abc@abc.ru',
            about: 'Любитель поспать'
        })

        let event3 = await db.Event.create({
            name: 'Спящая туса',
            date: moment().add(1, 'days').toDate(),
            addressId: address1.id,
            creatorId: user3.id,
            about: 'Вся команда ляжет поспать и выспится',
            seats: 9
        })

        let tag3 = await db.Tag.create({
            title: 'сон'
        })

        await db.EventTagRel.create({
            eventId: event3.id,
            tagId: tag3.id
        })

        await db.JoinRequest.create({
            userId: user1.id,
            eventId: event3.id,
            accepted: true
        })

        await db.JoinRequest.create({
            userId: user2.id,
            eventId: event3.id,
            accepted: true
        })

        await db.PrivateMessage.create({
            fromUserId: user2.id,
            toUserId: user1.id,
            date: moment().toDate(),
            messageText: "Как дела, сладкий?"
        })

        await db.GroupMessage.create({
            fromUserId: user3.id,
            eventId: event3.id,
            date: moment().toDate(),
            messageText: "Предлагаю всем собраться и дружно выспаться!"
        })

        await db.PrivateMessage.create({
            fromUserId: user1.id,
            toUserId: user2.id,
            date: moment().toDate(),
            messageText: "Все хорошо! А у тебя как, дорогая?"
        })

        await db.PrivateMessage.create({
            fromUserId: user1.id,
            toUserId: user3.id,
            date: moment().toDate(),
            messageText: "Где деньги, Лебовски?"
        })

        await db.GroupMessage.create({
            fromUserId: user2.id,
            eventId: event3.id,
            date: moment().toDate(),
            messageText: "Ооо, давайте! Я так устала писать фронт..."
        })

        await db.GroupMessage.create({
            fromUserId: user1.id,
            eventId: event3.id,
            date: moment().toDate(),
            messageText: "Если ваша туса не похожа на эту, даже не зовите меня"
        })

        await db.GroupMessage.create({
            fromUserId: user3.id,
            eventId: event3.id,
            date: moment().toDate(),
            messageText: "Ахаха, берите свои пижамы и тапочки!"
        })

        await db.PrivateMessage.create({
            fromUserId: user2.id,
            toUserId: user1.id,
            date: moment().toDate(),
            messageText: "Замечательно! Я посмотрела такой классный фильм"
        })



        return res.json({})
    } catch (e) {
        console.log(e)
        return res.status(400).json({})
    }
})



module.exports = admin