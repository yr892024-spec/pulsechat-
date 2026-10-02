const localtunnel = require("localtunnel");

// Keep event loop alive indefinitely
setInterval(() => {}, 60000);

process.on("uncaughtException", (err) => {
    console.error("Tunnel uncaughtException:", err.message);
    setTimeout(startTunnel, 3000);
});

process.on("unhandledRejection", (reason) => {
    console.error("Tunnel unhandledRejection:", reason);
    setTimeout(startTunnel, 3000);
});

let currentTunnel = null;

async function startTunnel() {
    if (currentTunnel) {
        try { currentTunnel.close(); } catch {}
        currentTunnel = null;
    }
    try {
        console.log("Connecting persistent live tunnel on port 5000...");
        currentTunnel = await localtunnel({ port: 5000 });
        console.log("==========================================");
        console.log("PULSECHAT_LIVE_URL=" + currentTunnel.url);
        console.log("==========================================");

        currentTunnel.on("close", () => {
            console.log("Tunnel closed by server. Reconnecting in 3 seconds...");
            setTimeout(startTunnel, 3000);
        });

        currentTunnel.on("error", (err) => {
            console.error("Tunnel error:", err.message);
            setTimeout(startTunnel, 4000);
        });
    } catch (err) {
        console.error("Failed to establish tunnel:", err.message);
        setTimeout(startTunnel, 5000);
    }
}

startTunnel();

