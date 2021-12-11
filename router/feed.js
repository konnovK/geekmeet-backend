const express = require('express')
const db = require('../db')
const auth = require('../authorization')

const feed = express.Router()
feed.use(express.json())

feed.get('/', [auth], async (req, res) => {
    let events = await db.Event.findAll({
        attributes: ['id', 'name', 'date', 'addressId', 'seats']
    })

    let addresses = await db.Address.findAll({})

    let eventTagRels = await db.EventTagRel.findAll({})
    let tags = await db.Tag.findAll({})

    let result = []

    for (let event of events) {
        let addressName = addresses.filter((address) => address.id === event.addressId)[0].name
        let etrs = eventTagRels.filter((etr) => etr.eventId === event.id)

        // Тэги соответствующие ивенту event
        let eventTagNames = []
        for (let etr of etrs) {
            eventTagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
        }
        result.push({
            id: event.id,
            name: event.name,
            date: event.date,
            tags: eventTagNames,
            address: addressName,
            seats: event.seats
        })
    }

    res.json(result)
})

module.exports = feed