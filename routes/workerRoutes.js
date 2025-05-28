import express from "express";
import {
  applyAsWorker,
  addFeedback,
  checkWorkerVerificationStatus,
  updateActivityStatus,
  getActivityStatus,
  getActiveWorkers,
  getWorkerProfile,
} from "../controllers/workerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/apply", authMiddleware, applyAsWorker);

// 1. Add feedback (Client to Worker)
router.post("/feedback/:workerId", authMiddleware, addFeedback);

router.get("/check-status", authMiddleware, checkWorkerVerificationStatus);

router.put("/activity-status", authMiddleware, updateActivityStatus);
router.get("/activity-status/:workerId", authMiddleware, getActivityStatus);
router.get("/active-workers", authMiddleware, getActiveWorkers);
// Add this with the other routes
router.get("/profile/:workerId", authMiddleware, getWorkerProfile);

export default router;
