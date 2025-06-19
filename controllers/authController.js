import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";

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
        expiresIn: "7d",
      }
    );

    res
      .status(200)
      .json({ message: "Login successful", token, role: user.roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Step 1: User requests code
export const requestVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send code via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Password Reset Verification Code",
      html: `<h3>Your Verification Code</h3>
             <p>Use this code to reset your password: <b>${code}</b></p>
             <p>This code will expire in 10 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification code sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Error sending verification code" });
  }
};

// Step 2: User submits code
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (
      !user ||
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.status(200).json({ message: "Code verified" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying code" });
  }
};

// Step 3: User sets new password
export const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (
      !user ||
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Changed Successfully",
      html: `<h3>Password Changed</h3>
             <p>Your password was changed successfully. If you did not perform this action, please contact support immediately.</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
};
