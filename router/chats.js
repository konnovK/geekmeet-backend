const express = require('express')
const db = require('../db')
const auth = require('../authorization')

const chats = express.Router()
chats.use(express.json())
chats.use(auth)


/**
 * Получение всех чатов для списка чатов
 *
 *  {
 *      privates: [
 *          {
 *              id,
 *              with,
 *              withId,
 *              lastMessage: {
 *                  messageText,
 *                  date
 *              }
 *          }
 *      ],
 *      groups: [
 *          {
 *              id,
 *              eventId,
 *              eventTitle,
 *              lastMessage: {
 *                  authorLogin,
 *                  messageText,
 *                  date
 *              }
 *          }
 *      ]
 *  }
 */
chats.get('/', (req, res) => {

})

/**
 * Получение всех сообщений из личной переписки с данным пользователем
 */
chats.get('/private/:id', (req, res) => {
    let id = req.params['id']


})

/**
 * Получение всех сообщений из чата
 */
chats.get('/group/:id', async (req, res) => {
    let id = req.params['id']

    let gms = await db.GroupMessage.findAll({
        where: {
            eventId: id
        }
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