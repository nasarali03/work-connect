const User = require("../models/user.js");
const upload = require("../utils/multer"); // Import Multer setup
const fs = require("fs");
const path = require("path");

exports.applyAsWorker = async (req, res) => {
  try {
    // Extract user ID from the authenticated request
    const userId = req.user.id;

    // Fetch user from the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if already a worker
    if (user.roles.includes("worker")) {
      return res
        .status(400)
        .json({ message: "Already registered as a worker" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video upload is required." });
    }

    // Update user with worker details
    const { profession, skills, experience, cnic, video } = req.body;

    const videoPath = path.resolve(req.file.path);

    user.workerDetails = {
      profession,
      skills: skills,
      experience,
      cnic,
      video: videoPath,
      verificationStatus: "pending",
    };

    await user.save();

    res.status(200).json({
      message: "Worker application submitted, pending admin approval.",
    });
  } catch (error) {
    console.error("Error applying as worker:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.uploadWorkerVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    // print(req.file);
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const videoPath = path.resolve(req.file.path);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.roles.includes("worker")) {
      return res.status(400).json({ message: "User is not a worker" });
    }

    user.workerDetails.video = videoPath;
    await user.save();

    res.status(200).json({ message: "Video uploaded successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
