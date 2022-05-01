const db = require("../libs/db")
const jwt = require('jsonwebtoken');
const jwtSecret = "asdfhasdfhasdraedaae654684634"
const crypto = require("crypto");

const CHECK_USER_BY_UID = `SELECT * FROM users WHERE uid = ?`

const userService = {
    decodeToken: (token) => {
        const decodedToken = jwt.verify(token, jwtSecret)
        const userId = decodedToken.id

        return { userId }
    },
    getUserInfo: async (userId) => {
        const conn = await db.getConnection()
        const [userInfo] = await conn.query("SELECT * FROM users WHERE id = ?", [userId])
        conn.release()

        if(userInfo.length === 0) return { result: "FAILED"}

        return { userInfo: userInfo[0] }
    },
    join: async (uid, upw, name) => {
        const salt = await createSalt()
        const hashing = await encrypt(upw, salt)

        const conn = await db.getConnection()
        const [user] = await conn.query(`${CHECK_USER_BY_UID}`, [uid])

        if(user.length !== 0)
            return { result: "DUPLICATED_ID" }
        
        await conn.query(
            `INSERT INTO users (uid, hashed_pw, salt, name)
            VALUE (?, ?, ?, ?)`, [uid, hashing.hashedPassword, hashing.salt, name])
        conn.release()
        
        return {
            result: "SUCCESS",
        }
    },
    login: async (uid, upw) => {
        const conn = await db.getConnection()
        const [user] = await conn.query(`${CHECK_USER_BY_UID}`, [uid])
        conn.release()

        if(user.length === 0)
            return { result: "FAILED" }
            
        const hashing = await encrypt(upw, user[0].salt)

        if(user[0].hashed_pw !== hashing.hashedPassword)
            return { result: "FAILED" }

        const jwtToken = jwt.sign({ id: user[0].id }, jwtSecret)
        return {
            result: "SUCCESS",
            token: jwtToken
        }
    },
}

const createSalt = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if(err) reject(err)
            resolve(buf.toString("base64"))
        })
    })
}

const encrypt = (password, salt) => {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 2022, 64, "sha512", (err, derivedKey) => {
            if(err) reject(err)
            const hashedPassword = derivedKey.toString("base64")
            resolve({salt, hashedPassword})
        })
    })
}

module.exports = userService