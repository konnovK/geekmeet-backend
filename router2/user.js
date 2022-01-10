const express = require('express')
const db = require('../db')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const auth = require('../authorization')


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

    if (tags && tags.length > 0) {
        await user.addTags(tags)
    }

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

    let tags = await user.getTags()
    tags.forEach((tag) => delete tag["dataValues"]["UserTagRel"])

    let friendRequest = await db.FriendRequest.findAll({
        attributes: ['FriendId' , 'status'],
        where: {
            [Op.or]: [
                {
                    UserId: _id
                },
                {
                    FriendId: _id
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
            target: friendRequest[0].FriendId
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

    let user = await db.User.findByPk(_id)

    // Получаем внесенные изменения
    let updates = req.body;

    // Валидация
    if (updates["login"] && (await db.User.findAll({ where: { login: updates["login"] } })).length > 0) {
        return res.status(400).json({message: 'user with this login already exists'})
    }
    if (updates["email"] && (await db.User.findAll({ where: { email: updates["email"] } })).length > 0) {
        return res.status(400).json({message: 'user with this email already exists'})
    }

    // Кодируем пароль
    if (updates["password"]) {
        updates["password"] = md5(updates["password"])
    }

    // Меняем тэги
    if (updates["tags"]) {
        await user.setTags(updates["tags"])
        delete updates["tags"]
    }


    await db.User.update(updates, {
        where: { id: _id }
    })

    res.json()
})


/**
 * Получение информации о себе
 */


module.exports = user