import Job from "../models/job.js";
import JobOffer from "../models/JobOffer.js";
import Profile from "../models/Profile.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import ServiceFee from "../models/ServiceFee.js";

// Create a job
export const createJob = async (req, res) => {
  try {
    console.log(req.user.role);
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
    if (!title || !description || !category || !location) {
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

// Get all open jobs - Modified to allow any logged-in user to view
export const getOpenJobs = async (req, res) => {
  try {
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
      .populate(
        "clientId",
        "firstName lastName phoneNumber profilePicture email"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Transform the response to include additional information
    const transformedJobs = jobs.map((job) => ({
      ...job.toObject(),
      budgetType: job.openToOffer ? "open_to_offer" : "fixed",
      budget: job.openToOffer ? null : job.budget,
      canApply: req.user.role.includes("worker"), // Only workers can apply
      isClient: req.user.id === job.clientId._id.toString(), // Check if current user is the client
      isWorker:
        req.user.id === (job.workerId ? job.workerId._id.toString() : null), // Check if current user is the worker
    }));

    res.status(200).json(transformedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Worker requests to accept a job or makes an offer
export const requestJobAcceptance = async (req, res) => {
  try {
    if (!req.user.role.includes("worker")) {
      return res.status(403).json({ message: "Only workers can accept jobs" });
    }

    const { offerAmount } = req.body;
    const jobId = req.params.jobId;

    const job = await Job.findById(jobId);
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

    // Get worker's complete details
    const worker = await User.findById(req.user.id)
      .select(
        "firstName lastName email phoneNumber profilePicture workerDetails jobsCompleted jobsAccepted"
      )
      .lean();

    const workerName = `${worker.firstName} ${worker.lastName}`.trim();

    // Handle job acceptance based on whether it's open to offers or not
    if (job.openToOffer) {
      // Validate offer amount for jobs open to offers
      if (!offerAmount || typeof offerAmount !== "number" || offerAmount <= 0) {
        return res.status(400).json({
          message: "Valid offer amount is required for jobs open to offers",
        });
      }

      // Create a job offer
      const jobOffer = new JobOffer({
        jobId: job._id,
        workerId: req.user.id,
        clientId: job.clientId,
        offerAmount: offerAmount,
        status: "pending",
        message: `Worker ${workerName} has made an offer of $${offerAmount} for your job: ${job.title}`,
      });

      await jobOffer.save();

      // Notify client about the offer with complete worker details
      await Notification.create({
        userId: job.clientId,
        message: `Worker ${workerName} has made an offer of $${offerAmount} for your job: ${job.title}`,
        type: "job_offer",
        jobId: job._id,
        data: {
          offerId: jobOffer._id,
          offerAmount: offerAmount,
          workerId: req.user.id,
          worker: {
            fullName: workerName,
            email: worker.email,
            phoneNumber: worker.phoneNumber,
            profilePicture: worker.profilePicture,
            skills: worker.workerDetails?.skills || [],
            experience: worker.workerDetails?.experience,
            profession: worker.workerDetails?.profession,
            rating:
              worker.workerDetails?.feedback?.length > 0
                ? worker.workerDetails.feedback.reduce(
                    (acc, curr) => acc + curr.rating,
                    0
                  ) / worker.workerDetails.feedback.length
                : 0,
            jobsCompleted: worker.jobsCompleted,
            jobsAccepted: worker.jobsAccepted,
            verificationStatus: worker.workerDetails?.verificationStatus,
            about: worker.workerDetails?.about,
          },
        },
      });

      return res.status(200).json({
        message: "Job offer sent to client for review",
        offer: jobOffer,
      });
    } else {
      // For fixed budget jobs, create a job offer with the fixed budget amount
      const jobOffer = new JobOffer({
        jobId: job._id,
        workerId: req.user.id,
        clientId: job.clientId,
        offerAmount: job.budget,
        status: "pending",
        message: `Worker ${workerName} wants to accept your job: ${job.title} for the fixed budget of $${job.budget}`,
      });

      await jobOffer.save();

      // Update job status
      job.status = "pending_approval";
      job.workerId = req.user.id;
      await job.save();

      // Notify client with complete worker details
      await Notification.create({
        userId: job.clientId,
        message: `Worker ${workerName} wants to accept your job: ${job.title} for the fixed budget of $${job.budget}`,
        type: "job_request",
        jobId: job._id,
        data: {
          offerId: jobOffer._id,
          workerId: req.user.id,
          offerAmount: job.budget,
          worker: {
            fullName: workerName,
            email: worker.email,
            phoneNumber: worker.phoneNumber,
            profilePicture: worker.profilePicture,
            skills: worker.workerDetails?.skills || [],
            experience: worker.workerDetails?.experience,
            profession: worker.workerDetails?.profession,
            rating:
              worker.workerDetails?.feedback?.length > 0
                ? worker.workerDetails.feedback.reduce(
                    (acc, curr) => acc + curr.rating,
                    0
                  ) / worker.workerDetails.feedback.length
                : 0,
            jobsCompleted: worker.jobsCompleted,
            jobsAccepted: worker.jobsAccepted,
            verificationStatus: worker.workerDetails?.verificationStatus,
            about: worker.workerDetails?.about,
          },
        },
      });

      return res.status(200).json({
        message: "Job request sent to client for approval",
        job,
        offer: jobOffer,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Client accepts a job offer
export const acceptJobOffer = async (req, res) => {
  try {
    if (!req.user.role.includes("client")) {
      return res
        .status(403)
        .json({ message: "Only clients can accept job offers" });
    }

    const { offerId } = req.params;
    const jobOffer = await JobOffer.findById(offerId);

    if (!jobOffer) {
      return res.status(404).json({ message: "Job offer not found" });
    }

    // Verify the client owns the job
    const job = await Job.findById(jobOffer.jobId);
    if (!job || job.clientId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to accept this offer" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ message: "Job is no longer available" });
    }

    // Get client's complete details
    const client = await User.findById(req.user.id)
      .select(
        "firstName lastName email phoneNumber profilePicture location jobsPosted"
      )
      .lean();

    const clientName = `${client.firstName} ${client.lastName}`.trim();

    // Calculate service fee (10% of offer amount)
    const serviceFeePercentage = 10; // This could be configurable
    const serviceFeeAmount =
      (jobOffer.offerAmount * serviceFeePercentage) / 100;

    // Update job with worker and offer amount
    job.status = "in progress";
    job.workerId = jobOffer.workerId;
    job.budget = jobOffer.offerAmount; // Set the budget to the accepted offer amount
    await job.save();

    // Update offer status
    jobOffer.status = "accepted";
    await jobOffer.save();

    // Create service fee record
    const serviceFee = new ServiceFee({
      jobId: job._id,
      jobOfferId: jobOffer._id,
      workerId: jobOffer.workerId,
      clientId: job.clientId,
      jobAmount: jobOffer.offerAmount,
      serviceFeePercentage: serviceFeePercentage,
      serviceFeeAmount: serviceFeeAmount,
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days after job completion
    });

    await serviceFee.save();

    // Get worker's name from user model
    const worker = await User.findById(jobOffer.workerId);
    const workerName = `${worker.firstName} ${worker.lastName}`.trim();

    // Notify worker with complete client details
    await Notification.create({
      userId: jobOffer.workerId,
      message: `Your offer of $${jobOffer.offerAmount} has been accepted for the job: ${job.title}. Service fee of $${serviceFeeAmount} will be due after job completion.`,
      type: "offer_accepted",
      jobId: job._id,
      data: {
        offerId: jobOffer._id,
        workerId: jobOffer.workerId,
        serviceFee: {
          amount: serviceFeeAmount,
          percentage: serviceFeePercentage,
          dueDate: serviceFee.dueDate,
        },
        client: {
          fullName: clientName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          profilePicture: client.profilePicture,
          location: client.location,
          jobsPosted: client.jobsPosted,
          // Add any additional client details that might be relevant
          address: client.location?.address,
          latitude: client.location?.latitude,
          longitude: client.location?.longitude,
        },
        job: {
          title: job.title,
          description: job.description,
          category: job.category,
          location: job.location,
          skillsRequired: job.skillsRequired,
          scheduledDateTime: job.scheduledDateTime,
          rightNow: job.rightNow,
        },
      },
    });

    res.status(200).json({
      message: "Job offer accepted",
      job,
      offer: jobOffer,
      serviceFee: {
        amount: serviceFeeAmount,
        percentage: serviceFeePercentage,
        dueDate: serviceFee.dueDate,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Client rejects a job offer
export const rejectJobOffer = async (req, res) => {
  try {
    if (!req.user.role.includes("client")) {
      return res
        .status(403)
        .json({ message: "Only clients can reject job offers" });
    }

    const { offerId } = req.params;
    const { rejectionReason } = req.body; // Optional reason for rejection

    // Find the job offer
    const jobOffer = await JobOffer.findById(offerId);
    if (!jobOffer) {
      return res.status(404).json({ message: "Job offer not found" });
    }

    // Verify the client owns the job
    const job = await Job.findById(jobOffer.jobId);
    if (!job || job.clientId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to reject this offer" });
    }

    if (jobOffer.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This offer is no longer pending" });
    }

    // Get client's complete details
    const client = await User.findById(req.user.id)
      .select(
        "firstName lastName email phoneNumber profilePicture location jobsPosted"
      )
      .lean();

    const clientName = `${client.firstName} ${client.lastName}`.trim();

    // Update offer status
    jobOffer.status = "rejected";
    if (rejectionReason) {
      jobOffer.rejectionReason = rejectionReason;
    }
    await jobOffer.save();

    // Get worker's name from user model
    const worker = await User.findById(jobOffer.workerId);
    const workerName = `${worker.firstName} ${worker.lastName}`.trim();

    // Notify worker about the rejection with complete client details
    await Notification.create({
      userId: jobOffer.workerId,
      message: `Your offer of $${jobOffer.offerAmount} for the job "${
        job.title
      }" has been rejected${rejectionReason ? `: ${rejectionReason}` : ""}`,
      type: "offer_rejected",
      jobId: job._id,
      data: {
        offerId: jobOffer._id,
        rejectionReason: rejectionReason || null,
        workerId: jobOffer.workerId,
        client: {
          fullName: clientName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          profilePicture: client.profilePicture,
          location: client.location,
          jobsPosted: client.jobsPosted,
          address: client.location?.address,
          latitude: client.location?.latitude,
          longitude: client.location?.longitude,
        },
        job: {
          title: job.title,
          description: job.description,
          category: job.category,
          location: job.location,
          skillsRequired: job.skillsRequired,
          scheduledDateTime: job.scheduledDateTime,
          rightNow: job.rightNow,
        },
      },
    });

    // Also notify the client (for their records)
    await Notification.create({
      userId: req.user.id,
      message: `You have rejected ${workerName}'s offer of $${jobOffer.offerAmount} for the job "${job.title}"`,
      type: "offer_rejected",
      jobId: job._id,
      data: {
        offerId: jobOffer._id,
        rejectionReason: rejectionReason || null,
        workerId: jobOffer.workerId,
        client: {
          fullName: clientName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          profilePicture: client.profilePicture,
          location: client.location,
          jobsPosted: client.jobsPosted,
          address: client.location?.address,
          latitude: client.location?.latitude,
          longitude: client.location?.longitude,
        },
        job: {
          title: job.title,
          description: job.description,
          category: job.category,
          location: job.location,
          skillsRequired: job.skillsRequired,
          scheduledDateTime: job.scheduledDateTime,
          rightNow: job.rightNow,
        },
      },
    });

    res.status(200).json({
      message: "Job offer rejected successfully",
      offer: jobOffer,
    });
  } catch (error) {
    console.error("Error rejecting job offer:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all offers for a job (including rejected ones)
export const getJobOffers = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify the client owns the job
    const job = await Job.findById(jobId);
    if (!job || job.clientId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view offers for this job" });
    }

    const offers = await JobOffer.find({ jobId })
      .populate("workerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json(offers);
  } catch (error) {
    console.error("Error fetching job offers:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update job completion to handle service fee
export const completeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Verify the user is either the client or worker
    if (
      job.clientId.toString() !== req.user.id &&
      job.workerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update job status
    job.status = "completed";
    job.paymentStatus = "completed";
    await job.save();

    // Find the service fee record
    const serviceFee = await ServiceFee.findOne({ jobId: job._id });
    if (serviceFee) {
      // Update service fee status to pending payment
      serviceFee.status = "pending";
      serviceFee.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Due in 7 days
      await serviceFee.save();

      // Notify worker about service fee
      await Notification.create({
        userId: job.workerId,
        message: `Job "${job.title}" has been completed. Service fee of $${serviceFee.serviceFeeAmount} is due within 7 days.`,
        type: "service_fee_due",
        jobId: job._id,
        data: {
          serviceFeeId: serviceFee._id,
          amount: serviceFee.serviceFeeAmount,
          dueDate: serviceFee.dueDate,
        },
      });
    }

    res.status(200).json({
      message: "Job marked as completed",
      job,
      serviceFee: serviceFee
        ? {
            amount: serviceFee.serviceFeeAmount,
            dueDate: serviceFee.dueDate,
          }
        : null,
    });
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
