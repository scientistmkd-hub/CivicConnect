const express = require("express");
const { analyzeWithMultiAI } = require("../services/multiAI");

const Complaint = require("../models/Complaint");

require("dotenv").config();

const router = express.Router();

// ========================================
// GET ALL COMPLAINTS
// ========================================

router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints
    });

  } catch (error) {
    console.error(
      "Get Complaints Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints"
    });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      userId: req.params.userId
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error("Get User Complaints Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user complaints"
    });
  }
});

// ========================================
// CREATE COMPLAINT + MULTI-AI ANALYSIS
// ========================================

router.post("/", async (req, res) => {
  try {
    const {
      userId,
      category,
      description,
      imageUrl,
      lat,
      lng
    } = req.body;

    console.log(
      "Complaint request received:",
      req.body
    );

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!userId || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "User, category and description are required"
      });
    }

    // ========================================
    // MULTI-AI ANALYSIS
    // ========================================

    let aiAnalysis = "";
    let aiPriority = "Medium";

    try {

      const aiResults =
        await analyzeWithMultiAI(
          category,
          description
        );

      // Save all AI results
      aiAnalysis =
        JSON.stringify(aiResults);

      // ========================================
      // AI PRIORITY CONSENSUS
      // ========================================

      const priorities = [
        "Low",
        "Medium",
        "High",
        "Critical"
      ];

      const priorityVotes = {};

      Object.values(aiResults).forEach(
        (result) => {

          if (
            result &&
            result.priority &&
            priorities.includes(
              result.priority
            )
          ) {

            const priority =
              result.priority;

            priorityVotes[priority] =
              (priorityVotes[priority] || 0) + 1;
          }
        }
      );

      console.log(
        "AI Priority Votes:",
        priorityVotes
      );

      // ========================================
      // FIND MAJORITY PRIORITY
      // ========================================

      let highestVotes = 0;

      for (const priority of priorities) {

        const votes =
          priorityVotes[priority] || 0;

        if (votes > highestVotes) {

          highestVotes = votes;

          aiPriority = priority;
        }
      }

      console.log(
        "Final AI Priority:",
        aiPriority
      );

      console.log(
        "Priority Votes:",
        highestVotes
      );

    } catch (aiError) {

      console.error(
        "Multi-AI Analysis Error:",
        aiError.message
      );

      aiAnalysis =
        JSON.stringify({
          error:
            "Multi-AI analysis failed",
          message:
            aiError.message
        });

      aiPriority = "Medium";
    }

    // ========================================
    // SAVE COMPLAINT
    // ========================================

    const complaint =
      await Complaint.create({

        userId,

        category,

        description,

        imageUrl:
          imageUrl || "",

        location: {
          lat: lat || null,
          lng: lng || null
        },

        priority:
          aiPriority,

        aiAnalysis
      });

    console.log(
      "Complaint saved:",
      complaint._id
    );

    // ========================================
    // RESPONSE
    // ========================================

    res.status(201).json({

      success: true,

      message:
        "Complaint submitted successfully",

      complaint
    });

  } catch (error) {

    console.error(
      "Complaint Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message
    });
  }
});

// ========================================
// UPDATE COMPLAINT STATUS
// ========================================

router.put("/:id/status", async (req, res) => {

  try {

    const { status } =
      req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved"
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid status"
      });
    }

    const complaint =
      await Complaint.findByIdAndUpdate(

        req.params.id,

        { status },

        { new: true }
      );

    if (!complaint) {

      return res.status(404).json({

        success: false,

        message:
          "Complaint not found"
      });
    }

    res.json({

      success: true,

      message:
        "Complaint status updated",

      complaint
    });

  } catch (error) {

    console.error(
      "Status Update Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to update status"
    });
  }
});

module.exports = router;