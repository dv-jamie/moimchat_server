const express = require("express")
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const checkAuth = require("../middlewares/checkAuth")
const wsManager = require("../libs/wsManager")
const userService = require("../services/userService")
const chatService = require("../services/chatService")

// 대화방 리스트 불러오기
router.get("/conversation", checkAuth, async (req, res) => {
    const userId = req.user.id
    const getMyConversations = await chatService.getMyConversations(userId)

    return res.json({ getMyConversations })
})

// 대화방 입장
router.post("/join-conversation", checkAuth, async (req, res) => {
    const userId = req.user.id
    const code = req.body.code

    const getUserInfo = await userService.getUserInfo(userId)
    const userName = getUserInfo.userInfo.name
    
    const joinConversation = await chatService.joinConversation(userId, code, userName)

    if(joinConversation.result === "NON_EXISTENT")
        return res.json({ result: "NON_EXISTENT" })
    if(joinConversation.result === "FAILED")
        return res.json({ result: "FAILED" })

    const conversationId = joinConversation.createdSystemMessage.conversation_id

    // 대화방에 참여 중인 모든 유저 조회
    const getJoinedUsers = await chatService.getJoinedUsers(conversationId)
    const joinedUserIds = getJoinedUsers.userIds

    // 현재 접속 중인 유저의 ws List
    const joinedUserWsList = wsManager.getUserWsListByUserIds(joinedUserIds);

    joinedUserWsList.forEach(userWs => {
        userWs.send(JSON.stringify({
            type: "JOIN_CONVERSATION",
            userId,
            userName,
            joinConversation
        }))
    })

    return res.json({ joinConversation })
})

// 대화방 생성
router.post("/conversation", checkAuth, async (req, res) => {
    const userId = req.user.id
    let randomCode = uuidv4().slice(0, 8)
    const name = req.body.name

    // 대화방 코드 중복 시 uuid 재생성
    const checkRandomCode = await chatService.checkRandomCode(randomCode)
    if(checkRandomCode.result === "EXISTENT") {
        randomCode = uuidv4().slice(0, 8)
    }
    
    // 대화방 생성
    const makeConversation = await chatService.makeConversation(name, randomCode)
    
    // 대화방 생성 후 참여
    if(makeConversation.result === "SUCCESS") {
        const joinMadeConversation = await chatService.joinMadeConversation(userId)
        return res.json({ joinMadeConversation })
    }
})

// 대화방 메시지 불러오기
router.get("/:id/conversation", checkAuth, async (req, res) => {
    const conversationId = req.params.id

    const getMyConversationById = await chatService.getMyConversationById(conversationId)
    return res.json({ getMyConversationById })
})

module.exports = router