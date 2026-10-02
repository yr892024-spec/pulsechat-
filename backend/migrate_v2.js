require('dotenv').config();
const db = require('./config/db');

const steps = [
    // 1. Conversations modifications
    "ALTER TABLE conversations MODIFY user_one_id INT(11) NULL",
    "ALTER TABLE conversations MODIFY user_two_id INT(11) NULL",
    "ALTER TABLE conversations ADD COLUMN is_group TINYINT(1) DEFAULT 0",
    "ALTER TABLE conversations ADD COLUMN name VARCHAR(150) NULL",
    "ALTER TABLE conversations ADD COLUMN group_image LONGTEXT NULL",
    "ALTER TABLE conversations ADD COLUMN created_by INT(11) NULL",

    // 2. Conversation members table
    `CREATE TABLE IF NOT EXISTS conversation_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('admin', 'member') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_member (conversation_id, user_id)
    )`,

    // 3. Messages reply, pin, star
    "ALTER TABLE messages ADD COLUMN reply_to_id INT(11) NULL",
    "ALTER TABLE messages ADD COLUMN reply_to_text TEXT NULL",
    "ALTER TABLE messages ADD COLUMN reply_to_sender VARCHAR(100) NULL",
    "ALTER TABLE messages ADD COLUMN is_pinned TINYINT(1) DEFAULT 0",
    "ALTER TABLE messages ADD COLUMN starred_by TEXT NULL",

    // 4. Users bio and long profile_image
    "ALTER TABLE users MODIFY profile_image LONGTEXT NULL",
    "ALTER TABLE users ADD COLUMN bio VARCHAR(255) DEFAULT 'Available'"
];

let index = 0;
function runNext() {
    if (index >= steps.length) {
        console.log("Migration v2 completed successfully!");
        process.exit(0);
    }

    const sql = steps[index];
    db.query(sql, (err) => {
        if (err && !err.message.includes('Duplicate column') && !err.message.includes('already exists')) {
            console.log(`Step ${index} notice:`, err.message);
        } else {
            console.log(`Step ${index} OK.`);
        }
        index++;
        runNext();
    });
}

runNext();
