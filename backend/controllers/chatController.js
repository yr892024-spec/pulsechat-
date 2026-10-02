const {
    findConversation,
    createConversation,
    createGroupConversation,
    getUserGroups,
    getGroupMembers,
    getUserConversations
} = require("../models/conversationModel");

const {
    createMessage,
    getMessagesByConversation,
    markMessagesAsRead,
    togglePinMessage,
    toggleStarMessage
} = require("../models/messageModel");


// ============================================================
// GET OR CREATE 1-ON-1 CONVERSATION
// ============================================================

const getOrCreateConversation = async (req, res) => {

    try {

        const currentUserId = req.user.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        if (Number(userId) === Number(currentUserId)) {
            return res.status(400).json({
                message: "You cannot create a chat with yourself"
            });
        }

        let conversation = await findConversation(currentUserId, userId);

        if (!conversation) {
            const result = await createConversation(currentUserId, userId);
            conversation = {
                id: result.insertId,
                user_one_id: currentUserId,
                user_two_id: Number(userId),
                is_group: 0
            };
        }

        res.status(200).json({
            message: "Conversation ready",
            conversation
        });

    } catch (error) {
        console.error("Conversation error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// CREATE GROUP CHAT
// ============================================================

const createGroup = async (req, res) => {

    try {

        const currentUserId = req.user.id;
        const { name, memberIds, groupImage } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        const group = await createGroupConversation(
            name.trim(),
            currentUserId,
            Array.isArray(memberIds) ? memberIds : [],
            groupImage || null
        );

        res.status(201).json({
            message: "Group created successfully",
            group
        });

    } catch (error) {
        console.error("Create group error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// GET MY GROUPS
// ============================================================

const getMyGroups = async (req, res) => {

    try {

        const userId = req.user.id;
        const groups = await getUserGroups(userId);

        res.status(200).json({
            groups
        });

    } catch (error) {
        console.error("Get groups error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// GET GROUP MEMBERS
// ============================================================

const getGroupMembersList = async (req, res) => {

    try {

        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }

        const members = await getGroupMembers(conversationId);

        res.status(200).json({
            members
        });

    } catch (error) {
        console.error("Get group members error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// GET MY CONVERSATIONS (1-ON-1)
// ============================================================

const getMyConversations = async (req, res) => {

    try {

        const userId = req.user.id;
        const conversations = await getUserConversations(userId);

        res.status(200).json({
            conversations
        });

    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// SEND MESSAGE
// ============================================================

const sendMessage = async (req, res) => {

    try {

        const senderId = req.user.id;
        const {
            conversationId,
            message,
            messageType = "text",
            fileUrl = null,
            replyToId = null,
            replyToText = null,
            replyToSender = null
        } = req.body;

        if (!conversationId || (!message && !fileUrl)) {
            return res.status(400).json({
                message: "conversationId and message or fileUrl are required"
            });
        }

        const result = await createMessage(
            conversationId,
            senderId,
            (message || "").trim(),
            messageType,
            fileUrl,
            replyToId,
            replyToText,
            replyToSender
        );

        res.status(201).json({
            message: "Message sent",
            data: {
                id: result.insertId,
                conversationId,
                senderId,
                message: (message || "").trim(),
                messageType,
                fileUrl,
                replyToId,
                replyToText,
                replyToSender
            }
        });

    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// GET MESSAGES
// ============================================================

const getMessages = async (req, res) => {

    try {

        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({
                message: "conversationId is required"
            });
        }

        const messages = await getMessagesByConversation(conversationId);

        res.status(200).json({
            messages
        });

    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// MARK MESSAGES AS READ
// ============================================================

const markAsRead = async (req, res) => {

    try {

        const userId = req.user.id;
        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({
                message: "conversationId is required"
            });
        }

        await markMessagesAsRead(conversationId, userId);

        res.status(200).json({
            message: "Messages marked as read"
        });

    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// TOGGLE PIN MESSAGE
// ============================================================

const pinMessage = async (req, res) => {

    try {

        const { messageId, conversationId } = req.body;
        if (!messageId || !conversationId) {
            return res.status(400).json({ message: "messageId and conversationId required" });
        }

        const result = await togglePinMessage(messageId, conversationId);

        res.status(200).json({
            message: "Pin status updated",
            data: result
        });

    } catch (error) {
        console.error("Pin message error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// TOGGLE STAR MESSAGE
// ============================================================

const starMessage = async (req, res) => {

    try {

        const userId = req.user.id;
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({ message: "messageId required" });
        }

        const result = await toggleStarMessage(messageId, userId);

        res.status(200).json({
            message: "Star status updated",
            data: result
        });

    } catch (error) {
        console.error("Star message error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


module.exports = {

    getOrCreateConversation,
    createGroup,
    getMyGroups,
    getGroupMembersList,
    getMyConversations,
    sendMessage,
    getMessages,
    markAsRead,
    pinMessage,
    starMessage

};