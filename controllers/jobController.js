import Job from "../models/job.js";
import Profile from "../models/Profile.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

// Create a job
export const createJob = async (req, res) => {
  try {
    console.log(req.user.roles);
    if (!req.user.role.includes("client")) {
      return res.status(403).json({ message: "Only clients can post jobs" });
    }

    const {
      title,
      description,
      category,
      budget,
      location,
      skillsRequired,
      rightNow,
      scheduledDateTime,
      openToOffer,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !budget || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate location fields
    if (!location.latitude || !location.longitude || !location.address) {
      return res.status(400).json({
        message: "Location must include latitude, longitude, and address",
      });
    }

    // Validate date and time requirements
    if (!rightNow && !scheduledDateTime) {
      return res.status(400).json({
        message:
          "Either 'rightNow' must be true or 'scheduledDateTime' must be provided",
      });
    }

    // If rightNow is false, validate scheduledDateTime
    if (!rightNow) {
      const scheduledDate = new Date(scheduledDateTime);
      const now = new Date();

      if (scheduledDate < now) {
        return res.status(400).json({
          message: "Scheduled date and time must be in the future",
        });
      }
    }

    // Create a new job
    const newJob = new Job({
      title,
      description,
      category,
      budget,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      },
      skillsRequired,
      rightNow: rightNow || false,
      scheduledDateTime: rightNow ? new Date() : new Date(scheduledDateTime),
      openToOffer: openToOffer || false,
      status: "open",
      clientId: req.user.id,
      workerId: null,
      clientVerification: false,
      workerVerification: false,
      paymentStatus: "pending",
    });

    await newJob.save();

    // Increment jobs posted by the client
    await User.findByIdAndUpdate(req.user.id, { $inc: { jobsPosted: 1 } });

    res.status(201).json({ message: "Job posted successfully", job: newJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all open jobs
export const getOpenJobs = async (req, res) => {
  try {
    if (!req.user.role.includes("worker")) {
      return res.status(403).json({ message: "Only workers can view jobs" });
    }

    const {
      page = 1,
      limit = 10,
      latitude,
      longitude,
      radius,
      skills,
      budgetType,
    } = req.query;

    let filter = { status: "open" };

    // Filter by budget type if specified
    if (budgetType) {
      if (budgetType === "open_to_offer") {
        filter.openToOffer = true;
      } else if (budgetType === "fixed") {
        filter.openToOffer = false;
      }
    }

    // Filter by nearby location (if latitude & longitude are provided)
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const maxDistance = parseFloat(radius) / 111; // Convert km to degrees (approx)

      filter["location.latitude"] = {
        $gte: lat - maxDistance,
        $lte: lat + maxDistance,
      };
      filter["location.longitude"] = {
        $gte: lon - maxDistance,
        $lte: lon + maxDistance,
      };
    }

    // Filter by required skills
    if (skills) {
      filter.skillsRequired = { $in: skills.split(",") };
    }

    const jobs = await Job.find(filter)
      .populate("clientId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Transform the response to include budget type information
    const transformedJobs = jobs.map((job) => ({
      ...job.toObject(),
      budgetType: job.openToOffer ? "open_to_offer" : "fixed",
      budget: job.openToOffer ? null : job.budget,
    }));

    res.status(200).json(transformedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Worker requests to accept a job
export const requestJobAcceptance = async (req, res) => {
  try {
    if (!req.user.role.includes("worker")) {
      return res.status(403).json({ message: "Only workers can accept jobs" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.status !== "open") {
      return res.status(400).json({ message: "Job is no longer available" });
    }

    // Check if the worker already has a job in progress
    const existingJob = await Job.findOne({
      workerId: req.user.id,
      status: "in progress",
    });
    if (existingJob) {
      return res
        .status(400)
        .json({ message: "You already have a job in progress" });
    }

    // Fetch worker's profile
    const workerProfile = await Profile.findOne({ userId: req.user.id });
    if (!workerProfile) {
      return res
        .status(400)
        .json({ message: "Complete your profile before accepting jobs" });
    }

    // Check if worker has required skills
    const hasRequiredSkills = job.skillsRequired.every((skill) =>
      workerProfile.skills.includes(skill)
    );

    if (!hasRequiredSkills) {
      return res
        .status(403)
        .json({ message: "You do not have the required skills for this job" });
    }

    // Mark job as "pending approval"
    job.status = "pending_approval";
    job.workerId = req.user.id;
    await job.save();

    // Notify client (store notification in DB)
    await Notification.create({
      userId: job.clientId,
      message: `Worker ${req.user.name} wants to accept your job: ${job.title}`,
      type: "job_request",
      jobId: job._id,
    });

    res
      .status(200)
      .json({ message: "Job request sent to client for approval", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Client approves worker's job request
export const approveJobAcceptance = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res
        .status(403)
        .json({ message: "Only clients can approve job requests" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (job.status !== "pending_approval") {
      return res
        .status(400)
        .json({ message: "No pending worker request for this job" });
    }

    // Move job to "in progress"
    job.status = "in progress";
    await job.save();

    // Increment worker's accepted jobs count
    await User.findByIdAndUpdate(job.workerId, { $inc: { jobsAccepted: 1 } });

    // Notify worker
    await Notification.create({
      userId: job.workerId,
      message: `Your job request for "${job.title}" has been approved`,
      type: "job_approved",
      jobId: job._id,
    });

    res.status(200).json({ message: "Job approved and in progress", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Worker requests completion
    if (!req.user.role.includes("worker")) {
      if (!job.workerId || job.workerId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized action" });
      }

      if (job.status !== "in progress") {
        return res.status(400).json({
          message: "Job must be in progress before requesting completion",
        });
      }

      job.status = "awaiting confirmation";
      job.paymentStatus = "in progress";
      await job.save();

      return res.status(200).json({
        message: "Job completion requested. Waiting for client approval.",
      });
    }

    // Client confirms completion
    if (req.user.role.includes("client")) {
      if (!job.clientId || job.clientId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized action" });
      }

      if (job.status !== "awaiting confirmation") {
        return res
          .status(400)
          .json({ message: "Job completion request not yet made by worker." });
      }

      job.status = "completed";
      job.paymentStatus = "completed";
      await job.save();

      // Increment worker's completed jobs count
      await User.findByIdAndUpdate(job.workerId, {
        $inc: { jobsCompleted: 1 },
      });

      return res.status(200).json({
        message: "Job marked as completed.",
        job: {
          ...job.toObject(),
          paymentStatus: job.paymentStatus,
        },
      });
    }

    return res.status(403).json({ message: "Unauthorized action" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get complete job details
export const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Fetch job details and populate client & worker info
    const job = await Job.findById(jobId)
      .populate("clientId", "name email role")
      .populate("workerId", "name email role")
      .lean();

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Structure response with budget type information
    const jobDetails = {
      jobId: job._id,
      title: job.title,
      description: job.description,
      category: job.category,
      budgetType: job.openToOffer ? "open_to_offer" : "fixed",
      budget: job.openToOffer ? null : job.budget,
      rightNow: job.rightNow,
      scheduledDateTime: job.scheduledDateTime,
      location: job.location,
      skillsRequired: job.skillsRequired,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      client: job.clientId
        ? {
            name: job.clientId.name,
            email: job.clientId.email,
            role: job.clientId.role,
          }
        : null,
      worker: job.workerId
        ? {
            name: job.workerId.name,
            email: job.workerId.email,
            role: job.workerId.role,
          }
        : null,
      verifications: {
        clientVerified: job.clientVerification,
        workerVerified: job.workerVerification,
      },
      paymentStatus: job.paymentStatus,
    };

    res.status(200).json(jobDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

// Add a new endpoint to get jobs by budget type
export const getJobsByBudgetType = async (req, res) => {
  try {
    const { budgetType, page = 1, limit = 10 } = req.query;

    if (!budgetType || !["open_to_offer", "fixed"].includes(budgetType)) {
      return res.status(400).json({
        message:
          "Invalid budget type. Must be either 'open_to_offer' or 'fixed'",
      });
    }

    const filter = {
      status: "open",
      openToOffer: budgetType === "open_to_offer",
    };

    const jobs = await Job.find(filter)
      .populate("clientId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const transformedJobs = jobs.map((job) => ({
      ...job.toObject(),
      budgetType: job.openToOffer ? "open_to_offer" : "fixed",
      budget: job.openToOffer ? null : job.budget,
    }));

    res.status(200).json(transformedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
