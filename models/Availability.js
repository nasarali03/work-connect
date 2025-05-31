import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0, // Sunday
      max: 6, // Saturday
    },
    startTime: {
      type: String,
      required: true,
      // Format: "HH:mm" in 24-hour format
    },
    endTime: {
      type: String,
      required: true,
      // Format: "HH:mm" in 24-hour format
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    breakTimes: [
      {
        startTime: String,
        endTime: String,
      },
    ],
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", AvailabilitySchema);
export default Availability;
