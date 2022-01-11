const express = require('express')
const db = require('./db')
const { DEBUG } = require('./settings.json')

const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./swagger.yaml')

const server = express()

server.use(express.json({limit: '50mb'}));
server.use(express.urlencoded({limit: '50mb'}));

server.use(express.json())
server.use(express.urlencoded())
server.disable('x-powered-by')

server.use('/api-docs', swaggerUi.serve)
server.get('/api-docs', swaggerUi.setup(swaggerDocument))


const api = require('./router/api')
const api2 = require('./router2/api')


server.use('/api/v1', api)
server.use('/api/v2', api2)

server.get('/', (req, res) => {
    res.send('it works!')
})

if (DEBUG) {
    server.get('/test', async (req, res) => {
        await db.JoinRequest.create({
            status: 'rejected',
            UserId: 1,
            EventId: 1
        })
        res.send()
    })

    const admin = require('./admin')
    server.use('/admin', admin)
}

server.listen(80, async () => {
    if (DEBUG) {
        await db.drop()
    }

    await db.init()

    if (DEBUG) {
        await db.Tag.create({
            title: "tag1"
        })
        await db.Tag.create({
            title: "tag2"
        })
        await db.Tag.create({
            title: "tag3"
        })
    }

    console.log(`http://localhost:${80}`)
})