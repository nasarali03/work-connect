const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // Example: "Plumbing", "Electrician", "Construction"
    budget: { type: Number, required: true, min: 0 },

    // Job location details
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true }, // Human-readable address
    },

    skillsRequired: { type: [String], default: [] },

    duration: { type: String, required: true }, // Example: "2 hours", "3 days"

    status: {
      type: String,
      enum: ["open", "in progress", "completed", "cancelled"],
      default: "open",
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Will be assigned when a worker accepts the job
    },

    clientVerification: {
      type: Boolean,
      default: false, // Client verifies when work is done
    },

    workerVerification: {
      type: Boolean,
      default: false, // Worker verifies when they complete work
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "in progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
