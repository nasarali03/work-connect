import Message from "../models/chat.js";
import User from "../models/user.js";
import Job from "../models/job.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, jobId, content } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (!receiverId || !jobId || !content) {
      return res.status(400).json({
        message: "Receiver ID, Job ID, and content are required",
      });
    }

    // Verify job exists and user is part of it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Verify sender is either client or worker of the job
    if (
      job.clientId.toString() !== senderId &&
      job.workerId?.toString() !== senderId
    ) {
      return res.status(403).json({
        message: "You are not authorized to send messages for this job",
      });
    }

    // Verify receiver is the other party in the job
    if (
      job.clientId.toString() !== receiverId &&
      job.workerId?.toString() !== receiverId
    ) {
      return res.status(403).json({
        message: "Invalid receiver for this job",
      });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      jobId,
      content,
    });

    await message.save();

    // Populate sender and receiver names for response
    await message.populate([
      { path: "sender", select: "firstName lastName" },
      { path: "receiver", select: "firstName lastName" },
    ]);

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get chat history for a specific job
export const getChatHistory = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Verify job exists and user is part of it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Verify user is either client or worker of the job
    if (
      job.clientId.toString() !== userId &&
      job.workerId?.toString() !== userId
    ) {
      return res.status(403).json({
        message: "You are not authorized to view messages for this job",
      });
    }

    // Get messages for this job
    const messages = await Message.find({ jobId })
      .populate("sender", "firstName lastName")
      .populate("receiver", "firstName lastName")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Update all unread messages for this job where user is the receiver
    const result = await Message.updateMany(
      {
        jobId,
        receiver: userId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res.status(200).json({
      message: "Messages marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all chat jobs for a user
export const getChatJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all jobs where user is either client or worker
    const jobs = await Job.find({
      $or: [{ clientId: userId }, { workerId: userId }],
    }).select("title status clientId workerId");

    // Get the last message for each job
    const jobsWithLastMessage = await Promise.all(
      jobs.map(async (job) => {
        const lastMessage = await Message.findOne({ jobId: job._id })
          .sort({ createdAt: -1 })
          .populate("sender", "firstName lastName")
          .populate("receiver", "firstName lastName");

        return {
          jobId: job._id,
          title: job.title,
          status: job.status,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                sender: lastMessage.sender,
                receiver: lastMessage.receiver,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      })
    );

    res.status(200).json(jobsWithLastMessage);
  } catch (error) {
    console.error("Error getting chat jobs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
