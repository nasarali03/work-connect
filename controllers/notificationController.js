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

    // Get job details with populated client and worker
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
        // Get job offer details with worker details
        const jobOffer = await JobOffer.findById(notification.data?.offerId)
          .populate({
            path: "workerId",
            select: "firstName lastName email workerDetails",
            populate: {
              path: "workerDetails",
              select:
                "profilePicture profession skills experience about verificationStatus activityStatus",
            },
          })
          .populate("clientId", "firstName lastName email");

        if (jobOffer) {
          // Calculate average rating from feedback
          const feedback = jobOffer.workerId.workerDetails?.feedback || [];
          const averageRating =
            feedback.length > 0
              ? (
                  feedback.reduce((sum, entry) => sum + entry.rating, 0) /
                  feedback.length
                ).toFixed(1)
              : 0;

          additionalData = {
            offer: {
              id: jobOffer._id,
              amount: jobOffer.offerAmount,
              status: jobOffer.status,
              createdAt: jobOffer.createdAt,
              rejectionReason: jobOffer.rejectionReason,
              worker: {
                id: jobOffer.workerId._id,
                name: `${jobOffer.workerId.firstName} ${jobOffer.workerId.lastName}`,
                email: jobOffer.workerId.email,
                profile: {
                  image: jobOffer.workerId.workerDetails?.profilePicture || "",
                  profession: jobOffer.workerId.workerDetails?.profession || "",
                  skills: jobOffer.workerId.workerDetails?.skills || [],
                  experience: jobOffer.workerId.workerDetails?.experience || "",
                  about: jobOffer.workerId.workerDetails?.about || "",
                  verificationStatus:
                    jobOffer.workerId.workerDetails?.verificationStatus ||
                    "pending",
                  activityStatus:
                    jobOffer.workerId.workerDetails?.activityStatus ||
                    "offline",
                  rating: parseFloat(averageRating),
                  totalReviews: feedback.length,
                },
              },
            },
            workerId: notification.data.workerId,
          };
        }
        break;

      case "job_request":
        // Get worker details
        const worker = await User.findById(job.workerId).select(
          "firstName lastName email workerDetails"
        );

        if (worker) {
          const feedback = worker.workerDetails?.feedback || [];
          const averageRating =
            feedback.length > 0
              ? (
                  feedback.reduce((sum, entry) => sum + entry.rating, 0) /
                  feedback.length
                ).toFixed(1)
              : 0;

          additionalData = {
            workerProfile: {
              id: worker._id,
              name: `${worker.firstName} ${worker.lastName}`,
              email: worker.email,
              image: worker.workerDetails?.profilePicture || "",
              profession: worker.workerDetails?.profession || "",
              skills: worker.workerDetails?.skills || [],
              experience: worker.workerDetails?.experience || "",
              about: worker.workerDetails?.about || "",
              verificationStatus:
                worker.workerDetails?.verificationStatus || "pending",
              activityStatus: worker.workerDetails?.activityStatus || "offline",
              rating: parseFloat(averageRating),
              totalReviews: feedback.length,
            },
            workerId: job.workerId,
          };
        }
        break;

      case "job_completed":
        // Get worker details for completed job
        const completedWorker = await User.findById(job.workerId).select(
          "firstName lastName email workerDetails"
        );

        if (completedWorker) {
          const feedback = completedWorker.workerDetails?.feedback || [];
          const averageRating =
            feedback.length > 0
              ? (
                  feedback.reduce((sum, entry) => sum + entry.rating, 0) /
                  feedback.length
                ).toFixed(1)
              : 0;

          additionalData = {
            completionDate: job.completedAt,
            paymentStatus: job.paymentStatus,
            clientVerification: job.clientVerification,
            workerVerification: job.workerVerification,
            workerId: job.workerId,
            workerProfile: {
              id: completedWorker._id,
              name: `${completedWorker.firstName} ${completedWorker.lastName}`,
              email: completedWorker.email,
              image: completedWorker.workerDetails?.profilePicture || "",
              profession: completedWorker.workerDetails?.profession || "",
              skills: completedWorker.workerDetails?.skills || [],
              experience: completedWorker.workerDetails?.experience || "",
              about: completedWorker.workerDetails?.about || "",
              verificationStatus:
                completedWorker.workerDetails?.verificationStatus || "pending",
              activityStatus:
                completedWorker.workerDetails?.activityStatus || "offline",
              rating: parseFloat(averageRating),
              totalReviews: feedback.length,
            },
          };
        }
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
        data: notification.data,
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
              about: job.workerId.about || "",
              skills: job.workerId.workerDetails.skills || [],
              profilePicture: job.workerId.workerDetails.profilePicture || "",
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
