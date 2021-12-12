const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const fileUpload = require('express-fileupload');


const user = express.Router()
user.use(express.json())

user.use(express.static('public'))
user.use(fileUpload({}))


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

    let users = await db.User.findAll({
        where: {
            login: login
        }
    })

    if (users.length > 0) {
        return res.status(400).json({message: 'user with this login существует'})
    }

    users = await db.User.findAll({
        where: {
            email: email
        }
    })

    if (users.length > 0) {
        return res.status(400).json({message: 'user with this email существует'})
    }

    let passwordHash = hashPassword(password)

    let user = await db.User.create({
        login,
        password: passwordHash,
        email,
        about
    })

    let token = createToken(user)
    res.json({token: token})
})


user.put('/register', async (req, res) => {
    // TODO: проверить имена на уникальность
    await req.files.avatar.mv('/public/' + req.files.avatar.name)
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

const auth = require('../authorization')
user.get('/:id', [auth], async (req, res) => {
    let id = req.params['id']

    if (!req._id) {
        return res.status(401).json({message: 'authorization error'})
    }

    let frs1 = await db.FriendRequest.findAll({
        where: {
            fromUserId: req._id,
            toUserId: id,
            accepted: true
        }
    })

    let frs2 = await db.FriendRequest.findAll({
        where: {
            fromUserId: id,
            toUserId: req._id,
            accepted: true
        }
    })

    let isFriend = frs1.length > 0 || frs2.length > 0


    let user = await db.User.findAll({
        attributes: ['id', 'login', 'email', 'about'],
        where: {
            id: id
        }
    })



    if (user.length === 0) {
        res.status(400).json({message: 'user not exists'})
    } else {
        let _user = user[0]

        let tagNames = []

        let tags = await db.Tag.findAll({})
        let etrs = await db.UserTagRel.findAll({
            where: {
                userId: _user.id
            }
        })
        etrs.forEach((etr) =>
            tagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
        )

        let result = {
            isFriend: isFriend,
            id: _user.id,
            login: _user.login,
            about: _user.about,
            tags: tagNames
        }

        res.json(result)
    }
})


module.exports = user