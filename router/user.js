const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const fileUpload = require('express-fileupload');


const user = express.Router()
user.use(express.json())

user.use(fileUpload({}))
user.use(express.static('public'))



let createToken = (user) => {

    let payload = {
        id: user.id
    }
    return jwt.sign(payload, "SECRET_KEY_RANDOM", {expiresIn: "7d"})
}

let hashPassword = (password) => {
    // return password
    return md5(password)
}


user.post('/login', async (req, res) => {
    let login = req.body.login
    let password = req.body.password

    if (!login) {
        res.status(400).json({message: 'login is empty'})
        return;
    }
    if (!password) {
        res.status(400).json({message: 'password is empty'})
        return;
    }

    let passwordHash = hashPassword(password)

    let user = await db.User.findAll({
        where: {
            login: login
        }
    })


    if (user.length === 0) {
        res.status(400).json({message: 'user not exists'})
        return;
    }


    if (user[0].password !== passwordHash) {
        res.status(400).json({message: 'wrong password'})
        return;
    }

    let token = createToken(user[0])

    res.json({token: token})
})


user.post('/register', async (req, res) => {
    let {login, password, email} = req.body
    let about = req.body.about || ''

    if (!login) {
        res.status(400).json({message: 'login is empty'})
        return;
    }
    if (!password) {
        res.status(400).json({message: 'password is empty'})
        return;
    }
    if (!email) {
        res.status(400).json({message: 'email is empty'})
        return;
    }

    let passwordHash = hashPassword(password)

    let user = await db.User.create({
        login,
        password: passwordHash,
        email,
        about
    })

    res.json({
        id: user.id,
        login: user.login
    })
})


user.put('/register', async (req, res) => {
    await req.files.avatar.mv('/public' + req.files.avatar.name)
    let filename = req.files.avatar.name
    let login = req.body.login
    if (!login) {
        res.status(400).json({message: 'login is empty'})
        return;
    }
    await db.User.update({avatar: filename}, {
        where: {
            login: login
        }
    })
    res.status(200).json({avatar: filename})
})


user.get('/:id', async (req, res) => {
    let id = req.params['id']

    let user = await db.User.findAll({
        attributes: ['id', 'login', 'email', 'about'],
        where: {
            id: id
        }
    })

    if (user.length === 0) {
        res.status(400).json({message: 'user not exists'})
    } else {
        res.json(user[0])
    }
})


module.exports = user