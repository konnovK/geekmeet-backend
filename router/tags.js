const db = require('../db')

/**
 * Возвращает тэги пользователя по его ID
 * @param userId - ID пользователя
 * @returns {Promise<*[]>} - тэги пользователя
 */
async function getUserTags (userId) {
    let tagNames = []

    let tags = await db.Tag.findAll({})
    let utrs = await db.UserTagRel.findAll({
        where: {
            userId: userId
        }
    })

    utrs.forEach((utr) =>
        tagNames.push(tags.filter((tag) => tag.id === utr.tagId)[0].title)
    )

    return tagNames
}

/**
 * Возвращает тэги ивента по его ID
 * (DO NOT USE WITH MULTIPLE EVENTS)
 * @param eventId - ID ивента
 * @returns {Promise<*[]>} - тэги ивента
 */
async function getEventTags (eventId) {
    let tagNames = []

    let tags = await db.Tag.findAll({})
    let etrs = await db.EventTagRel.findAll({
        where:{
            eventId: eventId
        }
    })

    etrs.forEach((etr) =>
        tagNames.push(tags.filter((tag) => tag.id === etr.tagId)[0].title)
    )

    return tagNames
}

module.exports = {getUserTags, getEventTags}