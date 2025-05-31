import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getUserNotifications,
  getNotificationsByType,
  getUnreadCountByType,
  markNotificationsAsRead,
  getUnreadCount,
  deleteNotifications,
  getNotificationDetails,
} from "../controllers/notificationController.js";

const router = express.Router();

// Get user notifications
router.get("/", authMiddleware, getUserNotifications);

// Get notifications by type
router.get("/type/:type", authMiddleware, getNotificationsByType);

// Get unread count by type
router.get("/unread/type/:type", authMiddleware, getUnreadCountByType);

// Mark notifications as read
router.put("/read", authMiddleware, markNotificationsAsRead);

// Get unread notification count
router.get("/unread", authMiddleware, getUnreadCount);

// Delete notifications
router.delete("/delete", authMiddleware, deleteNotifications);

// Get notification details with job information
router.get("/:notificationId", authMiddleware, getNotificationDetails);

export default router;
