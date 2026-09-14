const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

const zai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4/"
});

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


// ==========================================
// COMMON PROMPT
// ==========================================

function createPrompt(category, description) {
  return `
You are analyzing a civic complaint.

Selected category:
${category}

Complaint:
${description}

Return ONLY valid JSON.

Use exactly this structure:

{
  "category": "Road Damage",
  "priority": "High",
  "summary": "Short summary",
  "duplicatePossible": true,
  "reason": "Short reason"
}

Allowed categories:
Road Damage
Garbage
Street Light
Water Supply
Drainage
Public Toilet
Traffic
Other

Allowed priorities:
Low
Medium
High
Critical

duplicatePossible must be true or false.

Do not use markdown.
Do not use backticks.
Do not add any explanation outside JSON.
`;
}


// ==========================================
// CLEAN AI RESPONSE
// ==========================================

function cleanAIResponse(text) {

  if (!text) {
    return null;
  }

  let cleaned = text.trim();

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Find JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    return null;
  }

  cleaned = cleaned.substring(
    start,
    end + 1
  );

  try {

    return JSON.parse(cleaned);

  } catch (error) {

    return null;

  }
}


// ==========================================
// MULTI AI ANALYSIS
// ==========================================

async function analyzeWithMultiAI(
  category,
  description
) {

  const prompt =
    createPrompt(
      category,
      description
    );

  const results = {};


  // ==========================================
  // GEMINI
  // ==========================================

  try {

    const model =
      genAI.getGenerativeModel({
        model: "gemini-3.6-flash"
      });

    const result =
      await model.generateContent(prompt);

    const text =
      result.response.text();

    const analysis =
      cleanAIResponse(text);

    results.gemini =
      analysis || {
        raw: text
      };

  } catch (error) {

    console.error(
      "Gemini Error:",
      error.message
    );

    results.gemini = {
      error: "Failed"
    };
  }


  // ==========================================
  // OPENAI
  // ==========================================

  try {

    const result =
      await openai.chat.completions.create({

        model: "gpt-4o-mini",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ],

        max_tokens: 300
      });

    const text =
      result.choices?.[0]?.message?.content || "";

    const analysis =
      cleanAIResponse(text);

    results.openai =
      analysis || {
        raw: text
      };

  } catch (error) {

    console.error(
      "OpenAI Error:",
      error.message
    );

    results.openai = {
      error: "Failed"
    };
  }


  // ==========================================
  // Z AI
  // ==========================================

  try {

    const result =
      await zai.chat.completions.create({

        model: "glm-4.5-flash",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ],

        max_tokens: 500
      });

    const text =
      result.choices?.[0]?.message?.content ||
      result.choices?.[0]?.message?.reasoning_content ||
      "";

    // DEBUG: Show actual Z AI response
    console.log(
      "Z AI RAW RESPONSE:",
      text
    );

    const analysis =
      cleanAIResponse(text);

    results.zai =
      analysis || {
        raw: text
      };

  } catch (error) {

    console.error(
      "Z AI Error:",
      error.message
    );

    results.zai = {
      error: "Failed"
    };
  }


  // ==========================================
  // OPENROUTER
  // ==========================================

  try {

    const result =
      await openrouter.chat.completions.create({

        model: "openai/gpt-4o-mini",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ],

        max_tokens: 300
      });

    const text =
      result.choices?.[0]?.message?.content || "";

    const analysis =
      cleanAIResponse(text);

    results.openrouter =
      analysis || {
        raw: text
      };

  } catch (error) {

    console.error(
      "OpenRouter Error:",
      error.message
    );

    results.openrouter = {
      error: "Failed"
    };
  }


  // ==========================================
  // CLAUDE
  // ==========================================

  // Claude is currently skipped
  // because the account has no credits.

  results.claude = {
    error: "No credits"
  };


  // ==========================================
  // FINAL LOG
  // ==========================================

  console.log(
    "========== MULTI AI RESULTS =========="
  );

  console.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );

  console.log(
    "======================================"
  );


  return results;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  analyzeWithMultiAI
};