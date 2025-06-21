import Complaint from "../models/complaint.js";
import User from "../models/user.js";

// Submit a complaint
export const submitComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, profession, description } = req.body;

    if (!fullName || !description) {
      return res
        .status(400)
        .json({ message: "Full name and description are required." });
    }

    // Fetch user to determine role
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    let finalProfession = profession;
    if (user.roles.includes("worker")) {
      // If worker, profession is required (either from body or user profile)
      if (!finalProfession) {
        // Try to get from user profile if not provided
        finalProfession =
          user.profession ||
          (user.workerDetails && user.workerDetails.profession);
        if (!finalProfession) {
          return res
            .status(400)
            .json({ message: "Profession is required for workers." });
        }
      }
    } else {
      // If not a worker, ignore profession
      finalProfession = undefined;
    }

    const complaint = new Complaint({
      user: userId,
      fullName,
      profession: finalProfession,
      description,
    });

    await complaint.save();

    res
      .status(201)
      .json({ message: "Complaint submitted successfully.", complaint });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// (Optional) Get all complaints (for admin)
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate(
      "user",
      "firstName lastName roles"
    );
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
