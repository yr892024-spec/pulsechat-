let socket = null;
let currentUserId = null;
let messageHandler = null;
let reconnectTimer = null;
let isIntentionallyClosed = false;

const getWebSocketURL = () => {
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }
    if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        if (window.location.port === "5173") {
            return "ws://localhost:5000";
        }
        return `${protocol}//${window.location.host}`;
    }
    return "ws://localhost:5000";
};

// ============================================================
// CONNECT
// ============================================================

export const connectWebSocket = (userId, onMessage) => {
    currentUserId = userId;
    messageHandler = onMessage;
    isIntentionallyClosed = false;

    // If socket is already open or connecting, do not re-create
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return socket;
    }

    try {
        socket = new WebSocket(getWebSocketURL());

        socket.onopen = () => {
            console.log("WebSocket connected");

            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }

            if (currentUserId) {
                socket.send(
                    JSON.stringify({
                        type: "user_connected",
                        userId: currentUserId
                    })
                );
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket received:", data);

                if (messageHandler) {
                    messageHandler(data);
                }
            } catch (error) {
                console.error("WebSocket parse error:", error);
            }
        };

        socket.onerror = (error) => {
            console.warn("WebSocket error (backend might be offline or starting):", error);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            socket = null;

            // Auto-reconnect if not closed intentionally
            if (!isIntentionallyClosed && currentUserId && !reconnectTimer) {
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    console.log("Attempting WebSocket reconnection...");
                    connectWebSocket(currentUserId, messageHandler);
                }, 3000);
            }
        };
    } catch (err) {
        console.error("Failed to initialize WebSocket:", err);
    }

    return socket;
};

// ============================================================
// SET MESSAGE LISTENER (WITHOUT RECONNECTING)
// ============================================================

export const setMessageListener = (callback) => {
    messageHandler = callback;
};

// ============================================================
// SEND MESSAGE
// ============================================================

export const sendWebSocketMessage = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
        return true;
    }

    console.error("WebSocket is not connected (readyState:", socket?.readyState, ")");
    return false;
};

// ============================================================
// TYPING STATUS
// ============================================================

export const sendTypingStatus = (receiverId, conversationId, isTyping) => {
    return sendWebSocketMessage({
        type: "typing",
        receiverId,
        conversationId,
        isTyping
    });
};

// ============================================================
// MARK READ
// ============================================================

export const sendMessagesRead = (conversationId, senderId) => {
    return sendWebSocketMessage({
        type: "messages_read",
        conversationId,
        senderId
    });
};

// ============================================================
// EDIT MESSAGE
// ============================================================

export const sendEditMessage = (messageId, conversationId, receiverId, newText) => {
    return sendWebSocketMessage({
        type: "edit_message",
        messageId,
        conversationId,
        receiverId,
        newText
    });
};

// ============================================================
// DELETE MESSAGE
// ============================================================

export const sendDeleteMessage = (messageId, conversationId, receiverId) => {
    return sendWebSocketMessage({
        type: "delete_message",
        messageId,
        conversationId,
        receiverId
    });
};

// ============================================================
// TOGGLE REACTION
// ============================================================

export const sendToggleReaction = (messageId, conversationId, receiverId, emoji) => {
    return sendWebSocketMessage({
        type: "toggle_reaction",
        messageId,
        conversationId,
        receiverId,
        emoji
    });
};

// ============================================================
// PIN MESSAGE
// ============================================================

export const sendPinMessage = (messageId, conversationId) => {
    return sendWebSocketMessage({
        type: "pin_message",
        messageId,
        conversationId
    });
};

// ============================================================
// DISCONNECT
// ============================================================

export const disconnectWebSocket = () => {
    isIntentionallyClosed = true;

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (socket) {
        socket.close();
        socket = null;
    }

    currentUserId = null;
    messageHandler = null;
};