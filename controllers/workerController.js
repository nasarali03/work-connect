import User from "../models/user.js";

export const applyAsWorker = async (req, res) => {
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
export const addFeedback = async (req, res) => {
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

export const getWorkerFeedback = async (req, res) => {
  try {
    const workerId = req.params.workerId;

    const worker = await User.findById(workerId);
    if (!worker || !worker.roles.includes("worker")) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const feedback = worker.workerDetails.feedback || [];

    res.status(200).json({ feedback });
  } catch (error) {
    console.error("Error fetching worker feedback:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const checkWorkerVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", status: "not_found" });
    }

    if (!user.roles.includes("worker")) {
      return res.status(403).json({
        message: "User is not registered as a worker.",
        status: "not_a_worker",
      });
    }

    const verificationStatus = user.workerDetails?.verificationStatus;

    if (!verificationStatus) {
      return res.status(400).json({
        message: "Worker details not found.",
        status: "missing_details",
      });
    }

    if (verificationStatus === "approved") {
      return res.status(200).json({
        message: "Worker is verified.",
        status: "approved",
      });
    } else if (verificationStatus === "pending") {
      return res.status(200).json({
        message: "Your worker request is still pending.",
        status: "pending",
      });
    } else if (verificationStatus === "rejected") {
      return res.status(200).json({
        message: "Your worker request has been rejected.",
        status: "rejected",
      });
    } else {
      return res.status(400).json({
        message: "Invalid verification status.",
        status: "invalid_status",
      });
    }
  } catch (error) {
    console.error("Error checking worker verification status:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", status: "error" });
  }
};

// Update worker activity status
export const updateActivityStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status
    if (!["offline", "online", "busy"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'offline', 'online', or 'busy'",
      });
    }

    // Update user's activity status
    const user = await User.findByIdAndUpdate(
      userId,
      {
        "workerDetails.activityStatus": status,
        "workerDetails.lastActive": new Date(),
      },
      { new: true }
    ).select("workerDetails.activityStatus workerDetails.lastActive");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Activity status updated successfully",
      status: user.workerDetails.activityStatus,
      lastActive: user.workerDetails.lastActive,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get worker activity status
export const getActivityStatus = async (req, res) => {
  try {
    const userId = req.params.workerId;

    const user = await User.findById(userId).select(
      "workerDetails.activityStatus workerDetails.lastActive firstName lastName"
    );

    if (!user) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json({
      status: user.workerDetails.activityStatus,
      lastActive: user.workerDetails.lastActive,
      name: `${user.firstName} ${user.lastName}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all active workers
export const getActiveWorkers = async (req, res) => {
  try {
    const { profession } = req.query;

    let query = {
      "workerDetails.activityStatus": "online",
      "workerDetails.verificationStatus": "approved",
    };

    if (profession) {
      query["workerDetails.profession"] = profession;
    }

    const activeWorkers = await User.find(query).select(
      "firstName lastName workerDetails.profession workerDetails.activityStatus workerDetails.lastActive location"
    );

    res.status(200).json(activeWorkers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get worker profile details
export const getWorkerProfile = async (req, res) => {
  try {
    const workerId = req.params.workerId;

    // Find worker and select relevant fields
    const worker = await User.findById(workerId)
      .select("-password") // Exclude password
      .lean(); // Convert to plain JavaScript object for better performance

    if (!worker || !worker.roles.includes("worker")) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Calculate average rating
    const feedback = worker.workerDetails?.feedback || [];
    const averageRating =
      feedback.length > 0
        ? (
            feedback.reduce((sum, entry) => sum + entry.rating, 0) /
            feedback.length
          ).toFixed(2)
        : 0;

    // Structure the response
    const workerProfile = {
      personalInfo: {
        id: worker._id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        phoneNumber: worker.phoneNumber,
        profilePicture: worker.profilePicture,
        location: worker.location,
      },
      professionalInfo: {
        profession: worker.workerDetails.profession,
        skills: worker.workerDetails.skills,
        experience: worker.workerDetails.experience,
        about: worker.workerDetails.about,
        verificationStatus: worker.workerDetails.verificationStatus,
      },
      activity: {
        status: worker.workerDetails.activityStatus || "offline",
        lastActive: worker.workerDetails.lastActive,
        jobsAccepted: worker.jobsAccepted,
        jobsCompleted: worker.jobsCompleted,
      },
      performance: {
        averageRating: parseFloat(averageRating),
        totalReviews: feedback.length,
        recentFeedback: feedback.slice(-3), // Get last 3 feedback entries
      },
      documents: {
        cnic: worker.workerDetails?.cnic,
        cnicFront: worker.workerDetails?.cnicFront || "",
        cnicBack: worker.workerDetails?.cnicBack || "",
        certificate: worker.workerDetails?.certificate || "",
      },
    };

    res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
