import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createJob,
  getOpenJobs,
  requestJobAcceptance,
  acceptJobOffer,
  rejectJobOffer,
  getJobOffers,
  completeJob,
  getJobDetails,
  getJobsByBudgetType,
  markAsPaid,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/create", authMiddleware, createJob);

router.get("/open", authMiddleware, getOpenJobs);

router.post("/:jobId/request-acceptance", authMiddleware, requestJobAcceptance);

router.get("/:jobId/offers", authMiddleware, getJobOffers);

router.post("/:jobId/approve-acceptance", authMiddleware, acceptJobOffer);

router.post("/:jobId/reject-offer/:offerId", authMiddleware, rejectJobOffer);

router.put("/complete/:jobId", authMiddleware, completeJob);

router.get("/:jobId/details", authMiddleware, getJobDetails);

router.get("/budget-type", authMiddleware, getJobsByBudgetType);

router.put("/:jobId/mark-paid", authMiddleware, markAsPaid);

export default router;
