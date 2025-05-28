import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    complainant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Who made the complaint
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Who the complaint is about
    complaintType: {
      type: String,
      enum: ["behavior", "fraud", "quality", "other"],
      default: "other",
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    response: { type: String }, // Admin response
  },
  { timestamps: true }
);
const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
