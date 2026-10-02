require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");


// ============================================================
// ROUTES
// ============================================================

const authRoutes =
    require("./routes/authRoutes");

const chatRoutes =
    require("./routes/chatRoutes");


// ============================================================
// WEBSOCKET
// ============================================================

const initializeWebSocket =
    require("./websocket/chatSocket");


// ============================================================
// APP
// ============================================================

const app = express();


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());


// ============================================================
// AUTH ROUTES
// ============================================================

app.use(
    "/api/auth",
    authRoutes
);


// ============================================================
// CHAT ROUTES
// ============================================================

app.use(
    "/api/chat",
    chatRoutes
);


// ============================================================
// SERVE STATIC FRONTEND (FOR PRODUCTION & CLOUD HOSTING)
// ============================================================

const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// API Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "PulseChat", timestamp: new Date().toISOString() });
});

// Single Page Application Fallback Middleware (Express 5 compatible)
app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
        return next();
    }
    const indexPath = path.join(distPath, "index.html");
    const fs = require("fs");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({ message: "PulseChat API is running. Run 'npm run build' in frontend directory." });
    }
});


// ============================================================
// HTTP SERVER
// ============================================================

const server =
    http.createServer(app);


// ============================================================
// WEBSOCKET SERVER
// ============================================================

initializeWebSocket(server);


// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 5000;


server.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});