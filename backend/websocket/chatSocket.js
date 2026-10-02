const WebSocket = require("ws");

const {
    createMessage,
    markMessagesAsRead,
    updateMessageText,
    deleteMessage,
    toggleMessageReaction,
    togglePinMessage
} = require("../models/messageModel");

const {
    updateUserStatus,
    findUserById
} = require("../models/userModel");

const {
    getConversationMemberIds
} = require("../models/conversationModel");


// ============================================================
// ONLINE USERS
// ============================================================

const connectedUsers = new Map();

// Helper to broadcast message to all connected clients
const broadcast = (payload, excludeUserId = null) => {
    const dataStr = JSON.stringify(payload);
    for (const [userId, clientSocket] of connectedUsers.entries()) {
        if (userId !== excludeUserId && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(dataStr);
        }
    }
};

// Helper to broadcast to members of a conversation
const broadcastToConversation = async (conversationId, payload, excludeUserId = null) => {
    try {
        const memberIds = await getConversationMemberIds(conversationId);
        const dataStr = JSON.stringify(payload);

        for (const mId of memberIds) {
            if (mId !== excludeUserId) {
                const clientSocket = connectedUsers.get(mId);
                if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
                    clientSocket.send(dataStr);
                }
            }
        }
    } catch (err) {
        console.error("Broadcast to conversation error:", err);
    }
};


// ============================================================
// INITIALIZE WEBSOCKET
// ============================================================

const initializeWebSocket = (server) => {

    const wss = new WebSocket.Server({
        server
    });


    // ========================================================
    // NEW CONNECTION
    // ========================================================

    wss.on("connection", (socket) => {

        console.log("WebSocket client connected");


        // ====================================================
        // RECEIVE MESSAGE
        // ====================================================

        socket.on("message", async (data) => {

            try {

                const message = JSON.parse(data.toString());


                // =================================================
                // 1. USER CONNECTED
                // =================================================

                if (message.type === "user_connected") {

                    const userId = Number(message.userId);

                    if (!userId) {
                        return;
                    }

                    connectedUsers.set(userId, socket);
                    socket.userId = userId;

                    console.log(`User ${userId} connected`);

                    // Update status in DB
                    updateUserStatus(userId, "online").catch((err) => {
                        console.error("Error setting user status to online:", err.message);
                    });

                    // Send online user list to newly connected user
                    socket.send(
                        JSON.stringify({
                            type: "online_users",
                            userIds: Array.from(connectedUsers.keys())
                        })
                    );

                    // Broadcast online status to all other users
                    broadcast(
                        {
                            type: "user_status",
                            userId: userId,
                            status: "online"
                        },
                        userId
                    );

                }


                // =================================================
                // 2. CHAT MESSAGE (1-ON-1 OR GROUP)
                // =================================================

                if (message.type === "chat_message") {

                    const receiverId = message.receiverId ? Number(message.receiverId) : null;
                    const conversationId = Number(message.conversationId);
                    const text = message.message ? String(message.message).trim() : "";
                    const messageType = message.messageType || message.message_type || "text";
                    const fileUrl = message.fileUrl || message.file_url || null;
                    const senderId = socket.userId || Number(message.senderId);

                    const replyToId = message.replyToId ? Number(message.replyToId) : null;
                    const replyToText = message.replyToText || null;
                    const replyToSender = message.replyToSender || null;

                    if (!senderId || !conversationId || (!text && !fileUrl)) {

                        socket.send(
                            JSON.stringify({
                                type: "error",
                                message: "Invalid message data"
                            })
                        );

                        return;

                    }

                    // Save to MySQL
                    const result = await createMessage(
                        conversationId,
                        senderId,
                        text,
                        messageType,
                        fileUrl,
                        replyToId,
                        replyToText,
                        replyToSender
                    );

                    console.log(`Message saved with ID ${result.insertId} (type: ${messageType})`);

                    const createdAt = new Date().toISOString();

                    // Get sender name for group displays
                    let senderName = "User";
                    let senderImage = null;
                    try {
                        const senderUser = await findUserById(senderId);
                        if (senderUser) {
                            senderName = senderUser.name;
                            senderImage = senderUser.profile_image;
                        }
                    } catch (e) {
                        console.warn("Could not fetch sender details:", e);
                    }

                    const messagePayload = {
                        id: result.insertId,
                        conversationId: conversationId,
                        conversation_id: conversationId,
                        senderId: senderId,
                        sender_id: senderId,
                        sender_name: senderName,
                        sender_image: senderImage,
                        receiverId: receiverId,
                        receiver_id: receiverId,
                        message: text,
                        message_type: messageType,
                        messageType: messageType,
                        file_url: fileUrl,
                        fileUrl: fileUrl,
                        reply_to_id: replyToId,
                        reply_to_text: replyToText,
                        reply_to_sender: replyToSender,
                        reactions: {},
                        is_pinned: 0,
                        starred_by: [],
                        is_edited: 0,
                        is_deleted: 0,
                        is_read: 0,
                        created_at: createdAt,
                        createdAt: createdAt
                    };

                    // Broadcast to all conversation members
                    await broadcastToConversation(
                        conversationId,
                        {
                            type: "new_message",
                            message: messagePayload
                        },
                        senderId
                    );

                    // If receiverId was provided directly and not reached, send directly
                    if (receiverId) {
                        const directSocket = connectedUsers.get(receiverId);
                        if (directSocket && directSocket.readyState === WebSocket.OPEN) {
                            directSocket.send(
                                JSON.stringify({
                                    type: "new_message",
                                    message: messagePayload
                                })
                            );
                        }
                    }

                    // Send confirmation to sender
                    socket.send(
                        JSON.stringify({
                            type: "message_sent",
                            message: messagePayload
                        })
                    );

                }


                // =================================================
                // 3. EDIT MESSAGE
                // =================================================

                if (message.type === "edit_message") {

                    const messageId = Number(message.messageId);
                    const conversationId = Number(message.conversationId);
                    const newText = String(message.newText || "").trim();
                    const senderId = socket.userId || Number(message.senderId);

                    if (messageId && newText && senderId) {

                        await updateMessageText(messageId, senderId, newText);

                        const payload = {
                            type: "message_edited",
                            messageId,
                            conversationId,
                            newText
                        };

                        socket.send(JSON.stringify(payload));
                        await broadcastToConversation(conversationId, payload, senderId);

                    }

                }


                // =================================================
                // 4. DELETE MESSAGE FOR EVERYONE
                // =================================================

                if (message.type === "delete_message") {

                    const messageId = Number(message.messageId);
                    const conversationId = Number(message.conversationId);
                    const senderId = socket.userId || Number(message.senderId);

                    if (messageId && senderId) {

                        await deleteMessage(messageId, senderId);

                        const payload = {
                            type: "message_deleted",
                            messageId,
                            conversationId
                        };

                        socket.send(JSON.stringify(payload));
                        await broadcastToConversation(conversationId, payload, senderId);

                    }

                }


                // =================================================
                // 5. TOGGLE EMOJI REACTION
                // =================================================

                if (message.type === "toggle_reaction") {

                    const messageId = Number(message.messageId);
                    const conversationId = Number(message.conversationId);
                    const emoji = String(message.emoji || "");
                    const userId = socket.userId || Number(message.userId);

                    if (messageId && emoji && userId) {

                        const updatedReactions = await toggleMessageReaction(messageId, userId, emoji);

                        const payload = {
                            type: "message_reaction",
                            messageId,
                            conversationId,
                            reactions: updatedReactions
                        };

                        socket.send(JSON.stringify(payload));
                        await broadcastToConversation(conversationId, payload, userId);

                    }

                }


                // =================================================
                // 6. TOGGLE PIN MESSAGE
                // =================================================

                if (message.type === "pin_message") {

                    const messageId = Number(message.messageId);
                    const conversationId = Number(message.conversationId);

                    if (messageId && conversationId) {

                        const pinResult = await togglePinMessage(messageId, conversationId);

                        const payload = {
                            type: "message_pinned",
                            messageId,
                            conversationId,
                            is_pinned: pinResult.is_pinned
                        };

                        socket.send(JSON.stringify(payload));
                        await broadcastToConversation(conversationId, payload, socket.userId);

                    }

                }


                // =================================================
                // 7. TYPING INDICATOR
                // =================================================

                if (message.type === "typing") {

                    const conversationId = Number(message.conversationId);
                    const isTyping = Boolean(message.isTyping);
                    const senderId = socket.userId || Number(message.senderId);

                    if (conversationId && senderId) {

                        const payload = {
                            type: "typing",
                            senderId: senderId,
                            conversationId: conversationId,
                            isTyping: isTyping
                        };

                        await broadcastToConversation(conversationId, payload, senderId);

                    }

                }


                // =================================================
                // 8. MARK MESSAGES READ
                // =================================================

                if (message.type === "messages_read") {

                    const conversationId = Number(message.conversationId);
                    const currentUserId = socket.userId;

                    if (conversationId && currentUserId) {

                        markMessagesAsRead(conversationId, currentUserId).catch((err) => {
                            console.error("Error marking messages as read:", err.message);
                        });

                        const payload = {
                            type: "messages_read",
                            conversationId: conversationId,
                            readerId: currentUserId
                        };

                        await broadcastToConversation(conversationId, payload, currentUserId);

                    }

                }

            } catch (error) {

                console.error("WebSocket message error:", error);

                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Something went wrong"
                    })
                );

            }

        });


        // ========================================================
        // DISCONNECT
        // ========================================================

        socket.on("close", () => {

            if (socket.userId) {

                const userId = socket.userId;

                connectedUsers.delete(userId);

                console.log(`User ${userId} disconnected`);

                updateUserStatus(userId, "offline").catch((err) => {
                    console.error("Error setting user status to offline:", err.message);
                });

                // Broadcast offline status to all other users
                broadcast(
                    {
                        type: "user_status",
                        userId: userId,
                        status: "offline"
                    },
                    userId
                );

            }

        });


        // ========================================================
        // ERROR
        // ========================================================

        socket.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

    });


    console.log("WebSocket server initialized");

    return wss;

};


module.exports = initializeWebSocket;