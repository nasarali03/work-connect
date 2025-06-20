import Feedback from "../models/feedback.js";
import Job from "../models/job.js";
import Notification from "../models/notification.js";
// 1. Create feedback
export const createFeedback = async (req, res) => {
  try {
    const { description, rate, jobId } = req.body;
    const userId = req.user.id;

    // Find the job and check if completed
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Feedback can only be given after job completion." });
    }
    if (job.clientId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only the client can leave feedback for this job." });
    }

    // Check if feedback already exists for this job by this client
    const existingFeedback = await Feedback.findOne({
      user: userId,
      job: jobId,
    });
    if (existingFeedback) {
      return res
        .status(400)
        .json({ message: "Feedback already submitted for this job." });
    }

    // Create feedback
    const newFeedback = new Feedback({
      user: userId,
      worker: job.workerId,
      job: jobId,
      description,
      rate,
    });

    const savedFeedback = await newFeedback.save();

    // Send notification to worker
    await Notification.create({
      userId: job.workerId,
      message: `You have received a new review for the job "${job.title}".`,
      type: "review_received",
      jobId: job._id,
      data: {
        feedbackId: savedFeedback._id,
        rate,
        description,
      },
    });

    res.status(201).json({
      message: "Feedback created and worker notified successfully",
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. Get all feedbacks
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate(
      "user",
      "firstName lastName profilePicture rate description"
    );
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. Get feedback by ID
export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate(
      "user",
      "firstName lastName profilePicture rate description "
    );
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });
    res.status(200).json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 5. Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });

    res.status(200).json({ message: "Feedback deleted" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
