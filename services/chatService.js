const db = require("../libs/db")

const CHECK_CODE_IN_CONVERSATIONS = "SELECT id, code FROM conversations WHERE code = ?"
const MESSAGES_WITH_USERS_BY_CONVERSATION_ID =
    `SELECT m.id, user_id, conversation_id, text, sent_at, name AS user_name FROM messages AS m
    LEFT JOIN users AS u ON m.user_id = u.id
    WHERE m.conversation_id = ?`

const chatService = {
    // http
    getMyConversations: async (userId) => {
        const conn = await db.getConnection()
        const [myConversations] = await conn.query(
            `SELECT c.id, c.name, c.last_display_message_id AS last_display_message_id,
            m.text AS last_display_message_text, m.sent_at AS last_display_message_sent_at
            FROM conversations AS c
            LEFT JOIN conversation_user AS cu ON cu.conversation_id = c.id
            LEFT JOIN messages AS m ON c.last_display_message_id = m.id
            WHERE cu.user_id = ? AND cu.left_at IS null`, [userId])
        conn.release()
    
        return {
            result: "SUCCESS",
            myConversations            
        }
    },
    checkRandomCode: async (randomCode) => {
        const conn = await db.getConnection()
        const [checkCodeInConversations] = await conn.query(`${CHECK_CODE_IN_CONVERSATIONS}`, [randomCode])
        conn.release()

        // 코드가 이미 존재할 경우 EXISTED 반환
        if(checkCodeInConversations.length !== 0) {
            return { result: "EXISTENT" }
        }

        return { result: "SUCCESS" }
    },
    joinConversation: async (userId, code, userName) => {
        const nowDateTime = new Date()
        const systemMessageText = `${userName}님이 입장했습니다.`

        const conn = await db.getConnection()
        const [checkCodeInConversations] = await conn.query(`${CHECK_CODE_IN_CONVERSATIONS}`, [code])
        
        // 해당 코드의 대화방이 존재하지 않을 경우 NON_EXISTENT 반환
        if(checkCodeInConversations.length !== 1) {
            return { result: "NON_EXISTENT" }
        }
        
        // 이미 참여 중인 대화방인지 체크 (참여 중일 경우 FAILED 반환)
        const matchingCoversationId = checkCodeInConversations[0].id
        const [checkJoinedConversation] = await conn.query(
            `SELECT * FROM conversation_user
            WHERE user_id = ? AND conversation_id = ? AND left_at IS null`, [userId, matchingCoversationId])
        
        if(checkJoinedConversation.length >= 1) {
            return { result : "FAILED" }
        }

        // 대화방별 유저 리스트 table(conversation_user)에 추가
        await conn.query(
            `INSERT INTO conversation_user (user_id, conversation_id, joined_at)
            VALUE (?, ?, ?)`, [userId, matchingCoversationId, nowDateTime]
        )

        // 대화방 참여자 수 변경(+1)
        await conn.query(
            `UPDATE conversations SET user_count = user_count + 1
            WHERE code = ?`, [code])

        // 알림 메시지 추가
        await conn.query(
            `INSERT INTO messages (user_id, conversation_id, text, sent_at)
            VALUE (?, ?, ?, now())`, [1, matchingCoversationId, systemMessageText]
        )
        const [createdSystemMessage] = await conn.query(
            `SELECT * FROM messages
            WHERE user_id = ? AND conversation_id = ?
            ORDER BY id DESC LIMIT 1`, [1, matchingCoversationId])

        conn.release()

        return {
            result: "SUCCESS",
            createdSystemMessage: createdSystemMessage[0]
        }
    },
    makeConversation: async (name, randomCode) => {
        const nowDateTime = new Date()

        const conn = await db.getConnection()
        await conn.query(
            `INSERT INTO conversations (name, user_count, code, created_at, last_display_message_id)
            VALUE (?, ?, ?, ?, ?)`, [name, 1, randomCode, nowDateTime, 0])
        conn.release()
            
        return { result: "SUCCESS" }
    },
    joinMadeConversation: async (userId) => {
        const nowDateTime = new Date()

        const conn = await db.getConnection()
        const [lastConversation] = await conn.query("SELECT * FROM conversations ORDER BY id DESC LIMIT 1")
        await conn.query(
            `INSERT INTO conversation_user (user_id, conversation_id, joined_at)
            VALUE (?, ?, ?)`, [userId, lastConversation[0].id, nowDateTime])
        conn.release()

        return { reslut: "SUCCESS" }
    },
    getMyConversationById: async (conversationId) => {
        const conn = await db.getConnection()
        const [myConversationById] = await conn.query("SELECT * FROM conversations WHERE id = ?", [conversationId])
        const [messages] = await conn.query(`${MESSAGES_WITH_USERS_BY_CONVERSATION_ID}`, [conversationId])
        const [joinedUsers] = await conn.query(
            `SELECT u.id, u.name FROM conversation_user AS cu
            JOIN users AS u ON cu.user_id = u.id
            WHERE cu.conversation_id = ? AND cu.left_at IS null`, [conversationId])
        conn.release()
    
        return {
            reslut: "SUCCESS",
            myConversationById,
            messages,
            joinedUsers
        }
    },
    getJoinedUsers: async (conversationId) => {
        const conn = await db.getConnection()
        const [userIds] = await conn.query(
            `SELECT user_id FROM conversation_user
            WHERE conversation_id = ? AND left_at IS NULL`, [conversationId])
        conn.release()

        const reformattedUserIds = userIds.map(obj => obj.user_id)

        return {
            userIds: reformattedUserIds
        }
    },
    createMessage: async (payload) => {
        const userId = payload.user_id
        const conversationId = payload.conversation_id
        const text = payload.text

        const conn = await db.getConnection()
        await conn.query(
            `INSERT INTO messages (user_id, conversation_id, text, sent_at)
            VALUE (?, ?, ?, now())`, [userId, conversationId, text])
        const [createdMessage] = await conn.query(
            `${MESSAGES_WITH_USERS_BY_CONVERSATION_ID} ORDER BY m.id DESC LIMIT 1`, [conversationId])
        await conn.query(
            `UPDATE conversations SET last_display_message_id = ?
            WHERE id = ?`, [createdMessage[0].id, conversationId]
        )
        conn.release()
        
        return {
            reslut: "SUCCESS",
            createdMessage: createdMessage[0],
        }
    },
    leftConversation: async (userId, userName, checkedConversationIds) => {
        const systemMessageText = `${userName}님이 대화방을 나갔습니다.`
        const conn = await db.getConnection()

        for(let checkedConversationId of checkedConversationIds) {
            await conn.query(
                `UPDATE conversation_user SET left_at = now()
                WHERE user_id = ? AND conversation_id = ?`, [userId, checkedConversationId])
            
            // 대화방 참여자 수 변경(-1)
            await conn.query(
                `UPDATE conversations SET user_count = user_count - 1
                WHERE id = ?`, [checkedConversationId])
    
            // 알림 메시지 추가
            await conn.query(
                `INSERT INTO messages (user_id, conversation_id, text, sent_at)
                VALUE (?, ?, ?, now())`, [1, checkedConversationId, systemMessageText]
            )
        }

        const [createdSystemMessages] = await conn.query(
            `SELECT * FROM messages
            WHERE user_id = ? AND conversation_id IN (?)
            ORDER BY id DESC LIMIT 0, ?`, [1, checkedConversationIds, checkedConversationIds.length])
        conn.release()

        return {
            result: "SUCCESS",
            createdSystemMessages
        }
    }
}

module.exports = chatService