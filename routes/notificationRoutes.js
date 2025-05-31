import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getUserNotifications,
  markNotificationsAsRead,
  getUnreadCount,
  deleteNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

// Get user notifications
router.get("/", authMiddleware, getUserNotifications);

// Mark notifications as read
router.put("/read", authMiddleware, markNotificationsAsRead);

// Get unread notification count
router.get("/unread", authMiddleware, getUnreadCount);

// Delete notifications
router.delete("/", authMiddleware, deleteNotifications);

export default router;
