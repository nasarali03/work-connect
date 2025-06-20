import express from "express";
import {
  submitComplaint,
  getAllComplaints,
} from "../controllers/complaintController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitComplaint);

// (Optional) Admin route to get all complaints
router.get("/", authMiddleware, getAllComplaints);

export default router;
