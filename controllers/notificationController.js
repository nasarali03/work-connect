import Notification from "../models/notification.js";
import User from "../models/user.js";

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("jobId", "title status");

    const total = await Notification.countDocuments({ userId });

    res.status(200).json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid notification IDs" });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: userId,
      },
      {
        $set: { read: true },
      }
    );

    res.status(200).json({
      message: "Notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete notifications
export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid notification IDs" });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId: userId,
    });

    res.status(200).json({
      message: "Notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
