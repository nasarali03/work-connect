import User from "../models/user.js";
import Job from "../models/job.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import ServiceFee from "../models/ServiceFee.js";
import Complaint from "../models/complaint.js";

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({ name, email, password, role });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    console.log(admin);
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log(isMatch);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id; // Extracted from adminAuth middleware
    const {
      adminName,
      adminEmail,
      password,
      newAdminName,
      newAdminEmail,
      newPassword,
      confirmPassword,
      // profileImage, // Base64 image string
    } = req.body;

    // Fetch admin from DB
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify current email and name
    if (admin.email !== adminEmail || admin.name !== adminName) {
      return res
        .status(400)
        .json({ message: "Current email or name is incorrect." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Validate new password if provided
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "New password and confirm password do not match." });
      }
      const salt = await bcrypt.genSalt(10);
      // admin.password = await bcrypt.hash(newPassword, salt);
      admin.password = await newPassword;
    }

    // Update email and name if provided
    if (newAdminName) admin.name = newAdminName;
    if (newAdminEmail) admin.email = newAdminEmail;

    // Store Base64 profile image
    // if (profileImage) {
    //   admin.adminImage = profileImage; // Assuming your Admin model has a field `profileImage`
    // }

    await admin.save();
    res.status(200).json({ message: "Profile updated successfully", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAdminImage = async (req, res) => {
  try {
    const adminId = req.admin.id; // Extracted from adminAuth middleware
    const { base64 } = req.body;

    if (!base64) {
      return res
        .status(400)
        .json({ status: "error", message: "No image provided" });
    }

    // Find the admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "error", message: "Admin not found" });
    }

    // Save the Base64 image in MongoDB
    admin.profileImage = base64; // Assuming your Admin model has a field `profileImage`
    await admin.save();

    res
      .status(200)
      .json({ status: "ok", message: "Image uploaded successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ roles: ["client"] }).select("-password");
    // print(clients);
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all workers (both pending and approved)
export const getAllWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      $and: [{ roles: { $in: ["worker"] } }, { roles: { $ne: ["client"] } }],
    }).select("-password");

    // Get service fee information for each worker
    const workersWithFees = await Promise.all(
      workers.map(async (worker) => {
        const serviceFees = await ServiceFee.find({ workerId: worker._id });

        const feeStats = serviceFees.reduce(
          (stats, fee) => {
            stats.totalFees += fee.serviceFeeAmount;
            if (fee.status === "paid") {
              stats.paidFees += fee.serviceFeeAmount;
            } else if (fee.status === "pending") {
              stats.pendingFees += fee.serviceFeeAmount;
            } else if (fee.status === "overdue") {
              stats.overdueFees += fee.serviceFeeAmount;
            }
            return stats;
          },
          {
            totalFees: 0,
            paidFees: 0,
            pendingFees: 0,
            overdueFees: 0,
          }
        );

        return {
          ...worker.toObject(),
          serviceFees: feeStats,
        };
      })
    );

    res.status(200).json(workersWithFees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    const user = await User.findById(workerId);
    if (!user) return res.status(404).json({ message: "Worker not found" });

    user.roles = ["worker"]; // Override role to worker only
    user.workerDetails.verificationStatus = "approved";
    await user.save();

    res.status(200).json({ message: "Worker approved successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    const user = await User.findById(workerId);
    if (!user) return res.status(404).json({ message: "Worker not found" });

    if (
      !user.roles.includes("worker") &&
      user.workerDetails.verificationStatus !== "pending"
    ) {
      return res.status(400).json({
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

// Get only pending workers
export const getPendingWorkers = async (req, res) => {
  try {
    const { profession } = req.query;

    // Define filter for pending workers
    let filter = { "workerDetails.verificationStatus": "pending" };

    // If profession is provided, filter by profession
    if (profession) {
      filter["workerDetails.profession"] = profession;
    }

    // Fetch pending workers with relevant fields
    const pendingWorkers = await User.find(filter).select(
      "firstName lastName email phoneNumber workerDetails.profilePicture workerDetails.cnic workerDetails.profession workerDetails.skills workerDetails.experience workerDetails.cnicFront workerDetails.cnicBack workerDetails.certificate workerDetails.about"
    );

    res.status(200).json(pendingWorkers);
  } catch (error) {
    console.error("Error fetching pending workers:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get only approved workers
export const getApprovedWorkers = async (req, res) => {
  try {
    const { profession } = req.query;

    // Define filter for approved workers
    let filter = { "workerDetails.verificationStatus": "approved" };

    // If profession is provided, filter by profession
    if (profession) {
      filter["workerDetails.profession"] = profession;
    }

    // Fetch approved workers with relevant fields
    const approvedWorkers = await User.find(filter).select(
      "firstName lastName email phoneNumber workerDetails.cnic workerDetails.profession workerDetails.skills workerDetails.experience workerDetails.cnicFront workerDetails.cnicBack workerDetails.certificate workerDetails.about"
    );

    res.status(200).json(approvedWorkers);
  } catch (error) {
    console.error("Error fetching approved workers:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Activate/Deactivate a user
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "Invalid active status" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { active },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: `User ${active ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all jobs (optional filter by status)
export const getAllJobs = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    const jobs = await Job.find(filter).populate(
      "clientId workerId",
      "name email"
    );
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a job
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByIdAndDelete(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all feedback for a worker
// GET /api/workers/feedback/:workerId
export const getFeedback = async (req, res) => {
  try {
    const workerId = req.params.workerId;

    const user = await User.findById(workerId);

    if (!user || !user.roles || !user.roles.includes("worker")) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json(user.workerDetails.feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get average feedback for a worker
// GET /api/workers/feedback/:workerId/average
export const getAverageRating = async (req, res) => {
  try {
    const workerId = req.params.workerId;

    const user = await User.findById(workerId);

    if (!user || !user.roles || !user.roles.includes("worker")) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const feedback = user.workerDetails.feedback;
    if (!feedback.length) {
      return res.status(200).json({ averageRating: 0 });
    }

    const total = feedback.reduce((sum, entry) => sum + entry.rating, 0);
    const average = total / feedback.length;

    res.status(200).json({ averageRating: average.toFixed(2) });
  } catch (error) {
    console.error("Error calculating average rating:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get worker profile details with service fees
export const getWorkerProfile = async (req, res) => {
  try {
    const workerId = req.params.workerId;

    // Find worker and select relevant fields
    const worker = await User.findById(workerId).select("-password").lean();

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

    // Get service fee information
    const serviceFees = await ServiceFee.find({ workerId })
      .populate("jobId", "title status")
      .populate("clientId", "firstName lastName")
      .sort({ createdAt: -1 });

    // Calculate service fee statistics
    const feeStats = serviceFees.reduce(
      (stats, fee) => {
        stats.totalJobs += 1;
        stats.totalAmount += fee.jobAmount;
        stats.totalServiceFees += fee.serviceFeeAmount;

        if (fee.status === "paid") {
          stats.paidFees += fee.serviceFeeAmount;
          stats.paidJobs += 1;
        } else if (fee.status === "pending") {
          stats.pendingFees += fee.serviceFeeAmount;
          stats.pendingJobs += 1;
        } else if (fee.status === "overdue") {
          stats.overdueFees += fee.serviceFeeAmount;
          stats.overdueJobs += 1;
        }

        return stats;
      },
      {
        totalJobs: 0,
        totalAmount: 0,
        totalServiceFees: 0,
        paidFees: 0,
        paidJobs: 0,
        pendingFees: 0,
        pendingJobs: 0,
        overdueFees: 0,
        overdueJobs: 0,
      }
    );

    // Structure the response
    const workerProfile = {
      personalInfo: {
        id: worker._id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        phoneNumber: worker.phoneNumber,
        profilePicture: worker.workerDetails.profilePicture,
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
      serviceFees: {
        statistics: feeStats,
        recentFees: serviceFees.slice(0, 5).map((fee) => ({
          id: fee._id,
          jobTitle: fee.jobId.title,
          jobAmount: fee.jobAmount,
          serviceFeeAmount: fee.serviceFeeAmount,
          status: fee.status,
          dueDate: fee.dueDate,
          paymentDate: fee.paymentDate,
          clientName: `${fee.clientId.firstName} ${fee.clientId.lastName}`,
          createdAt: fee.createdAt,
        })),
      },
    };

    res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get service fee details for a specific worker
export const getWorkerServiceFeeDetails = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, startDate, endDate } = req.query;

    let query = { workerId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const serviceFees = await ServiceFee.find(query)
      .populate("jobId", "title status")
      .populate("clientId", "firstName lastName")
      .sort({ createdAt: -1 });

    // Calculate totals
    const totals = serviceFees.reduce(
      (acc, fee) => {
        acc.totalJobs += 1;
        acc.totalAmount += fee.jobAmount;
        acc.totalServiceFees += fee.serviceFeeAmount;

        if (fee.status === "paid") {
          acc.paidFees += fee.serviceFeeAmount;
          acc.paidJobs += 1;
        } else if (fee.status === "pending") {
          acc.pendingFees += fee.serviceFeeAmount;
          acc.pendingJobs += 1;
        } else if (fee.status === "overdue") {
          acc.overdueFees += fee.serviceFeeAmount;
          acc.overdueJobs += 1;
        }

        return acc;
      },
      {
        totalJobs: 0,
        totalAmount: 0,
        totalServiceFees: 0,
        paidFees: 0,
        paidJobs: 0,
        pendingFees: 0,
        pendingJobs: 0,
        overdueFees: 0,
        overdueJobs: 0,
      }
    );

    res.status(200).json({
      serviceFees,
      totals,
      count: serviceFees.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all complaints with full user data
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user") // Populate all user fields
      .sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
