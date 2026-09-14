const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

require("dotenv").config();

const router = express.Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ========================================
// CLAUDE TEST
// ========================================

router.get("/test", async (req, res) => {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content:
            "Give a one sentence explanation of civic issues."
        }
      ]
    });

    const response =
      message.content?.[0]?.text || "";

    res.json({
      success: true,
      message: response
    });

  } catch (error) {
    console.error(
      "Claude Test Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Claude test failed",
      error: error.message
    });
  }
});

module.exports = router;