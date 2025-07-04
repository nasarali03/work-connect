// routes/adminRoutes.js
import express from "express";
import {
  adminRegister,
  adminLogin,
  getAdminProfile,
  getAllClients,
  getAllWorkers,
  getPendingWorkers,
  getApprovedWorkers,
  getAllJobs,
  deleteUser,
  deleteJob,
  updateUserStatus,
  approveWorker,
  rejectWorker,
  updateAdminProfile,
  uploadAdminImage,
  getFeedback,
  getAverageRating,
  getWorkerProfile,
  getWorkerServiceFeeDetails,
  getAllComplaints,
  getCompanyIncome,
  getWorkerReviewsByProfession,
} from "../controllers/adminController.js";
import adminAuth from "../middlewares/adminAuth.js";
const router = express.Router();

router.post("/register", adminRegister);

router.post("/login", adminLogin);

router.put("/update", adminAuth, updateAdminProfile);

router.put("/update-user-state", adminAuth, updateUserStatus);

router.post("/upload-image", adminAuth, uploadAdminImage);

router.get("/profile", adminAuth, getAdminProfile);

router.get("/clients", adminAuth, getAllClients);

router.get("/workers", adminAuth, getAllWorkers);

router.get("/workers/pending", adminAuth, getPendingWorkers);

router.get("/workers/approved", adminAuth, getApprovedWorkers);

router.post("/approve", adminAuth, approveWorker);

router.post("/reject", adminAuth, rejectWorker);

router.get("/jobs", adminAuth, getAllJobs);

router.delete("/clients/:userId", adminAuth, deleteUser);

router.delete("/workers/:userId", adminAuth, deleteUser);

router.delete("/jobs/:jobId", adminAuth, deleteJob);

// Get all feedback for a worker
router.get("/feedback/:workerId", getFeedback);

// Get average rating for a worker
router.get("/feedback/:workerId/average", getAverageRating);

// Worker profile routes
router.get("/workers/:workerId", adminAuth, getWorkerProfile);
router.get("/workers", adminAuth, getAllWorkers);
router.get(
  "/workers/:workerId/service-fees",
  adminAuth,
  getWorkerServiceFeeDetails
);

// Get all complaints
router.get("/complaints", adminAuth, getAllComplaints);

router.get("/company-income", adminAuth, getCompanyIncome);

router.get(
  "/worker-reviews/:profession",
  adminAuth,
  getWorkerReviewsByProfession
);

export default router;
