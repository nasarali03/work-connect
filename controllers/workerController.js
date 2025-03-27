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
      !profession ||
      !skills ||
      !experience ||
      !cnic ||
      !cnicFront ||
      !cnicBack
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Update user with worker details
    user.workerDetails = {
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
