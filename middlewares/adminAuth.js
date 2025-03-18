const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin"); // Ensure the Admin model exists

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res
        .status(401)
        .json({ message: "Admin not found. Unauthorized." });
    }

    req.admin = admin; // Attach admin data to request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = adminAuth;
