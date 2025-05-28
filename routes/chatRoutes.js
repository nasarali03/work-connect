import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  sendMessage,
  getChatHistory,
  markMessagesAsRead,
  getUnreadCount,
  getChatJobs,
} from "../controllers/chatContoller.js";

const router = express.Router();
// Send a message
router.post("/send", authMiddleware, sendMessage);

// Get chat history for a specific job
router.get("/history/:jobId", authMiddleware, getChatHistory);

// Mark messages as read
router.put("/read/:jobId", authMiddleware, markMessagesAsRead);

// Get unread message count
router.get("/unread", authMiddleware, getUnreadCount);

// Get all chat jobs for a user
router.get("/jobs", authMiddleware, getChatJobs);

export default router;
