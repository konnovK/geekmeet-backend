const express = require('express')
const db = require('./db')

const server = express()


server.use(express.json())
server.use(express.urlencoded())
server.disable('x-powered-by')



const api = require('./router/api')


server.use('/api/v1', api);


server.listen(80, async () => {
    await db.init()
    console.log(`http://localhost:${80}`)
})