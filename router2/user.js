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
        return res.status(400).json({message: 'user not exists'})
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
        return res.status(400).json({message: 'user with this login существует'})
    }
    if ((await db.User.findAll({ where: { email: email } })).length > 0) {
        return res.status(400).json({message: 'user with this email существует'})
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
    for (const tag_id of tags) {
        let utr = await db.UserTagRel.create({
            userId: user.id,
            tagId: tag_id
        })
    }


    let token = createToken(user)
    res.json({token: token})
})


/**
 * Получение пользователя по id
 */
user.get('/:id', [auth], async (req, res) => {
    let id = req.params['id']

    let user =  await db.User.findByPk(id)

    let utrs = (await db.UserTagRel.findAll({
        attributes: ['tagId'],
        where: {
            userId: id
        }
    })).map(utr => utr.tagId)

    let tags = await db.Tag.findAll({
        where: {
            id: {
                [Op.in]: utrs
            }
        }
    })

    res.json({
        id,
        login: user.login,
        about: user.about,
        avatar: user.avatar,
        tags
    })
})


module.exports = user