require('dotenv').config();
const db = require('./config/db');

const columns = [
    { name: 'message_type', sql: "ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text'" },
    { name: 'file_url', sql: "ALTER TABLE messages ADD COLUMN file_url LONGTEXT NULL" },
    { name: 'reactions', sql: "ALTER TABLE messages ADD COLUMN reactions TEXT NULL" },
    { name: 'is_edited', sql: "ALTER TABLE messages ADD COLUMN is_edited TINYINT(1) DEFAULT 0" },
    { name: 'is_deleted', sql: "ALTER TABLE messages ADD COLUMN is_deleted TINYINT(1) DEFAULT 0" }
];

db.query('DESCRIBE messages;', (err, results) => {
    if (err) {
        console.error('Describe error:', err);
        process.exit(1);
    }

    const existingCols = new Set(results.map(r => r.Field));
    console.log('Existing columns in messages:', Array.from(existingCols));

    const toAdd = columns.filter(c => !existingCols.has(c.name));
    if (toAdd.length === 0) {
        console.log('All enhancement columns already exist!');
        process.exit(0);
    }

    let completed = 0;
    toAdd.forEach(col => {
        db.query(col.sql, (addErr) => {
            if (addErr) {
                console.error(`Error adding ${col.name}:`, addErr.message);
            } else {
                console.log(`Added column ${col.name} successfully.`);
            }
            completed++;
            if (completed === toAdd.length) {
                console.log('Schema update complete.');
                process.exit(0);
            }
        });
    });
});
