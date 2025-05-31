import Notification from "../models/notification.js";
import User from "../models/user.js";
import JobOffer from "../models/JobOffer.js";
import Job from "../models/job.js";
import Profile from "../models/Profile.js";

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("jobId", "title status")
      .populate({
        path: "data.offerId",
        model: "JobOffer",
        select: "offerAmount status",
      });

    const total = await Notification.countDocuments({ userId });

    res.status(200).json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get notifications by type
export const getNotificationsByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({
      userId,
      type,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("jobId", "title status")
      .populate({
        path: "data.offerId",
        model: "JobOffer",
        select: "offerAmount status",
      });

    const total = await Notification.countDocuments({ userId, type });

    res.status(200).json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications by type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread notifications count by type
export const getUnreadCountByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    const unreadCount = await Notification.countDocuments({
      userId,
      type,
      read: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count by type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid notification IDs" });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: userId,
      },
      {
        $set: { read: true },
      }
    );

    res.status(200).json({
      message: "Notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete notifications
export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid notification IDs" });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId: userId,
    });

    res.status(200).json({
      message: "Notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get notification details with job information
export const getNotificationDetails = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Find the notification and verify ownership
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Mark the notification as read
    notification.read = true;
    await notification.save();

    // Get job details
    const job = await Job.findById(notification.jobId)
      .populate("clientId", "firstName lastName email")
      .populate("workerId", "firstName lastName email");

    if (!job) {
      return res.status(404).json({ message: "Associated job not found" });
    }

    // Get additional data based on notification type
    let additionalData = {};

    switch (notification.type) {
      case "job_offer":
      case "offer_accepted":
      case "offer_rejected":
        // Get job offer details
        const jobOffer = await JobOffer.findById(notification.data?.offerId)
          .populate("workerId", "firstName lastName email")
          .populate("clientId", "firstName lastName email");

        if (jobOffer) {
          additionalData = {
            offer: {
              id: jobOffer._id,
              amount: jobOffer.offerAmount,
              status: jobOffer.status,
              createdAt: jobOffer.createdAt,
              worker: {
                id: jobOffer.workerId._id,
                name: `${jobOffer.workerId.firstName} ${jobOffer.workerId.lastName}`,
                email: jobOffer.workerId.email,
              },
            },
          };
        }
        break;

      case "job_request":
        // Get worker profile details
        const workerProfile = await Profile.findOne({
          userId: job.workerId,
        }).select("skills experience rating");

        if (workerProfile) {
          additionalData = {
            workerProfile: {
              skills: workerProfile.skills,
              experience: workerProfile.experience,
              rating: workerProfile.rating,
            },
          };
        }
        break;

      case "job_completed":
        // Get completion details
        additionalData = {
          completionDate: job.completedAt,
          paymentStatus: job.paymentStatus,
          clientVerification: job.clientVerification,
          workerVerification: job.workerVerification,
        };
        break;
    }

    // Prepare the response
    const response = {
      notification: {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.read,
      },
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        category: job.category,
        budget: job.budget,
        location: job.location,
        status: job.status,
        skillsRequired: job.skillsRequired,
        createdAt: job.createdAt,
        client: {
          id: job.clientId._id,
          name: `${job.clientId.firstName} ${job.clientId.lastName}`,
          email: job.clientId.email,
        },
        worker: job.workerId
          ? {
              id: job.workerId._id,
              name: `${job.workerId.firstName} ${job.workerId.lastName}`,
              email: job.workerId.email,
            }
          : null,
      },
      ...additionalData,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching notification details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
