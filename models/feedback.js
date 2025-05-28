import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Who made the feedback

    description: { type: String, required: true },
    rate: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    response: { type: String }, // Admin response
  },
  { timestamps: true }
);
const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
