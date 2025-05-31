import mongoose from "mongoose";

const ServiceFeeSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    jobOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOffer",
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
    jobAmount: {
      type: Number,
      required: true,
    },
    serviceFeePercentage: {
      type: Number,
      required: true,
      default: 10, // 10% service fee
    },
    serviceFeeAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

const ServiceFee = mongoose.model("ServiceFee", ServiceFeeSchema);
export default ServiceFee;
