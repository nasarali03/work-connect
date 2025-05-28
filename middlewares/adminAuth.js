import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js"; // Make sure Admin.js uses `export default`

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
export default adminAuth;
