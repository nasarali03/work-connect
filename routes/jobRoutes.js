import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createJob,
  getOpenJobs,
  requestJobAcceptance,
  acceptJobOffer,
  getJobOffers,
  completeJob,
  getJobDetails,
  getJobsByBudgetType,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/create", authMiddleware, createJob);

router.get("/open", authMiddleware, getOpenJobs);

router.post("/:jobId/request-acceptance", authMiddleware, requestJobAcceptance);

router.get("/:jobId/offers", authMiddleware, getJobOffers);

router.post("/:jobId/approve-acceptance", authMiddleware, acceptJobOffer);

router.put("/complete/:jobId", authMiddleware, completeJob);

router.get("/:jobId/details", authMiddleware, getJobDetails);

router.get("/budget-type", authMiddleware, getJobsByBudgetType);

export default router;
