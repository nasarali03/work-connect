const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createJob,
  getOpenJobs,
  requestJobAcceptance,
  approveJobAcceptance,
  completeJob,
  getJobDetails,
} = require("../controllers/jobController");

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management
 */
/**
 * @swagger
 * /api/jobs/create:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - budget
 *               - location
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the job
 *               description:
 *                 type: string
 *                 description: Detailed description of the job
 *               category:
 *                 type: string
 *                 description: Category of the job (e.g., "Plumbing", "Electrician")
 *               budget:
 *                 type: number
 *                 description: Budget for the job
 *                 minimum: 0
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                   - address
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     description: Latitude of the job location
 *                   longitude:
 *                     type: number
 *                     description: Longitude of the job location
 *                   address:
 *                     type: string
 *                     description: Human-readable address
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of skills required for the job
 *               duration:
 *                 type: string
 *                 description: Estimated duration of the job (e.g., "2 hours", "3 days")
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       403:
 *         description: Forbidden (e.g., only clients can post jobs)
 *       500:
 *         description: Internal server error
 */
router.post("/create", authMiddleware, createJob);

/**
 * @swagger
 * /api/jobs/open:
 *   get:
 *     summary: Get all open jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of open jobs
 *       403:
 *         description: Forbidden (e.g., only workers can view jobs)
 *       500:
 *         description: Internal server error
 */
router.get("/open", authMiddleware, getOpenJobs);

/**
 * @swagger
 * /api/jobs/{jobId}/request-acceptance:
 *   post:
 *     summary: Worker requests to accept a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to request acceptance for
 *     responses:
 *       200:
 *         description: Job acceptance request sent successfully
 *       400:
 *         description: Bad request (e.g., worker already has a job in progress)
 *       403:
 *         description: Forbidden (e.g., only workers can request jobs)
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */

router.post("/:jobId/request-acceptance", authMiddleware, requestJobAcceptance);

/**
 * @swagger
 * /api/jobs/{jobId}/approve-acceptance:
 *   post:
 *     summary: Client approves worker's job acceptance request
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to approve acceptance for
 *     responses:
 *       200:
 *         description: Job acceptance approved successfully
 *       400:
 *         description: Bad request (e.g., job is no longer available)
 *       403:
 *         description: Forbidden (e.g., only clients can approve job requests)
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */

router.post("/:jobId/approve-acceptance", authMiddleware, approveJobAcceptance);

/**
 * @swagger
 * /api/jobs/complete/{jobId}:
 *   put:
 *     summary: Mark a job as completed
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to complete
 *     responses:
 *       200:
 *         description: Job marked as completed
 *       400:
 *         description: Bad request (e.g., job is not in progress)
 *       403:
 *         description: Forbidden (e.g., only workers can complete jobs)
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.put("/complete/:jobId", authMiddleware, completeJob);

/**
 * @swagger
 * /api/jobs/{jobId}/details:
 *   get:
 *     summary: Get complete job details
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job
 *     responses:
 *       200:
 *         description: Successfully retrieved job details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 category:
 *                   type: string
 *                 budget:
 *                   type: number
 *                 duration:
 *                   type: string
 *                 location:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     address:
 *                       type: string
 *                 skillsRequired:
 *                   type: array
 *                   items:
 *                     type: string
 *                 status:
 *                   type: string
 *                   enum: ["open", "in progress", "completed", "cancelled"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 client:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 worker:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 verifications:
 *                   type: object
 *                   properties:
 *                     clientVerified:
 *                       type: boolean
 *                     workerVerified:
 *                       type: boolean
 *                 paymentStatus:
 *                   type: string
 *                   enum: ["pending", "in progress", "completed"]
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get("/:jobId/details", authMiddleware, getJobDetails);

module.exports = router;
