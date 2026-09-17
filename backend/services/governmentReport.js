const nodemailer = require("nodemailer");

require("dotenv").config();

// ========================================
// GMAIL SMTP TRANSPORTER
// ========================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ========================================
// SEND GOVERNMENT / AUTHORITY REPORT
// ========================================

async function sendGovernmentReport(complaint) {
  try {

    // ========================================
    // GOVERNMENT EMAIL
    // ========================================

    const governmentEmail =
      process.env.GOVERNMENT_EMAIL;

    if (!governmentEmail) {

      throw new Error(
        "GOVERNMENT_EMAIL is not configured"
      );

    }

    // ========================================
    // LOCATION
    // ========================================

    const hasLocation =
      complaint.location &&
      complaint.location.lat !== null &&
      complaint.location.lat !== undefined &&
      complaint.location.lng !== null &&
      complaint.location.lng !== undefined;

    const locationText =
      hasLocation
        ? `${complaint.location.lat}, ${complaint.location.lng}`
        : "Location not available";

    const mapsLink =
      hasLocation
        ? `https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}`
        : "";

    // ========================================
    // AI ANALYSIS
    // ========================================

    let aiData = {};

    try {

      if (complaint.aiAnalysis) {

        aiData =
          typeof complaint.aiAnalysis === "string"
            ? JSON.parse(complaint.aiAnalysis)
            : complaint.aiAnalysis;

      }

    } catch (error) {

      console.log(
        "AI analysis JSON parse warning:",
        error.message
      );

    }

    // ========================================
    // GET AI SUMMARY
    // ========================================

    const summaries = [];

    Object.values(aiData || {}).forEach(
      (result) => {

        if (
          result &&
          typeof result === "object" &&
          result.summary
        ) {

          summaries.push(
            result.summary
          );

        }

      }
    );

    const aiSummary =
      summaries.length > 0
        ? summaries[0]
        : "AI summary is not available.";

    // ========================================
    // SUGGESTED SOLUTION
    // ========================================

    let suggestedSolution =
      "Please inspect the reported issue and take the necessary corrective action.";

    const category =
      (complaint.category || "").toLowerCase();

    if (
      category.includes("road") ||
      category.includes("pothole")
    ) {

      suggestedSolution =
        "Inspect the damaged road section, place temporary safety measures if required, and repair or resurface the affected area.";

    } else if (
      category.includes("garbage") ||
      category.includes("waste")
    ) {

      suggestedSolution =
        "Arrange removal of the accumulated waste, clean the affected area, and ensure regular waste collection.";

    } else if (
      category.includes("drain") ||
      category.includes("drainage")
    ) {

      suggestedSolution =
        "Inspect the drainage system, remove blockage or accumulated waste, and restore proper water flow.";

    } else if (
      category.includes("streetlight") ||
      category.includes("street light")
    ) {

      suggestedSolution =
        "Inspect the streetlight and electrical connection, and repair or replace the faulty equipment.";

    } else if (
      category.includes("water")
    ) {

      suggestedSolution =
        "Inspect the reported water-related issue and take the necessary repair or maintenance action.";

    }

    // ========================================
    // REPORT DATE
    // ========================================

    const reportDate =
      complaint.createdAt
        ? new Date(
            complaint.createdAt
          ).toLocaleString("en-IN")
        : new Date().toLocaleString("en-IN");

    // ========================================
    // EMAIL SUBJECT
    // ========================================

    const subject =
      `Civic Connect - Urgent Civic Issue Report [${complaint.priority}]`;

    // ========================================
    // PLAIN TEXT EMAIL
    // ========================================

    const text = `
To,
The Concerned Government / Local Authority

Subject: Civic Issue Report - Immediate Attention Requested

Dear Sir/Madam,

Civic Connect has received a civic issue report from a citizen.

The issue has been analyzed by the system and is being forwarded
for necessary attention.

==================================================
COMPLAINT DETAILS
==================================================

Complaint ID:
${complaint._id}

Category:
${complaint.category}

Priority:
${complaint.priority}

Date Reported:
${reportDate}

Problem Description:
${complaint.description}

==================================================
AI ANALYSIS
==================================================

AI Summary:
${aiSummary}

==================================================
SUGGESTED SOLUTION
==================================================

${suggestedSolution}

==================================================
LOCATION
==================================================

Coordinates:
${locationText}

Google Maps:
${mapsLink || "Location link not available"}

==================================================
REQUESTED ACTION
==================================================

Please inspect the reported location and take the
necessary action according to the priority of the issue.

This report was generated automatically by Civic Connect.

Regards,

Civic Connect
Crowdsourced Civic Issue Reporting System
`;

    // ========================================
    // HTML EMAIL - A4 LETTER STYLE
    // ========================================

    const html = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <style>

    body {
      font-family: Arial, sans-serif;
      background: #f5f7fa;
      margin: 0;
      padding: 30px;
      color: #222;
    }

    .letter {
      max-width: 800px;
      margin: auto;
      background: #ffffff;
      padding: 40px;
      border: 1px solid #ddd;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
    }

    .header p {
      margin: 6px 0 0;
      color: #666;
    }

    .section {
      margin-top: 25px;
    }

    .section-title {
      font-size: 16px;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }

    .row {
      margin: 9px 0;
      line-height: 1.5;
    }

    .label {
      font-weight: bold;
    }

    .description {
      background: #f8f8f8;
      padding: 15px;
      border-left: 4px solid #555;
      margin-top: 10px;
      line-height: 1.6;
    }

    .priority {
      font-weight: bold;
      font-size: 18px;
    }

    .solution {
      background: #f5f5f5;
      padding: 15px;
      margin-top: 10px;
      line-height: 1.6;
    }

    .footer {
      border-top: 1px solid #ccc;
      margin-top: 30px;
      padding-top: 15px;
      color: #666;
      font-size: 13px;
      line-height: 1.5;
    }

    a {
      color: #1769aa;
      text-decoration: none;
    }

  </style>

</head>

<body>

  <div class="letter">

    <div class="header">

      <h1>CIVIC CONNECT</h1>

      <p>
        Crowdsourced Civic Issue Reporting System
      </p>

    </div>

    <p>

      To,<br>

      <strong>
        The Concerned Government / Local Authority
      </strong>

    </p>

    <p>

      <strong>Subject:</strong>
      Civic Issue Report - Immediate Attention Requested

    </p>

    <p>
      Dear Sir/Madam,
    </p>

    <p>

      Civic Connect has received a civic issue report
      from a citizen. The issue has been analyzed by
      the system and is being forwarded for necessary
      attention.

    </p>

    <!-- COMPLAINT DETAILS -->

    <div class="section">

      <div class="section-title">
        COMPLAINT DETAILS
      </div>

      <div class="row">

        <span class="label">
          Complaint ID:
        </span>

        ${complaint._id}

      </div>

      <div class="row">

        <span class="label">
          Category:
        </span>

        ${complaint.category}

      </div>

      <div class="row">

        <span class="label">
          Priority:
        </span>

        <span class="priority">
          ${complaint.priority}
        </span>

      </div>

      <div class="row">

        <span class="label">
          Date Reported:
        </span>

        ${reportDate}

      </div>

      <div class="row">

        <span class="label">
          Problem Description:
        </span>

        <div class="description">

          ${complaint.description}

        </div>

      </div>

    </div>

    <!-- AI ANALYSIS -->

    <div class="section">

      <div class="section-title">
        AI ANALYSIS
      </div>

      <div class="row">

        <span class="label">
          AI Summary:
        </span>

        <div class="description">

          ${aiSummary}

        </div>

      </div>

    </div>

    <!-- SUGGESTED SOLUTION -->

    <div class="section">

      <div class="section-title">
        SUGGESTED SOLUTION
      </div>

      <div class="solution">

        ${suggestedSolution}

      </div>

    </div>

    <!-- LOCATION -->

    <div class="section">

      <div class="section-title">
        LOCATION
      </div>

      <div class="row">

        <span class="label">
          Coordinates:
        </span>

        ${locationText}

      </div>

      ${
        mapsLink
          ? `
            <div class="row">

              <span class="label">
                Google Maps:
              </span>

              <a
                href="${mapsLink}"
                target="_blank"
              >
                View Complaint Location
              </a>

            </div>
          `
          : ""
      }

    </div>

    <!-- REQUESTED ACTION -->

    <div class="section">

      <p>
        <strong>
          Requested Action:
        </strong>
      </p>

      <p>

        Please inspect the reported location and
        take the necessary action according to
        the priority of the issue.

      </p>

    </div>

    <!-- FOOTER -->

    <div class="footer">

      <p>
        This report was generated automatically
        by Civic Connect.
      </p>

      <p>

        Regards,<br>

        <strong>
          Civic Connect
        </strong><br>

        Crowdsourced Civic Issue Reporting System

      </p>

    </div>

  </div>

</body>

</html>
`;

    // ========================================
    // SEND EMAIL
    // ========================================

    const info =
      await transporter.sendMail({

        from:
          `"Civic Connect" <${process.env.EMAIL_USER}>`,

        to:
          governmentEmail,

        subject,

        text,

        html

      });

    console.log(
      "Government report email sent:",
      info.messageId
    );

    // ========================================
    // SUCCESS
    // ========================================

    return {

      success: true,

      messageId:
        info.messageId

    };

  } catch (error) {

    console.error(
      "Government Report Email Error:",
      error
    );

    return {

      success: false,

      error:
        error.message

    };

  }
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  sendGovernmentReport
};