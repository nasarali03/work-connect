const express = require("express");
const {
  applyAsWorker,
  addFeedback,
  checkWorkerVerificationStatus,
} = require("../controllers/workerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/apply", authMiddleware, applyAsWorker);

// 1. Add feedback (Client to Worker)
router.post("/feedback/:workerId", authMiddleware, addFeedback);

router.post(
  "/check-status/:userId",
  authMiddleware,
  checkWorkerVerificationStatus
);
module.exports = router;
