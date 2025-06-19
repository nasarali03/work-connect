// routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  changePasswordByEmail,
  requestVerificationCode,
  verifyCode,
  resetPasswordWithCode,
} from "../controllers/authController.js";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [client, worker]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request (e.g., missing fields or invalid role)
 *       500:
 *         description: Internal server error
 */
router.post("/register", registerUser);

router.put("/update-profile", updateProfile);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", loginUser);

router.post("/request-verification-code", requestVerificationCode);
router.post("/verify-code", verifyCode);
router.post("/reset-password-with-code", resetPasswordWithCode);

export default router;
