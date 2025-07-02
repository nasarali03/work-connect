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
  getClientJobs,
  getAssignedJobsForWorker,
  getAssignedJobsForClient,
  getCompletedJobs,
  addWorkerReview,
  acceptFixedBudgetJobOffer,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/create", authMiddleware, createJob);

router.get("/open", authMiddleware, getOpenJobs);

router.post("/:jobId/request-acceptance", authMiddleware, requestJobAcceptance);

router.get("/:jobId/offers", authMiddleware, getJobOffers);

router.post("/accept-offer/:offerId", authMiddleware, acceptJobOffer);

router.post(
  "/:jobId/accept-fixed-offer",
  authMiddleware,
  acceptFixedBudgetJobOffer
);

router.post("/:jobId/reject-offer/:offerId", authMiddleware, rejectJobOffer);

router.put("/complete/:jobId", authMiddleware, completeJob);

router.get("/:jobId/details", authMiddleware, getJobDetails);

router.get("/budget-type", authMiddleware, getJobsByBudgetType);

router.put("/:jobId/mark-paid", authMiddleware, markAsPaid);

router.get("/client", authMiddleware, getClientJobs);

router.get("/assigned/worker", authMiddleware, getAssignedJobsForWorker);
router.get("/assigned/client", authMiddleware, getAssignedJobsForClient);

router.get("/completed", authMiddleware, getCompletedJobs);

router.post("/:jobId/review", authMiddleware, addWorkerReview);

export default router;
