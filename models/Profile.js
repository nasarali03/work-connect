import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skills: { type: [String], default: [] }, // For workers
    experience: { type: String }, // For workers
    companyName: { type: String }, // For clients
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", ProfileSchema);
export default Profile;
