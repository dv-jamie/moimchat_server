const fs = require("fs")
const path = require("path")
const mysql = require("mysql2/promise");

const mypath = path.join(__dirname, "batch.txt")

const date = new Date()
date.setDate(date.getDate() - 1);
const todayDateByKst = date.toISOString().replace("T", " ").substring(0, 10)

const messageCountByDate = (async () => {
    const conn = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "password",
        database: "moimchat",
    })
    const [messageCountByDate] = await conn.query("SELECT count(*) AS count FROM messages WHERE DATE(sent_at) = ?", [todayDateByKst])
    conn.end()

    const data = {
        date: todayDateByKst,
        messageCount: messageCountByDate[0].count
    }
    fs.appendFileSync(mypath, `${JSON.stringify(data)}\r\n`)
})()