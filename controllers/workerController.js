const User = require("../models/user.js");

exports.applyAsWorker = async (req, res) => {
  try {
    // Extract user ID from the authenticated request
    const userId = req.user.id; // Assuming the middleware sets `req.user`

    // Fetch user from the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if already a worker
    if (user.roles.includes("worker")) {
      return res
        .status(400)
        .json({ message: "Already registered as a worker" });
    }

    // Update user with worker details
    const { profession, skills, experience, cnic } = req.body;
    user.workerDetails = {
      profession,
      skills,
      experience,
      cnic,
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
