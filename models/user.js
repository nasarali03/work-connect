const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email validation
    },
    phoneNumber: { type: String },
    password: { type: String, required: true },

    roles: {
      type: [String], // Now an array instead of a single role
      enum: ["client", "worker"],
      default: ["client"], // Every user starts as a client
    },

    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    workerDetails: {
      profilePicture: { type: String, default: "" },
      profession: { type: String },
      skills: { type: [String] },
      experience: { type: String },
      cnic: { type: String },
      verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      about: { type: String },
      cnicFront: { type: String, default: "" }, // Front side of CNIC
      cnicBack: { type: String, default: "" }, // Back side of CNIC
      certificate: { type: String, default: "" }, // Professional certificate (optional)

      feedback: [
        {
          clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          clientName: { type: String }, // optional, to quickly show name
          rating: { type: Number, min: 1, max: 5 },
          comment: { type: String },
          date: { type: Date, default: Date.now },
        },
      ],
    },
    jobsPosted: { type: Number, default: 0 }, // Number of jobs posted
    // Fields for workers
    jobsAccepted: { type: Number, default: 0 }, // Number of jobs accepted
    jobsCompleted: { type: Number, default: 0 }, // Number of jobs completed
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", UserSchema);
