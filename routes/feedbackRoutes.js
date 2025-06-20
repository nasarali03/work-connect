import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", authMiddleware, createFeedback);

router.get("/all-feedbacks", authMiddleware, getAllFeedbacks);
router.get("/feedback/:id", authMiddleware, getFeedbackById);
router.delete("/delete-feedback/:id", authMiddleware, deleteFeedback);

export default router;
