const express = require("express");
const {
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
} = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminAuth.js");

const router = express.Router();

router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.get("/profile", adminAuth, getAdminProfile);

router.get("/clients", adminAuth, getAllClients); // Get all clients
router.get("/workers", adminAuth, getAllWorkers); // Get all workers
router.get("/workers/pending", adminAuth, getPendingWorkers); // Get only pending workers
router.get("/workers/approved", adminAuth, getApprovedWorkers); // Get only approved workers

// Activate/Deactivate a user
router.put("/users/:userId/status", adminAuth, updateUserStatus);

// Get all jobs (filter by status)
router.get("/jobs", adminAuth, getAllJobs);

// Delete a user
router.delete("/users/:userId", adminAuth, deleteUser);

// Delete a job
router.delete("/jobs/:jobId", adminAuth, deleteJob);

module.exports = router;
