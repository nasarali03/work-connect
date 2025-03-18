const mongoose = require("mongoose");

const WorkerRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true }, // Store hashed passwords
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    profession: { type: String, required: true },
    skills: { type: [String], default: [] },
    experience: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    profilePicture: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkerRequest", WorkerRequestSchema);
