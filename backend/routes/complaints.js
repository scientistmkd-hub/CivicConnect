const express = require("express");
const mongoose = require("mongoose");

const Complaint = require("../models/Complaint");
const User = require("../models/User");

const { analyzeWithMultiAI } = require("../services/multiAI");
const { sendGovernmentReport } = require("../services/governmentReport");

const router = express.Router();


// ============================================================
// GET ALL COMPLAINTS
// ============================================================

router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("userId", "name email isBlocked role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error("Get complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints.",
    });
  }
});


// ============================================================
// GET COMPLAINTS OF ONE USER
// ============================================================

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const complaints = await Complaint.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error("Get user complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user complaints.",
    });
  }
});


// ============================================================
// CREATE NEW COMPLAINT
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      userId,
      category,
      description,
      imageUrl,
      lat,
      lng,
    } = req.body;


    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Complaint category is required.",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Complaint description is required.",
      });
    }


    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }


    // ========================================================
    // BLOCKED USER PROTECTION
    // ========================================================
    // If admin has blocked this user, the backend itself
    // prevents the user from creating new complaints.
    // ========================================================

    if (user.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. You cannot submit complaints.",
      });
    }


    // ========================================================
    // PREPARE COMPLAINT DATA
    // ========================================================

    const complaintDescription = description.trim();
    const complaintCategory = category.trim();

    let latitude = null;
    let longitude = null;

    if (
      lat !== undefined &&
      lat !== null &&
      lat !== ""
    ) {
      const parsedLat = Number(lat);

      if (Number.isFinite(parsedLat)) {
        latitude = parsedLat;
      }
    }

    if (
      lng !== undefined &&
      lng !== null &&
      lng !== ""
    ) {
      const parsedLng = Number(lng);

      if (Number.isFinite(parsedLng)) {
        longitude = parsedLng;
      }
    }


    // ========================================================
    // MULTI-AI ANALYSIS
    // ========================================================
    // Providers:
    // 1. Gemini
    // 2. OpenAI
    // 3. Z AI
    // 4. OpenRouter
    // 5. Claude
    //
    // The Multi-AI service handles provider availability/errors.
    // Complaint submission should continue even if one provider
    // is temporarily unavailable.
    // ========================================================

    let aiResult = null;

    try {
      aiResult = await analyzeWithMultiAI({
        category: complaintCategory,
        description: complaintDescription,
        imageUrl: imageUrl || "",
        lat: latitude,
        lng: longitude,
      });
    } catch (aiError) {
      console.error(
        "Multi-AI analysis error:",
        aiError
      );

      aiResult = null;
    }


    // ========================================================
    // EXTRACT AI ANALYSIS
    // ========================================================

    let aiAnalysis = "";
    let priority = "Medium";


    if (aiResult) {
      // ------------------------------------------------------
      // Store AI analysis in a safe string format
      // ------------------------------------------------------

      if (typeof aiResult === "string") {
        aiAnalysis = aiResult;
      } else {
        try {
          aiAnalysis = JSON.stringify(
            aiResult,
            null,
            2
          );
        } catch (stringifyError) {
          console.error(
            "AI result stringify error:",
            stringifyError
          );

          aiAnalysis = "";
        }
      }


      // ------------------------------------------------------
      // Priority detection
      // ------------------------------------------------------

      const priorityValues = [
        "Critical",
        "High",
        "Medium",
        "Low",
      ];

      const priorityVotes = [];

      // ======================================================
      // HANDLE COMMON MULTI-AI RESPONSE STRUCTURES
      // ======================================================

      if (
        typeof aiResult === "object" &&
        aiResult !== null
      ) {

        // ----------------------------------------------------
        // Direct priority
        // ----------------------------------------------------

        if (aiResult.priority) {
          const value = String(
            aiResult.priority
          ).trim();

          const matchedPriority =
            priorityValues.find(
              (item) =>
                item.toLowerCase() ===
                value.toLowerCase()
            );

          if (matchedPriority) {
            priorityVotes.push(
              matchedPriority
            );
          }
        }


        // ----------------------------------------------------
        // providers object
        // ----------------------------------------------------

        if (
          aiResult.providers &&
          typeof aiResult.providers === "object"
        ) {
          Object.values(
            aiResult.providers
          ).forEach((providerResult) => {

            if (!providerResult) {
              return;
            }

            if (
              typeof providerResult === "object" &&
              providerResult.priority
            ) {
              const value = String(
                providerResult.priority
              ).trim();

              const matchedPriority =
                priorityValues.find(
                  (item) =>
                    item.toLowerCase() ===
                    value.toLowerCase()
                );

              if (matchedPriority) {
                priorityVotes.push(
                  matchedPriority
                );
              }
            }

            if (
              typeof providerResult === "string"
            ) {
              const lower =
                providerResult.toLowerCase();

              priorityValues.forEach(
                (item) => {
                  if (
                    lower.includes(
                      item.toLowerCase()
                    )
                  ) {
                    priorityVotes.push(item);
                  }
                }
              );
            }
          });
        }


        // ----------------------------------------------------
        // results array
        // ----------------------------------------------------

        if (Array.isArray(aiResult.results)) {
          aiResult.results.forEach(
            (providerResult) => {

              if (!providerResult) {
                return;
              }

              if (
                typeof providerResult === "object" &&
                providerResult.priority
              ) {
                const value = String(
                  providerResult.priority
                ).trim();

                const matchedPriority =
                  priorityValues.find(
                    (item) =>
                      item.toLowerCase() ===
                      value.toLowerCase()
                  );

                if (matchedPriority) {
                  priorityVotes.push(
                    matchedPriority
                  );
                }
              }

              if (
                typeof providerResult === "string"
              ) {
                const lower =
                  providerResult.toLowerCase();

                priorityValues.forEach(
                  (item) => {
                    if (
                      lower.includes(
                        item.toLowerCase()
                      )
                    ) {
                      priorityVotes.push(item);
                    }
                  }
                );
              }
            }
          );
        }
      }


      // ------------------------------------------------------
      // String based priority extraction
      // ------------------------------------------------------

      if (typeof aiAnalysis === "string") {
        const lowerAnalysis =
          aiAnalysis.toLowerCase();

        priorityValues.forEach(
          (item) => {
            if (
              lowerAnalysis.includes(
                `priority: ${item.toLowerCase()}`
              ) ||
              lowerAnalysis.includes(
                `"priority": "${item.toLowerCase()}"`
              )
            ) {
              priorityVotes.push(item);
            }
          }
        );
      }


      // ======================================================
      // MAJORITY VOTE
      // ======================================================

      if (priorityVotes.length > 0) {
        const counts = {
          Critical: 0,
          High: 0,
          Medium: 0,
          Low: 0,
        };

        priorityVotes.forEach((vote) => {
          if (counts[vote] !== undefined) {
            counts[vote] += 1;
          }
        });

        priority = priorityValues.reduce(
          (highest, current) => {
            if (
              counts[current] >
              counts[highest]
            ) {
              return current;
            }

            return highest;
          },
          "Medium"
        );
      }
    }


    // ========================================================
    // SAFETY: ENSURE VALID PRIORITY
    // ========================================================

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
      "Critical",
    ];

    if (
      !allowedPriorities.includes(priority)
    ) {
      priority = "Medium";
    }


    // ========================================================
    // CREATE COMPLAINT
    // ========================================================

    const complaint = new Complaint({
      userId: user._id,

      category: complaintCategory,

      description: complaintDescription,

      imageUrl: imageUrl || "",

      location: {
        lat: latitude,
        lng: longitude,
      },

      status: "Pending",

      priority,

      aiAnalysis,

      reportedToGovernment: false,

      reportedAt: null,
    });


    // ========================================================
    // SAVE COMPLAINT
    // ========================================================

    await complaint.save();


    // ========================================================
    // GOVERNMENT REPORT
    // ========================================================
    // High and Critical complaints are automatically sent
    // through SMTP to GOVERNMENT_EMAIL.
    //
    // This is an email-based demo/fallback for the project.
    // It is NOT a real government API integration.
    // ========================================================

    if (
      priority === "High" ||
      priority === "Critical"
    ) {
      try {
        const governmentResult =
          await sendGovernmentReport(
            complaint
          );

        if (
          governmentResult &&
          governmentResult.success === true
        ) {
          complaint.reportedToGovernment =
            true;

          complaint.reportedAt =
            new Date();

          await complaint.save();

          console.log(
            "Government report sent successfully."
          );

          console.log(
            "Complaint ID:",
            complaint._id.toString()
          );

          console.log(
            "Priority:",
            complaint.priority
          );
        } else {
          console.error(
            "Government report failed:",
            governmentResult?.error ||
              "Unknown error"
          );
        }
      } catch (governmentError) {
        console.error(
          "Government report error:",
          governmentError
        );

        // Important:
        // Complaint is already saved.
        // Government email failure must not delete
        // the user's complaint.
      }
    }


    // ========================================================
    // RETURN SUCCESS
    // ========================================================

    return res.status(201).json({
      success: true,
      message:
        "Complaint submitted successfully.",

      complaint: {
        _id: complaint._id,
        userId: complaint.userId,
        category: complaint.category,
        description: complaint.description,
        imageUrl: complaint.imageUrl,
        location: complaint.location,
        status: complaint.status,
        priority: complaint.priority,
        aiAnalysis: complaint.aiAnalysis,
        reportedToGovernment:
          complaint.reportedToGovernment,
        reportedAt:
          complaint.reportedAt,
        createdAt: complaint.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "Create complaint error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit complaint.",
    });
  }
});


// ============================================================
// UPDATE COMPLAINT STATUS
// ============================================================

router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;


    // ========================================================
    // VALIDATE COMPLAINT ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID.",
      });
    }


    // ========================================================
    // VALIDATE STATUS
    // ========================================================

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
    ];

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid complaint status.",
      });
    }


    // ========================================================
    // FIND COMPLAINT
    // ========================================================

    const complaint =
      await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message:
          "Complaint not found.",
      });
    }


    // ========================================================
    // UPDATE STATUS
    // ========================================================

    complaint.status = status;

    await complaint.save();


    // ========================================================
    // RETURN UPDATED COMPLAINT
    // ========================================================

    return res.json({
      success: true,
      message:
        "Complaint status updated successfully.",

      complaint,
    });

  } catch (error) {
    console.error(
      "Update complaint status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update complaint status.",
    });
  }
});


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;