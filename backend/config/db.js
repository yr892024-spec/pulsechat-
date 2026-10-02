const mysql = require("mysql2");

let poolConfig = {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DATABASE_URL) {
    poolConfig.uri = process.env.DATABASE_URL;
    if (process.env.DB_SSL === "true") {
        poolConfig.ssl = { rejectUnauthorized: false };
    }
} else {
    poolConfig.host = process.env.DB_HOST || "localhost";
    poolConfig.user = process.env.DB_USER || "root";
    poolConfig.password = process.env.DB_PASSWORD || "";
    poolConfig.database = process.env.DB_NAME || "chat_app";
    poolConfig.port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

    if (process.env.DB_SSL === "true") {
        poolConfig.ssl = { rejectUnauthorized: false };
    }
}

const pool = mysql.createPool(poolConfig);

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }
    console.log("Database connected successfully");
    connection.release();
});

module.exports = pool;