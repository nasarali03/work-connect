const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  console.log("Token Created:", token); // ✅ Debugging
  console.log("JWT_SECRET used for Signing:", process.env.JWT_SECRET);
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided" });
  }

  console.log("Received Token:", token); // ✅ Debugging

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.log("JWT Verification Error:", error.message); // ✅ Debugging
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
