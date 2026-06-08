import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { getNotifications, getUnreadCount, markNotificationsRead, deleteNotifications } from '../controllers/notifications.controller.js';

const router = express.Router();

router.get("/unread-count", protectRoute, getUnreadCount);
router.patch("/read", protectRoute, markNotificationsRead);
router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);
// router.delete("/:id", protectRoute, deleteOneNotification);


export default router;