const express = require('express')
const db = require('./db')

const server = express()

const DEBUG = true


server.use(express.json())
server.use(express.urlencoded())
server.disable('x-powered-by')



const api = require('./router/api')


server.use('/api/v1', api);


if (DEBUG) {
    const admin = require('./admin')
    server.use('/admin', admin)
}


server.listen(80, async () => {
    if (DEBUG) {
        await db.drop()
    }
    await db.init()
    console.log(`http://localhost:${80}`)
})