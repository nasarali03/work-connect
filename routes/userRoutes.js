const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUserStats,
  getUserProfile,
  updateUserProfileImage,
} = require("../controllers/userController");

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieves statistics for the authenticated user, including jobs accepted, completed, and payment status.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalJobsAccepted:
 *                   type: number
 *                   description: Total number of jobs accepted by the user
 *                 totalJobsCompleted:
 *                   type: number
 *                   description: Total number of jobs completed by the user
 *                 pendingPayments:
 *                   type: number
 *                   description: Number of pending payments for the user
 *                 completedPayments:
 *                   type: number
 *                   description: Number of completed payments for the user
 *       401:
 *         description: Unauthorized (User not authenticated)
 *       500:
 *         description: Internal server error
 */
router.get("/stats", authMiddleware, getUserStats);
router.get("/profile", authMiddleware, getUserProfile);
router.get("/image-upload/:userId", authMiddleware, updateUserProfileImage);

module.exports = router;
