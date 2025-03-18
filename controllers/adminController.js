const User = require("../models/user.js");
const Job = require("../models/job.js");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.adminRegister = async (req, res) => {
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

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
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

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ roles: "client" }).select("-password");
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all workers (both pending and approved)
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await User.find({ roles: "worker" }).select("-password");
    res.status(200).json(workers);
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
exports.getPendingWorkers = async (req, res) => {
  try {
    const pendingWorkers = await User.find({
      roles: "worker",
      "workerDetails.verificationStatus": "pending",
    }).select("-password");
    res.status(200).json(pendingWorkers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get only approved workers
exports.getApprovedWorkers = async (req, res) => {
  try {
    const approvedWorkers = await User.find({
      roles: "worker",
      "workerDetails.verificationStatus": "approved",
    }).select("-password");
    res.status(200).json(approvedWorkers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate/Deactivate a user
exports.updateUserStatus = async (req, res) => {
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
exports.getAllJobs = async (req, res) => {
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
exports.deleteUser = async (req, res) => {
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
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByIdAndDelete(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
