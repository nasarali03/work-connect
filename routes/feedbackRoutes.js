const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
} = require("../controllers/feedbackController");

router.post("/add-feedback", authMiddleware, createFeedback);

router.get("/all-feedbacks", authMiddleware, getAllFeedbacks);
router.get("/feedback/:id", authMiddleware, getFeedbackById);
router.delete("/delete-feedback/:id", authMiddleware, deleteFeedback);

module.exports = router;
