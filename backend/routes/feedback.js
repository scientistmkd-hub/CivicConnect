const express = require("express");
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const Complaint = require("../models/Complaint");
const User = require("../models/User");

const router = express.Router();

/*
 * POST /api/feedback
 * Submit feedback for a resolved complaint
 */
router.post("/", async (req, res) => {
  try {
    const { userId, complaintId, rating, message } = req.body;

    // Validate required fields
    if (!userId || !complaintId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, complaintId and rating are required",
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaintId",
      });
    }

    // Validate rating
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Check user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check complaint
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Make sure complaint belongs to this user
    if (String(complaint.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only give feedback for your own complaint",
      });
    }

    // Feedback only after resolution
    if (complaint.status !== "Resolved") {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted after the complaint is resolved",
      });
    }

    // Prevent duplicate feedback
    const existingFeedback = await Feedback.findOne({
      userId,
      complaintId,
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: "Feedback has already been submitted for this complaint",
      });
    }

    // Optional message
    const cleanMessage =
      typeof message === "string" ? message.trim() : "";

    // Create feedback
    const feedback = await Feedback.create({
      userId,
      complaintId,
      rating: numericRating,
      message: cleanMessage,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});


/*
 * GET /api/feedback/user/:userId
 * Get feedback submitted by a specific user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const feedback = await Feedback.find({ userId })
      .populate("complaintId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("Get user feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
});


/*
 * GET /api/feedback
 * Admin feedback listing
 *
 * NOTE:
 * Proper admin authorization will be added in the
 * next security step. For now this endpoint provides
 * the feedback data needed by the Admin UI.
 */
router.get("/", async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "name email")
      .populate("complaintId")
      .sort({ createdAt: -1 });

    const totalFeedback = feedback.length;

    const averageRating =
      totalFeedback > 0
        ? feedback.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
          ) / totalFeedback
        : 0;

    return res.json({
      success: true,
      feedback,
      statistics: {
        totalFeedback,
        averageRating: Number(averageRating.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Get all feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
});


module.exports = router;