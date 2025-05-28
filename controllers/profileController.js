import Profile from "../models/Profile.js";
// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { skills, experience, location } = req.body;
    console.log(req.user.id);
    // Find the profile for the logged-in user
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update profile fields
    if (skills) profile.skills = skills;
    if (experience) profile.experience = experience;
    if (location) profile.location = location;

    await profile.save();

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
