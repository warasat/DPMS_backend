import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
// import User from "../models/User"; // Use `.js` for ES modules

// Store OTP temporarily
const otpStore = new Map();

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "muzammilarif367@gmail.com",
    pass: "gdea linf scvk zhll", // App password
  },
});

// Generate and send OTP
export const sendOTP = async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();

  otpStore.set(email, otp);
  setTimeout(() => otpStore.delete(email), 5 * 60 * 1000); // Auto-expire

  const mailOptions = {
    from: "muzammilarif367@gmail.com",
    to: email,
    subject: "Your OTP Code - DPMS",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <img src="https://cdn-icons-png.flaticon.com/512/3176/3176367.png" alt="Logo" style="height: 50px; width: 50px;"/>
          <h1 style="color: #4F46E5; font-size: 24px; margin-left: 10px;">DPMS</h1>
        </div>
        <h2>Your OTP Code</h2>
        <p>Use the following OTP to verify your login. It expires in <strong>5 minutes</strong>.</p>
        <div style="background: #4F46E5; color: white; font-size: 22px; padding: 12px; border-radius: 5px;">${otp}</div>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStore.get(email);

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.delete(email); // Clear OTP
  await sendRegisteredSuccessEmail(email);
  res.status(200).json({ message: "OTP verified successfully" });
};

// Send confirmation email
async function sendRegisteredSuccessEmail(email) {
  const mailOptions = {
    from: "muzammilarif367@gmail.com",
    to: email,
    subject: "User Registered Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <img src="https://cdn-icons-png.flaticon.com/512/3176/3176367.png" alt="Logo" style="height: 50px; width: 50px;"/>
          <h1 style="color: #4F46E5; font-size: 24px; margin-left: 10px;">DPMS</h1>
        </div>
        <h2>Welcome to DPMS!</h2>
        <p>Your registration has been completed successfully. You can now log in and start using the platform.</p>
        <div style="background: #4F46E5; color: white; font-size: 18px; padding: 12px; border-radius: 5px;">You're all set!</div>
        <p>Need help? Contact <a href="mailto:support@dpms.com">support@dpms.com</a></p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent:", info.response);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}
