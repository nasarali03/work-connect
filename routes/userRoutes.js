import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getUserStats,
  getUserProfile,
  updateUserProfileImage,
  getUserIncome,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/stats", authMiddleware, getUserStats);
router.get("/profile", authMiddleware, getUserProfile);
router.post("/image-upload/:userId", authMiddleware, updateUserProfileImage);
router.get("/income", authMiddleware, getUserIncome);

export default router;
