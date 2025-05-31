import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getWorkerServiceFees,
  payServiceFee,
} from "../controllers/serviceFeeController.js";

const router = express.Router();

// Worker routes
router.get("/worker", authMiddleware, getWorkerServiceFees);
router.post("/:serviceFeeId/pay", authMiddleware, payServiceFee);

export default router;
