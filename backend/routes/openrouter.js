const express = require("express");
const OpenAI = require("openai");

require("dotenv").config();

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// TEST OPENROUTER
router.get("/test", async (req, res) => {
  try {
    const completion =
      await client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content:
              "Give a short one sentence explanation of civic issues."
          }
        ],
        max_tokens: 100
      });

    const message =
      completion.choices?.[0]?.message?.content || "";

    console.log(
      "OpenRouter Response:",
      message
    );

    res.json({
      success: true,
      message
    });

  } catch (error) {

    console.error(
      "OpenRouter Test Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "OpenRouter test failed",
      error: error.message
    });
  }
});

module.exports = router;