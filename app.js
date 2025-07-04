import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import errorHandler from "./utils/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import setupSwagger from "./swagger.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import cors from "cors";
import complaintRoutes from "./routes/complaintRoutes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
// Middleware
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/jobs", jobRoutes);
app.use("/api/user", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/feedback", feedbackRoutes); // Feedback routes
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/complaints", complaintRoutes);

setupSwagger(app);
// Error handling
app.use(errorHandler);

// Connect to DB
connectDB();

export default app;
