// ==========================================
// NOTIFICATION CONTROLLER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const memoryStore = require("../config/memoryStore");

// Get User Notifications
// GET /api/notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        if (mongoose.connection.readyState === 1) {
            const notifications = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(20);
            const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

            return res.status(200).json({
                success: true,
                count: notifications.length,
                unreadCount,
                notifications,
            });
        }

        const notifications = memoryStore.notifications.filter(
            (n) => n.recipientId === userId || (n.recipientId && n.recipientId.toString() === userId.toString())
        );
        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications,
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: "Failed to load notifications." });
    }
};

// Mark Single Notification as Read
// PUT /api/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
    try {
        const notifId = req.params.id;

        if (mongoose.connection.readyState === 1) {
            await Notification.findByIdAndUpdate(notifId, { isRead: true });
            return res.status(200).json({ success: true, message: "Notification marked as read." });
        }

        const notif = memoryStore.notifications.find((n) => n._id === notifId || n._id.toString() === notifId.toString());
        if (notif) notif.isRead = true;

        return res.status(200).json({ success: true, message: "Notification marked as read." });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ success: false, message: "Failed to update notification." });
    }
};

// Mark All Notifications as Read
// PUT /api/notifications/read-all
exports.markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        if (mongoose.connection.readyState === 1) {
            await Notification.updateMany({ recipientId: userId }, { isRead: true });
            return res.status(200).json({ success: true, message: "All notifications marked as read." });
        }

        memoryStore.notifications
            .filter((n) => n.recipientId === userId || (n.recipientId && n.recipientId.toString() === userId.toString()))
            .forEach((n) => (n.isRead = true));

        return res.status(200).json({ success: true, message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ success: false, message: "Failed to update notifications." });
    }
};
