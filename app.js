const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const errorHandler = require("./utils/errorHandler");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const workerRoutes = require("./routes/workerRoutes");
const setupSwagger = require("./swagger");
const feedbackRoutes = require("./routes/feedbackRoutes");
const cors = require("cors");
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
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/feedback", feedbackRoutes); // Feedback routes

setupSwagger(app);
// Error handling
app.use(errorHandler);

// Connect to DB
connectDB();

module.exports = app;
