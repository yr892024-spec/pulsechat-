const db = require("../config/db");


// ============================================================
// CREATE MESSAGE
// ============================================================

const createMessage = (
    conversationId,
    senderId,
    message,
    messageType = "text",
    fileUrl = null,
    replyToId = null,
    replyToText = null,
    replyToSender = null
) => {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO messages
            (
                conversation_id,
                sender_id,
                message,
                message_type,
                file_url,
                reply_to_id,
                reply_to_text,
                reply_to_sender
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                conversationId,
                senderId,
                message,
                messageType,
                fileUrl,
                replyToId,
                replyToText,
                replyToSender
            ],
            (err, result) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);

            }
        );

    });

};


// ============================================================
// GET MESSAGES BY CONVERSATION
// ============================================================

const getMessagesByConversation = (
    conversationId
) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                m.id,
                m.conversation_id,
                m.sender_id,
                m.message,
                m.message_type,
                m.file_url,
                m.reactions,
                m.reply_to_id,
                m.reply_to_text,
                m.reply_to_sender,
                m.is_pinned,
                m.starred_by,
                m.is_edited,
                m.is_deleted,
                m.is_read,
                m.created_at,
                u.name AS sender_name,
                u.profile_image AS sender_image
            FROM messages m
            JOIN users u
                ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        `;

        db.query(
            sql,
            [conversationId],
            (err, results) => {

                if (err) {
                    reject(err);
                    return;
                }

                const formatted = results.map(row => {
                    let parsedReactions = {};
                    if (row.reactions) {
                        try {
                            parsedReactions = JSON.parse(row.reactions);
                        } catch {
                            parsedReactions = {};
                        }
                    }

                    let parsedStarred = [];
                    if (row.starred_by) {
                        try {
                            parsedStarred = JSON.parse(row.starred_by);
                        } catch {
                            parsedStarred = [];
                        }
                    }

                    return {
                        ...row,
                        reactions: parsedReactions,
                        starred_by: parsedStarred
                    };
                });

                resolve(formatted);

            }
        );

    });

};


// ============================================================
// MARK MESSAGES AS READ
// ============================================================

const markMessagesAsRead = (
    conversationId,
    userId
) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE messages
            SET is_read = TRUE
            WHERE
                conversation_id = ?
                AND sender_id != ?
        `;

        db.query(
            sql,
            [
                conversationId,
                userId
            ],
            (err, result) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);

            }
        );

    });

};


// ============================================================
// EDIT MESSAGE
// ============================================================

const updateMessageText = (messageId, senderId, newText) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE messages
            SET
                message = ?,
                is_edited = 1
            WHERE
                id = ?
                AND sender_id = ?
                AND is_deleted = 0
        `;

        db.query(
            sql,
            [newText, messageId, senderId],
            (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            }
        );

    });

};


// ============================================================
// DELETE MESSAGE
// ============================================================

const deleteMessage = (messageId, senderId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE messages
            SET
                is_deleted = 1,
                message = 'This message was deleted',
                file_url = NULL
            WHERE
                id = ?
                AND sender_id = ?
        `;

        db.query(
            sql,
            [messageId, senderId],
            (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            }
        );

    });

};


// ============================================================
// TOGGLE MESSAGE REACTION
// ============================================================

const toggleMessageReaction = (messageId, userId, emoji) => {

    return new Promise((resolve, reject) => {

        const getSql = `SELECT reactions FROM messages WHERE id = ?`;

        db.query(getSql, [messageId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            if (!rows || rows.length === 0) {
                resolve(null);
                return;
            }

            let reactions = {};
            if (rows[0].reactions) {
                try {
                    reactions = JSON.parse(rows[0].reactions);
                } catch {
                    reactions = {};
                }
            }

            const userList = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
            const userNum = Number(userId);

            if (userList.includes(userNum)) {
                reactions[emoji] = userList.filter(id => id !== userNum);
                if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                }
            } else {
                reactions[emoji] = [...userList, userNum];
            }

            const reactionsJson = JSON.stringify(reactions);
            const updateSql = `UPDATE messages SET reactions = ? WHERE id = ?`;

            db.query(updateSql, [reactionsJson, messageId], (updateErr) => {
                if (updateErr) {
                    reject(updateErr);
                    return;
                }
                resolve(reactions);
            });
        });

    });

};


// ============================================================
// TOGGLE PIN MESSAGE
// ============================================================

const togglePinMessage = (messageId, conversationId) => {

    return new Promise((resolve, reject) => {

        const getSql = `SELECT is_pinned FROM messages WHERE id = ? AND conversation_id = ?`;

        db.query(getSql, [messageId, conversationId], (err, rows) => {
            if (err || !rows || rows.length === 0) {
                reject(err || new Error("Message not found"));
                return;
            }

            const newPinned = rows[0].is_pinned ? 0 : 1;

            // If pinning, unpin any previously pinned message in this conversation
            if (newPinned === 1) {
                db.query(`UPDATE messages SET is_pinned = 0 WHERE conversation_id = ?`, [conversationId], () => {
                    db.query(`UPDATE messages SET is_pinned = 1 WHERE id = ?`, [messageId], (pErr) => {
                        if (pErr) return reject(pErr);
                        resolve({ messageId, is_pinned: 1 });
                    });
                });
            } else {
                db.query(`UPDATE messages SET is_pinned = 0 WHERE id = ?`, [messageId], (pErr) => {
                    if (pErr) return reject(pErr);
                    resolve({ messageId, is_pinned: 0 });
                });
            }
        });

    });

};


// ============================================================
// TOGGLE STAR MESSAGE
// ============================================================

const toggleStarMessage = (messageId, userId) => {

    return new Promise((resolve, reject) => {

        const getSql = `SELECT starred_by FROM messages WHERE id = ?`;

        db.query(getSql, [messageId], (err, rows) => {
            if (err || !rows || rows.length === 0) {
                reject(err || new Error("Message not found"));
                return;
            }

            let starred = [];
            if (rows[0].starred_by) {
                try {
                    starred = JSON.parse(rows[0].starred_by);
                } catch {
                    starred = [];
                }
            }

            const uid = Number(userId);
            if (starred.includes(uid)) {
                starred = starred.filter(id => id !== uid);
            } else {
                starred.push(uid);
            }

            const starredJson = JSON.stringify(starred);
            db.query(`UPDATE messages SET starred_by = ? WHERE id = ?`, [starredJson, messageId], (uErr) => {
                if (uErr) return reject(uErr);
                resolve({ messageId, starred_by: starred });
            });
        });

    });

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    createMessage,
    getMessagesByConversation,
    markMessagesAsRead,
    updateMessageText,
    deleteMessage,
    toggleMessageReaction,
    togglePinMessage,
    toggleStarMessage

};