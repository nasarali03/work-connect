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
  approveWorker,
  rejectWorker,
  updateAdminProfile,
  uploadAdminImage,
} = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminAuth.js");

const router = express.Router();

/**
 * @swagger
 * /admin/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Email already exists
 */
router.post("/register", adminRegister);

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", adminLogin);

router.put("/update", adminAuth, updateAdminProfile);

router.put("/update-user-state", adminAuth, updateUserStatus);

router.post("/upload-image", adminAuth, uploadAdminImage);

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns admin profile data
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", adminAuth, getAdminProfile);

/**
 * @swagger
 * /admin/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 */
router.get("/clients", adminAuth, getAllClients);

/**
 * @swagger
 * /admin/workers:
 *   get:
 *     summary: Get all workers
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workers
 *       401:
 *         description: Unauthorized
 */
router.get("/workers", adminAuth, getAllWorkers);

/**
 * @swagger
 * /admin/workers/pending:
 *   get:
 *     summary: Get all pending workers
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending workers
 *       401:
 *         description: Unauthorized
 */
router.get("/workers/pending", adminAuth, getPendingWorkers);

/**
 * @swagger
 * /admin/workers/approved:
 *   get:
 *     summary: Get all approved workers
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of approved workers
 *       401:
 *         description: Unauthorized
 */
router.get("/workers/approved", adminAuth, getApprovedWorkers);

/**
 * @swagger
 * /admin/approve:
 *   post:
 *     summary: Approve a worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       200:
 *         description: Worker approved successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/approve", adminAuth, approveWorker);

/**
 * @swagger
 * /admin/reject:
 *   post:
 *     summary: Reject a worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       200:
 *         description: Worker rejected successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/reject", adminAuth, rejectWorker);

/**
 * @swagger
 * /admin/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 *       401:
 *         description: Unauthorized
 */
router.get("/jobs", adminAuth, getAllJobs);

/**
 * @swagger
 * /admin/clients/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/clients/:userId", adminAuth, deleteUser);

/**
 * @swagger
 * /admin/jobs/{jobId}:
 *   delete:
 *     summary: Delete a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID to delete
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/jobs/:jobId", adminAuth, deleteJob);

module.exports = router;
