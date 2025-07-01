import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // Example: "Plumbing", "Electrician", "Construction"
    budget: {
      type: Number,
      required: function () {
        return !this.openToOffer; // Only required if openToOffer is false
      },
      min: 0,
    },
    openToOffer: { type: Boolean, default: false },
    rightNow: { type: Boolean, default: false },
    scheduledDateTime: { type: Date },

    // Job location details
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true }, // Human-readable address
    },

    skillsRequired: { type: [String], default: [] },

    status: {
      type: String,
      enum: [
        "open",
        "in progress",
        "completed",
        "cancelled",
        "pending_approval",
      ],
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

    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    companyFee: { type: Number },
    amountPaid: { type: Number },
  },
  { timestamps: true }
);

// Add a pre-save middleware to handle budget validation
JobSchema.pre("save", function (next) {
  if (this.openToOffer) {
    this.budget = null; // Set budget to null if openToOffer is true
  }
  next();
});

const Job = mongoose.model("Job", JobSchema);
export default Job;
