import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "job_request",
        "job_approved",
        "job_completed",
        "payment_received",
        "system",
        "booking_request",
        "booking_status",
        "booking_confirmed",
        "booking_completion_request",
        "booking_completed",
      ],
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // For any additional data
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
