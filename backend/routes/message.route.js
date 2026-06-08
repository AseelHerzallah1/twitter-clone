import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    deleteMessage,
    deleteConversation,
    getUnreadDmCount,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/unread-count", protectRoute, getUnreadDmCount);
router.get("/", protectRoute, getConversations);
router.post("/conversation", protectRoute, getOrCreateConversation);
router.delete("/:conversationId/message/:messageId", protectRoute, deleteMessage);
router.get("/:id", protectRoute, getMessages);
router.post("/:id", protectRoute, sendMessage);
router.delete("/:id", protectRoute, deleteConversation);

export default router;
