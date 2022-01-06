const express = require('express')
const db = require('./db')

const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./swagger.yaml')

const server = express()

const DEBUG = true


server.use(express.json())
server.use(express.urlencoded())
server.disable('x-powered-by')

server.use('/api-docs', swaggerUi.serve)
server.get('/api-docs', swaggerUi.setup(swaggerDocument))


const api = require('./router/api')
const api2 = require('./router2/api')


server.use('/api/v1', api)
server.use('/api/v2', api2)


if (DEBUG) {
    const admin = require('./admin')
    server.use('/admin', admin)
}

server.get('/', (req, res) => {
    res.send('it works!')
})


server.listen(80, async () => {
    if (DEBUG) {
        await db.drop()
    }
    await db.init()
    console.log(`http://localhost:${80}`)
})