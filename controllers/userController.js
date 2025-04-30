const User = require("../models/user.js");

exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name role jobsPosted jobsAccepted jobsCompleted"
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the request object
    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserProfileImage = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the request object
    const user = await User.findById(userId); // Find the user by ID
    const { base64 } = req.body;

    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = base64; // Update the profile picture field
    await user.save(); // Save the updated user document
    res
      .status(200)
      .json({ status: "ok", message: "Image uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
