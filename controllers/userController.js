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
