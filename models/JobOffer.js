import mongoose from "mongoose";

const JobOfferSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const JobOffer = mongoose.model("JobOffer", JobOfferSchema);
export default JobOffer;
