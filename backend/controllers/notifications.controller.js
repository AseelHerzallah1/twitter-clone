import Notification from "../models/notification.model.js";
import { enrichNotifications } from "../lib/utils/enrichNotifications.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ to: userId })
            .populate({
                path: "from",
                select: "username profileImage fullName",
            })
            .populate({
                path: "post",
                select: "text img",
            })
            .sort({ createdAt: -1 })
            .lean();

        const enriched = await enrichNotifications(notifications);
        res.status(200).json(enriched);

    } catch (error) {
        console.log("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
}

export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({
            to: userId,
            read: { $ne: true },
        });
        res.status(200).json({ count });
    } catch (error) {
        console.log("Error fetching unread count:", error);
        res.status(500).json({ message: "Error fetching unread count" });
    }
};

export const markNotificationsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany(
            { to: userId, read: { $ne: true } },
            { $set: { read: true } }
        );
        res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        console.log("Error marking notifications read:", error);
        res.status(500).json({ message: "Error marking notifications read" });
    }
};

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ to: userId });

        res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.log("Error deleting notifications:", error);
        res.status(500).json({ message: "Error deleting notifications" });
    }
}

// export const deleteOneNotification = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const notificationId = req.params.id;

//         const notification = await Notification.findById(notificationId);

//         if (!notification) {
//             return res.status(404).json({ message: "Notification not found" });
//         }
//         if(notification.to.toString() !== userId.toString()) {
//             return res.status(403).json({ message: "You are not authorized to delete this notification" });
//         }

//         await Notification.findByIdAndDelete(notificationId);
//         res.status(200).json({ message: "Notification deleted successfully" });
        
//     } catch (error) {
//         console.log("Error deleting notification:", error);
//         res.status(500).json({ message: "Error deleting notification" });
//     }
// }