const express = require("express");
const OpenAI = require("openai");

require("dotenv").config();

const router = express.Router();

// ========================================
// Z AI CONFIGURATION
// ========================================

const client = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4/"
});

// ========================================
// Z AI TEST
// ========================================

router.get("/test", async (req, res) => {
  try {
    const completion =
      await client.chat.completions.create({
        model: "glm-4.5-flash",

        messages: [
          {
            role: "user",
            content:
              "Give a short one sentence explanation of civic issues."
          }
        ],

        max_tokens: 300
      });

    console.log(
      "========================================"
    );

    console.log(
      "Z AI Full Response:"
    );

    console.log(
      JSON.stringify(
        completion,
        null,
        2
      )
    );

    console.log(
      "========================================"
    );

    const message =
      completion.choices?.[0]?.message;

    const response =
      message?.content ||
      message?.reasoning_content ||
      "";

    console.log(
      "Z AI Final Response:",
      response
    );

    res.json({
      success: true,
      message: response
    });

  } catch (error) {

    console.error(
      "Z AI Test Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Z AI test failed",
      error: error.message
    });
  }
});

module.exports = router;