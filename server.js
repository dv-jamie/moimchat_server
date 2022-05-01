const express = require("express")
const app = express()
const { WebSocketServer } = require('ws')
const cors = require("cors")
const Url = require("url-parse")
const bodyParser = require("body-parser")

const wsManager = require("./libs/wsManager")
const handleProtocol = require("./libs/handleProtocol")
const userController = require("./controllers/userController")
const chatController = require("./controllers/chatController")
const userService = require("./services/userService")

app.use(cors())
app.use(bodyParser.json())

app.use("/user", userController)
app.use("/chat", chatController)

const server = app.listen(8080, () => {
    console.log("start server in 8080")
})

const wss = new WebSocketServer({
    path: "/ws",
    server
})

wss.on("connection", (ws, req) => {
    const parsedUrl = new Url(req.url, true)
    const token = parsedUrl.query.token
    const userId = userService.decodeToken(token).userId
    
    // decode 실패
    if(!userId) {
        console.log("connected failed (invalidated token)")
        ws.close()
        return
    }

    wsManager.addWs(userId, ws)
    console.log(`connected success! user_id = ${userId}`)

    ws.on("message", data => {
        const message = data.toString()
        handleProtocol.handle(ws, message)
    })

    ws.on("close", () => {
        console.log(`closed user_id = ${userId}`)
        wsManager.removeWs(userId)
    })
})