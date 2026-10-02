const db = require("../config/db");


// ============================================================
// FIND 1-ON-1 CONVERSATION
// ============================================================

const findConversation = (userOneId, userTwoId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT *
            FROM conversations
            WHERE
                is_group = 0
                AND (
                    (user_one_id = ? AND user_two_id = ?)
                    OR
                    (user_one_id = ? AND user_two_id = ?)
                )
            LIMIT 1
        `;

        db.query(
            sql,
            [
                userOneId,
                userTwoId,
                userTwoId,
                userOneId
            ],
            (err, results) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(results[0] || null);

            }
        );

    });

};


// ============================================================
// CREATE 1-ON-1 CONVERSATION
// ============================================================

const createConversation = (userOneId, userTwoId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO conversations
            (
                user_one_id,
                user_two_id,
                is_group
            )
            VALUES (?, ?, 0)
        `;

        db.query(
            sql,
            [userOneId, userTwoId],
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
// CREATE GROUP CONVERSATION
// ============================================================

const createGroupConversation = (name, createdBy, memberIds = [], groupImage = null) => {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO conversations
            (
                name,
                is_group,
                created_by,
                group_image
            )
            VALUES (?, 1, ?, ?)
        `;

        db.query(sql, [name, createdBy, groupImage], (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            const conversationId = result.insertId;

            // Combine creator + memberIds ensuring uniqueness
            const allMembers = Array.from(new Set([Number(createdBy), ...memberIds.map(Number)]));

            const memberInserts = allMembers.map((userId) => {
                const role = userId === Number(createdBy) ? "admin" : "member";
                return [conversationId, userId, role];
            });

            const memberSql = `
                INSERT INTO conversation_members
                (conversation_id, user_id, role)
                VALUES ?
            `;

            db.query(memberSql, [memberInserts], (mErr) => {
                if (mErr) {
                    reject(mErr);
                    return;
                }

                resolve({
                    id: conversationId,
                    name,
                    is_group: 1,
                    created_by: createdBy,
                    group_image: groupImage,
                    members: allMembers
                });
            });
        });

    });

};


// ============================================================
// GET USER GROUPS
// ============================================================

const getUserGroups = (userId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                c.id,
                c.name,
                c.is_group,
                c.group_image,
                c.created_by,
                c.created_at,
                (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) AS member_count,
                (SELECT m.message FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
                (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message_time,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) AS unread_count
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            WHERE cm.user_id = ? AND c.is_group = 1
            ORDER BY (last_message_time IS NOT NULL) DESC, last_message_time DESC, c.id DESC
        `;

        db.query(sql, [userId, userId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(results);
        });

    });

};


// ============================================================
// GET GROUP MEMBERS
// ============================================================

const getGroupMembers = (conversationId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                u.id,
                u.name,
                u.email,
                u.profile_image,
                u.status,
                u.bio,
                cm.role,
                cm.joined_at
            FROM conversation_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.conversation_id = ?
            ORDER BY (cm.role = 'admin') DESC, u.name ASC
        `;

        db.query(sql, [conversationId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(results);
        });

    });

};


// ============================================================
// GET CONVERSATION MEMBER IDS (FOR SOCKET BROADCAST)
// ============================================================

const getConversationMemberIds = (conversationId) => {

    return new Promise((resolve, reject) => {

        // Check if group
        const checkSql = `SELECT is_group, user_one_id, user_two_id FROM conversations WHERE id = ?`;

        db.query(checkSql, [conversationId], (err, results) => {
            if (err || !results || results.length === 0) {
                resolve([]);
                return;
            }

            const conv = results[0];
            if (conv.is_group) {
                const memberSql = `SELECT user_id FROM conversation_members WHERE conversation_id = ?`;
                db.query(memberSql, [conversationId], (mErr, mRows) => {
                    if (mErr || !mRows) {
                        resolve([]);
                        return;
                    }
                    resolve(mRows.map(r => r.user_id));
                });
            } else {
                resolve([conv.user_one_id, conv.user_two_id].filter(Boolean));
            }
        });

    });

};


// ============================================================
// GET USER CONVERSATIONS (1-ON-1)
// ============================================================

const getUserConversations = (userId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT *
            FROM conversations
            WHERE
                is_group = 0
                AND (user_one_id = ? OR user_two_id = ?)
            ORDER BY created_at DESC
        `;

        db.query(
            sql,
            [userId, userId],
            (err, results) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);

            }
        );

    });

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    findConversation,
    createConversation,
    createGroupConversation,
    getUserGroups,
    getGroupMembers,
    getConversationMemberIds,
    getUserConversations

};