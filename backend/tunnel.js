const localtunnel = require("localtunnel");

async function startTunnel() {
    try {
        console.log("Connecting persistent live tunnel on port 5000...");
        const tunnel = await localtunnel({ port: 5000 });
        console.log("==========================================");
        console.log("PULSECHAT_LIVE_URL=" + tunnel.url);
        console.log("==========================================");

        tunnel.on("close", () => {
            console.log("Tunnel closed by server. Reconnecting in 3 seconds...");
            setTimeout(startTunnel, 3000);
        });

        tunnel.on("error", (err) => {
            console.error("Tunnel error:", err.message);
            try { tunnel.close(); } catch {}
            setTimeout(startTunnel, 4000);
        });
    } catch (err) {
        console.error("Failed to establish tunnel:", err.message);
        setTimeout(startTunnel, 5000);
    }
}

startTunnel();
