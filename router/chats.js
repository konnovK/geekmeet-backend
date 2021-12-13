const express = require('express')
const db = require('../db')
const auth = require('../authorization')
const { Op } = require("sequelize");

const chats = express.Router()
chats.use(express.json())
chats.use(auth)


/**
 * Получение всех чатов для списка чатов
 * @returns [{
 *     chatId: int,
 *     isGroupChat: boolean,
 *     chatName: string,
 *     lastMessage: {
 *         text: string,
 *         author: string ('Вы:' / 'ник:'),
 *         date: date
 *     }
 * }]
 */
chats.get('/', async (req, res) => {
    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    // ЛИЧНЫЕ ЧАТЫ

    // все сообщения с нами в порядке уменьшения даты (от новых к старым)
    // чтобы проверка на повторения собеседников была легче
    let allPrivateMessages = await db.PrivateMessage.findAll({
        where: {
            [Op.or]: [{fromUserId: req._id}, {toUserId: req._id}]
        },
        order: [
            ['date', 'DESC']
        ]
    })

    let privateChats = []
    for (const pm of allPrivateMessages) {
        let userId;

        // get user and author from message
        if (pm.fromUserId === req._id) {
            userId = pm.toUserId
        } else {
            userId = pm.fromUserId
        }

        // if user not in chats => add
        if (privateChats.filter((chat) => chat.chatId === userId).length === 0) {
            let author;
            let user = await db.User.findByPk(userId)   // вызывается только если юзер еще не в чатах

            if (pm.fromUserId === req._id) {
                author = "Вы"
            } else {
                author = user.login
            }

            privateChats.push({
                chatId: user.id,
                isGroupChat: false,
                chatName: user.login,
                lastMessage: {
                    text: pm.messageText,
                    author: author,
                    date: pm.date
                }
            })
        }
    }

    // ГРУППОВЫЕ ЧАТЫ

    // ивенты, в которые вас приняли
    let acceptedEvents = await db.JoinRequest.findAll({
        attributes: ['eventId'],
        where: {
            userId: req._id,
            accepted: true
        }
    })

    // ваши ивенты
    let yourEvents = await db.Event.findAll({
        attributes: ['id'],
        where: {
            creatorId: req._id
        }
    })

    let allEventIds = []
    acceptedEvents.forEach((ev) => allEventIds.push(ev.eventId))
    yourEvents.forEach((ev) => allEventIds.push(ev.eventId))

    // либо ваши ивенты, либо ивенты, в которые вас приняли
    let allEvents = await db.Event.findAll({
        attributes: ['id', 'name'],
        where: {
            id: {
                [Op.in]: allEventIds
            }
        }
    })

    let allGroupMessages = await db.GroupMessage.findAll({
        where: {
            eventId: {
                [Op.in]: allEventIds
            }
        },
        order: [
            ['date', 'DESC']
        ]
    })

    let groupChats = []
    for (const gm of allGroupMessages) {
        let event = allEvents.find((ev) => ev.id === gm.eventId)

        if (groupChats.filter((chat) => chat.chatId === event.id).length === 0) {
            let author = await db.User.findByPk(gm.fromUserId)  // вызывается только если ивент еще не в чатах

            groupChats.push({
                chatId: event.id,
                isGroupChat: true,
                chatName: event.name,
                lastMessage: {
                    text: gm.messageText,
                    author: author.login,
                    date: gm.date
                }
            })
        }
    }

    // Объединяем личные чаты и групповые, чтобы отсортировать по времени последних сообщениий
    // От новых чатов к старым
    let allChats
    allChats = privateChats.concat(groupChats)
    allChats.sort(function (a, b) {
        return ((a.lastMessage.date > b.lastMessage.date) ? -1 : ((a.lastMessage.date === b.lastMessage.date) ? 0 : 1));
    })

    if (allChats) {
        return res.json(allChats)
    }
})

/**
 * Получение всех сообщений из личной переписки с данным пользователем
 */
// chats.get('/private/:id', (req, res) => {
//     let id = req.params['id']
//
//
// })

/**
 * Получение всех сообщений из чата
 */
chats.get('/group/:id', async (req, res) => {
    let id = req.params['id']

    let gms = await db.GroupMessage.findAll({
        where: {
            eventId: id
        },
        order: [
            ['date', 'DESC']
        ]
    })

    let result = []

    gms.forEach((gm) => {
        result.push({
            id: gm.id,
            fromUserId: gm.fromUserId,
            eventId: gm.eventId,
            date: gm.date,
            messageText: gm.messageText
        })
    })

    return res.json(result)
})

/**
 * отправка сообщений пользователю
 */
chats.post('/private', async (req, res) => {
    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let id = req.body.id

    let text = req.body.text

    if (!id) {
        return res.status(400).json({message: 'id is empty'})
    }

    if (!text) {
        return res.status(400).json({message: 'text is empty'})
    }

    await db.PrivateMessage.create({
        fromUserId: req._id,
        toUserId: id,
        date: new Date(),
        messageText: text
    })
    return res.json({})

})

/**
 * отправка сообщений в чат
 */
chats.post('/group', async (req, res) => {
    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let id = req.body.id

    let text = req.body.text

    if (!id) {
        return res.status(400).json({message: 'id is empty'})
    }

    if (!text) {
        return res.status(400).json({message: 'text is empty'})
    }

    await db.GroupMessage.create({
        fromUserId: req._id,
        eventId: id,
        date: new Date(),
        messageText: text
    })
    return res.json({})
})




module.exports = chats