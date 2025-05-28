import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const registerUser = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user (no role assigned yet)
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Work Connect – Complete Your Profile",
      html: `<h3>Welcome to Work Connect!</h3>
             <p>Your account has been created successfully with <b>${email}</b>.</p>
             <p>Please log in and complete your profile.</p>
             <p>Thank you!</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log("Email Error:", err);
      } else {
        console.log("Email Sent:", info.response);
      }
    });

    res
      .status(201)
      .json({ message: "User registered successfully! Email sent." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { email, firstName, lastName, location, phoneNumber } = req.body;

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { firstName, lastName, location, phoneNumber },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Login a user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.roles },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res
      .status(200)
      .json({ message: "Login successful", token, role: user.roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
