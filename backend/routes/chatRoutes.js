const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
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
} = require("../controllers/chatController");


// ============================================================
// 1-ON-1 CONVERSATIONS
// ============================================================

router.post("/conversation", authMiddleware, getOrCreateConversation);
router.get("/conversations", authMiddleware, getMyConversations);


// ============================================================
// GROUP CONVERSATIONS
// ============================================================

router.post("/group", authMiddleware, createGroup);
router.get("/groups", authMiddleware, getMyGroups);
router.get("/group/:conversationId/members", authMiddleware, getGroupMembersList);


// ============================================================
// MESSAGES
// ============================================================

router.post("/message", authMiddleware, sendMessage);
router.get("/messages/:conversationId", authMiddleware, getMessages);

// Mark as read
router.put("/messages/read", authMiddleware, markAsRead);
router.post("/messages/read", authMiddleware, markAsRead);

// Pin and Star
router.put("/messages/pin", authMiddleware, pinMessage);
router.put("/messages/star", authMiddleware, starMessage);


module.exports = router;