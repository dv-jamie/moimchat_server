const wsManager = require("../libs/wsManager");
const chatService = require("../services/chatService");
const userService = require("../services/userService");

const handle = async (ws, message) => {
    const payload = JSON.parse(message)
    const type = payload.type
    const userId = payload.user_id
    const getUserInfo = await userService.getUserInfo(userId)
    const userName = getUserInfo.userInfo.name

    switch (type) {
        case "HEARTBEAT":
            // wsManager ws 마지막 살아있는 시간을 갱신하기...
            break
        case "CREATE_MESSAGE": {
            const createMessage = await chatService.createMessage(payload)

            // 대화방에 참여 중인 모든 유저 조회
            const getJoinedUsers = await chatService.getJoinedUsers(payload.conversation_id)
            const joinedUserIds = getJoinedUsers.userIds

            // 현재 접속 중인 유저의 ws List
            const joinedUserWsList = wsManager.getUserWsListByUserIds(joinedUserIds);

            joinedUserWsList.forEach(userWs => {
                userWs.send(JSON.stringify({
                    type,
                    userName,
                    createMessage
                }))
            })
            
            break;
        }
        case "LEFT_CONVERSATION": {
            const checkedConversationIds = payload.checkedConversationIds
            const leftConversation = await chatService.leftConversation(userId, userName, checkedConversationIds)
            
            const setJoinedUserIds = new Set()
            for(let checkedConversationId of checkedConversationIds) {
                const getJoinedUsers = await chatService.getJoinedUsers(checkedConversationId)
                const allJoinedUserIds = getJoinedUsers.userIds

                // 중복된 userId 제거
                allJoinedUserIds.forEach(userId => {
                    setJoinedUserIds.add(userId)
                })
            }

            setJoinedUserIds.forEach(userId => {
                const userWs = wsManager.getWs(userId)

                if(userWs) {
                    userWs.send(JSON.stringify({
                        type,
                        userName,
                        leftConversation
                    }))
                }
            })

            break;
        }
    }
}

module.exports = { handle }