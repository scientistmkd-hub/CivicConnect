const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// ========================================
// GEMINI TEST
// ========================================

router.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash"
    });

    const result = await model.generateContent(
      "Give a one sentence explanation of civic issues."
    );

    const response = result.response.text();

    res.json({
      success: true,
      message: response
    });

  } catch (error) {
    console.error(
      "Gemini Test Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gemini test failed",
      error: error.message
    });
  }
});

// ========================================
// GEMINI TEXT TEST
// ========================================

router.post("/test", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required"
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash"
    });

    const result = await model.generateContent(
      `Analyze this civic issue and give a short response:

${text}`
    );

    const response = result.response.text();

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error(
      "Gemini Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gemini AI failed",
      error: error.message
    });
  }
});

// ========================================
// CIVIC COMPLAINT ANALYSIS
// ========================================

router.post("/analyze", async (req, res) => {
  try {
    const {
      category,
      description
    } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Complaint description is required"
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash"
    });

    const prompt = `
You are an AI assistant for a civic complaint reporting system.

Analyze the following civic complaint.

User selected category:
${category || "Not provided"}

Complaint description:
${description}

Return ONLY valid JSON in this exact structure:

{
  "category": "Road Damage",
  "priority": "Low",
  "summary": "Short summary of the complaint",
  "duplicatePossible": false,
  "reason": "Short reason for the priority"
}

Rules:

1. category must be one of:
Road Damage
Garbage
Street Light
Water Supply
Drainage
Public Toilet
Traffic
Other

2. priority must be one of:
Low
Medium
High
Critical

3. duplicatePossible must be true or false.

4. summary must be short and clear.

5. reason must briefly explain why the priority was selected.

Do not include markdown.
Do not include code fences.
Return only JSON.
`;

    const result = await model.generateContent(prompt);

    const responseText = result.response.text().trim();

    let analysis;

    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "Gemini JSON Parse Error:",
        responseText
      );

      return res.status(500).json({
        success: false,
        message: "Gemini returned invalid JSON",
        rawResponse: responseText
      });
    }

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error(
      "Gemini Complaint Analysis Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to analyze complaint",
      error: error.message
    });
  }
});

module.exports = router;