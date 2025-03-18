const User = require("../models/user.js");

exports.applyAsWorker = async (req, res) => {
  try {
    const { userId, profession, skills, experience, cnic } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.roles.includes("worker")) {
      return res
        .status(400)
        .json({ message: "Already registered as a worker" });
    }

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
    res.status(500).json({ message: error.message });
  }
};

exports.approveWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    const user = await User.findById(workerId);
    if (!user) return res.status(404).json({ message: "Worker not found" });

    user.roles.push("worker");
    user.workerDetails.verificationStatus = "approved";
    await user.save();

    res.status(200).json({ message: "Worker approved successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    const user = await User.findById(workerId);
    if (!user) return res.status(404).json({ message: "Worker not found" });

    if (
      !user.roles.includes("worker") &&
      user.workerDetails.verificationStatus !== "pending"
    ) {
      return res
        .status(400)
        .json({
          message: "Worker is not pending approval or already rejected",
        });
    }

    user.workerDetails.verificationStatus = "rejected";
    await user.save();

    res.status(200).json({ message: "Worker application rejected." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
