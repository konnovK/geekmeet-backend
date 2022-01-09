const express = require('express')
const db = require('../db')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const auth = require('../authorization')
const {User, UserTagRel} = require("../db");


const user = express.Router()
user.use(express.json())


let createToken = (user) => {
    let payload = { id: user.id }
    return jwt.sign(payload, "SECRET_KEY_RANDOM", {expiresIn: "7d"})
}


/**
 * Авторизация
 */
user.post('/login', async (req, res) => {
    let {login, password} = req.body
    let passwordHash = md5(password)


    // Валидация
    let user = await db.User.findAll({
        where: {
            login: login
        }
    })
    if (user.length === 0) {
        return res.status(400).json({message: 'user does not exist'})
    }
    if (user[0].password !== passwordHash) {
        return res.status(400).json({message: 'wrong password'})
    }


    let token = createToken(user[0])
    res.json({token: token})
})


/**
 * Регистрация: логин, пароль, эл. почта, о себе
 */
user.post('/register', async (req, res) => {
    let {login, password, email, tags, avatar} = req.body
    let about = req.body.about || ''


    // Валидация
    if ((await db.User.findAll({ where: { login: login } })).length > 0) {
        return res.status(400).json({message: 'user with this login already exists'})
    }
    if ((await db.User.findAll({ where: { email: email } })).length > 0) {
        return res.status(400).json({message: 'user with this email already exists'})
    }


    // Создаем юзера в бд
    let user = await db.User.create({
        login,
        password: md5(password),
        email,
        about,
        avatar
    })

    // Создаем Связи этого юзера с тегами
    // for (const tag_id of tags) {
    //     await db.UserTagRel.create({
    //         userId: user.id,
    //         tagId: tag_id
    //     })
    // }
    await user.addTags(tags)


    let token = createToken(user)
    res.json({token: token})
})


/**
 * Получение пользователя по id
 */
user.get('/:id', [auth], async (req, res) => {
    let _id = req._id

    let id = req.params['id']

    let user = await db.User.findByPk(id)


    // let utrs = (await db.UserTagRel.findAll({
    //     attributes: ['TagId'],
    //     where: {
    //         UserId: id
    //     }
    // })).map(utr => utr.TagId)
    // let tags = await db.Tag.findAll({
    //     where: {
    //         id: {
    //             [Op.in]: utrs
    //         }
    //     }
    // })

    let tags = await db.Tag.findAll({
        include: [{
            model: User,
            where: {
                id: id
            },
            as: UserTagRel,
            attributes: []
        }]
    })

    let friendRequest = await db.FriendRequest.findAll({
        attributes: ['toUserId' , 'status'],
        where: {
            [Op.or]: [
                {
                    fromUserId: _id
                },
                {
                    toUserId: _id
                }
            ]
        }
    })

    let request
    if (friendRequest.length === 0) {
        request = {
            status: 'none'
        }
    } else {
        request = {
            status: friendRequest[0].status,
            target: friendRequest[0].toUserId
        }
    }


    res.json({
        id,
        login: user.login,
        about: user.about,
        avatar: user.avatar,
        tags,
        request
    })
})


/**
 * Изменение информации пользователя о себе
 */
user.patch('/', [auth], async (req, res) => {
    let _id = req._id;

    let body = req.body;

    let non_empty = {}

    for (const [key, value] of Object.entries(body)) {
        if (value) {
            if (key === 'password') {
                non_empty[key] = md5(value)
            } else {
                // TODO: удалять старые теги
                if (key === 'tags') {
                    for (let tag of body[key]) {
                        if ((await db.UserTagRel.findAll({where: {userId: _id, tagId: tag}})).length === 0) {
                            await db.UserTagRel.create({
                                userId: _id,
                                tagId: tag
                            })
                        }
                    }
                } else {
                    non_empty[key] = value
                }
            }
        }
    }


    // Валидация
    if (non_empty["login"] && (await db.User.findAll({ where: { login: non_empty["login"] } })).length > 0) {
        return res.status(400).json({message: 'user with this login already exists'})
    }
    if (non_empty["email"] && (await db.User.findAll({ where: { email: non_empty["email"] } })).length > 0) {
        return res.status(400).json({message: 'user with this email already exists'})
    }

    await db.User.update(non_empty, {
        where: { id: _id }
    })

    res.json()
})


/**
 * Получение информации о себе
 */


module.exports = user