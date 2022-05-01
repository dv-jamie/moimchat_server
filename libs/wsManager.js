const wsMap = {}

function addWs(userId, ws) {
    wsMap[userId] = ws
}

function getWs(userId) {
    return wsMap[userId]
}

const getUserWsListByUserIds = (userIds) => {
    const userWsList = []
    userIds.forEach(userId => {
        if(wsMap[userId])
            userWsList.push(wsMap[userId])
    })
    return userWsList;
}

function removeWs(userId) {
    delete wsMap[userId]
}

module.exports = { addWs, getWs, getUserWsListByUserIds, removeWs }