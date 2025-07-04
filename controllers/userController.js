import User from "../models/user.js";
import Job from "../models/job.js";
import ServiceFee from "../models/ServiceFee.js";

export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name role jobsPosted jobsAccepted jobsCompleted"
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the request object
    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfileImage = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the request object
    const user = await User.findById(userId); // Find the user by ID
    const { imageUrl } = req.body; // Expect the Cloudinary URL

    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = imageUrl; // Save the Cloudinary link
    await user.save(); // Save the updated user document
    res
      .status(200)
      .json({ status: "ok", message: "Image uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserIncome = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a worker
    if (!req.user.roles.includes("worker")) {
      return res
        .status(403)
        .json({ message: "Only workers can access income data" });
    }

    // Get all completed jobs where user is the worker
    const completedJobs = await Job.find({
      workerId: userId,
      status: "completed",
    });

    // Get all service fees for this worker
    const serviceFees = await ServiceFee.find({
      workerId: userId,
    });

    // Calculate total income
    let totalIncome = 0;

    for (const job of completedJobs) {
      const serviceFee = serviceFees.find(
        (fee) => fee.jobId.toString() === job._id.toString()
      );

      if (serviceFee) {
        const jobAmount = serviceFee.jobAmount;
        const serviceFeeAmount = serviceFee.serviceFeeAmount;
        const workerAmount = jobAmount - serviceFeeAmount;
        totalIncome += workerAmount;
      }
    }

    res.status(200).json({ income: totalIncome });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
