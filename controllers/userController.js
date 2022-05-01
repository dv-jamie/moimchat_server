const express = require("express");
const router = express.Router()
const checkAuth = require("../middlewares/checkAuth");
const userService = require("../services/userService")

// 유저 정보 불러오기
router.get("/info", checkAuth, async (req, res) => {
    const userId = req.user.id
    
    const getUserInfo = await userService.getUserInfo(userId)
    return res.json({ getUserInfo })
})

// 회원가입
router.post("/join", async (req, res) => {
    const uid = req.body.uid
    const upw = req.body.upw
    const name = req.body.name
    
    const join = await userService.join(uid, upw, name)
    return res.json({ join })
})

// 로그인
router.post("/login", async (req, res) => {
    const uid = req.body.uid
    const upw = req.body.upw
    
    const login = await userService.login(uid, upw)
    return res.json({ login })
})

module.exports = router