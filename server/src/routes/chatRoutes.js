const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/conversations", chatController.createConversation);
router.get("/conversations", chatController.getConversations);
router.get("/conversations/:conversationId/messages", chatController.getMessages);
router.post("/conversations/:conversationId/messages", chatController.sendMessage);
router.patch("/messages/:messageId", chatController.editMessage);
router.delete("/messages/:messageId", chatController.deleteMessage);
router.post("/conversations/:conversationId/seen", chatController.markSeen);
router.get("/conversations/:conversationId/search", chatController.searchMessages);

module.exports = router;