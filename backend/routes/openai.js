const express = require("express");
const OpenAI = require("openai");

require("dotenv").config();

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ========================================
// OPENAI TEST
// ========================================

router.get("/test", async (req, res) => {
  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input:
        "Give a one sentence explanation of civic issues."
    });

    res.json({
      success: true,
      message: response.output_text
    });

  } catch (error) {
    console.error(
      "OpenAI Test Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "OpenAI test failed",
      error: error.message
    });
  }
});

module.exports = router;