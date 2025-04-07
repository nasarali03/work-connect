const User = require("../models/user.js");

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

    // Extract worker details from request body
    const {
      profilePicture,
      profession,
      skills,
      experience,
      cnic,
      cnicFront,
      cnicBack,
      certificate,
      about,
    } = req.body;

    // Validate required fields
    if (
      !profilePicture ||
      !profession ||
      !skills ||
      !experience ||
      !cnic ||
      !cnicFront ||
      !cnicBack ||
      !about
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Update user with worker details
    user.workerDetails = {
      profilePicture,
      profession,
      skills,
      experience,
      cnic,
      cnicFront,
      cnicBack,
      certificate: certificate || "",
      verificationStatus: "pending",
      about,
    };

    // Assign worker role
    user.roles.push("worker");

    await user.save();

    res.status(200).json({
      message: "Worker application submitted, pending admin approval.",
    });
  } catch (error) {
    console.error("Error applying as worker:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// POST /api/workers/feedback/:workerId
exports.addFeedback = async (req, res) => {
  try {
    const workerId = req.params.workerId;
    const clientId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const worker = await User.findById(workerId);
    if (!worker || !worker.roles.includes("worker")) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const client = await User.findById(clientId);

    const feedbackEntry = {
      clientId: clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      rating,
      comment,
    };

    worker.workerDetails.feedback.push(feedbackEntry);
    await worker.save();

    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
