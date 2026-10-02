const db = require("../config/db");


// ============================================================
// FIND USER BY EMAIL
// ============================================================

const findUserByEmail = (email) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                id,
                name,
                email,
                password,
                profile_image,
                status,
                created_at
            FROM users
            WHERE email = ?
            LIMIT 1
        `;

        db.query(sql, [email], (err, results) => {

            if (err) {
                reject(err);
                return;
            }

            resolve(results[0] || null);

        });

    });

};


// ============================================================
// FIND USER BY ID
// ============================================================

const findUserById = (id) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                id,
                name,
                email,
                profile_image,
                status,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        `;

        db.query(sql, [id], (err, results) => {

            if (err) {
                reject(err);
                return;
            }

            resolve(results[0] || null);

        });

    });

};


// ============================================================
// CREATE USER
// ============================================================

const createUser = (name, email, password) => {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO users
            (
                name,
                email,
                password
            )
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [name, email, password],
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
// UPDATE USER STATUS
// ============================================================

const updateUserStatus = (id, status) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE users
            SET status = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [status, id],
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
// UPDATE USER PROFILE
// ============================================================

const updateUserProfile = (id, name, profileImage) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE users
            SET
                name = ?,
                profile_image = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [name, profileImage, id],
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
// SEARCH USERS
// ============================================================

const searchUsers = (search, currentUserId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                id,
                name,
                email,
                profile_image,
                status
            FROM users
            WHERE
                id != ?
                AND (
                    name LIKE ?
                    OR email LIKE ?
                )
            ORDER BY name ASC
        `;

        const searchValue = `%${search}%`;

        db.query(
            sql,
            [currentUserId, searchValue, searchValue],
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
// GET ALL USERS (WITH LAST MESSAGE & UNREAD COUNT)
// ============================================================

const getAllUsers = (currentUserId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                u.id,
                u.name,
                u.email,
                u.profile_image,
                u.status,
                u.created_at,
                c.id AS conversation_id,
                (
                    SELECT m.message
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.id DESC
                    LIMIT 1
                ) AS last_message,
                (
                    SELECT m.created_at
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.id DESC
                    LIMIT 1
                ) AS last_message_time,
                (
                    SELECT COUNT(*)
                    FROM messages m
                    WHERE
                        m.conversation_id = c.id
                        AND m.sender_id = u.id
                        AND m.is_read = 0
                ) AS unread_count
            FROM users u
            LEFT JOIN conversations c ON (
                (c.user_one_id = ? AND c.user_two_id = u.id)
                OR
                (c.user_two_id = ? AND c.user_one_id = u.id)
            )
            WHERE u.id != ?
            ORDER BY
                (last_message_time IS NOT NULL) DESC,
                last_message_time DESC,
                u.name ASC
        `;

        db.query(
            sql,
            [currentUserId, currentUserId, currentUserId],
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

    findUserByEmail,
    findUserById,
    createUser,
    updateUserStatus,
    updateUserProfile,
    searchUsers,
    getAllUsers

};