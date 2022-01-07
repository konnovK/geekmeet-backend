const express = require('express')
const db = require('../db')
const { Op } = require('sequelize')
const auth = require('../authorization')


const tag = express.Router()
tag.use(express.json())


/**
 * Получение всех тэгов
 */
tag.get('/', async (req, res) => {
    let tags = await db.Tag.findAll({})
    res.json(tags)
})


tag.post('/', [auth], async (req, res) => {
    let title = req.body.title

    if (!title) {
        return res.status(400).json({'message': 'title is empty'})
    }

    if ((await db.Tag.findAll({where: {title}})).length > 0) {
        return res.status(400).json({'message': 'wrong title'})
    }


    await db.Tag.create({title})

    res.json({})
})


module.exports = tag