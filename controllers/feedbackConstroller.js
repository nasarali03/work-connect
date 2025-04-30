const Feedback = require("../models/Feedback");

// 1. Create feedback
exports.createFeedback = async (req, res) => {
  try {
    const { description, rate } = req.body;
    const userId = req.user.id;

    const newFeedback = new Feedback({
      user: userId,
      description,
      rate,
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json({
      message: "Feedback created successfully",
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. Get all feedbacks
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate(
      "user",
      "firstName lastName profilePicture rate description"
    );
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. Get feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate(
      "user",
      "firstName lastName profilePicture rate description "
    );
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });
    res.status(200).json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 5. Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });

    res.status(200).json({ message: "Feedback deleted" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
