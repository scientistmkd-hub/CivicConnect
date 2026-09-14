const express = require("express");
const nodemailer = require("nodemailer");
const Otp = require("../models/Otp");
const User = require("../models/User");

require("dotenv").config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// SEND OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({
      email: cleanEmail
    });

    await Otp.create({
      email: cleanEmail,
      otp,
      expiresAt
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: "Civic Connect - Login OTP",
      text: `Your Civic Connect login OTP is ${otp}. This OTP is valid for 5 minutes.`
    });

    res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error("Send OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({
      email: cleanEmail
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP."
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteMany({
        email: cleanEmail
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP."
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    await Otp.deleteMany({
      email: cleanEmail
    });

    let user = await User.findOne({
      email: cleanEmail
    });

    if (!user) {
      user = await User.create({
        email: cleanEmail
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
});

module.exports = router;