const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const complaintRoutes = require("./routes/complaints");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const aiRoutes = require("./routes/ai");
const openaiRoutes = require("./routes/openai");
const claudeRoutes = require("./routes/claude");
const zaiRoutes = require("./routes/zai");
const openrouterRoutes = require("./routes/openrouter");
const uploadRoutes = require("./routes/upload");

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/claude", claudeRoutes);
app.use("/api/zai", zaiRoutes);
app.use("/api/openrouter", openrouterRoutes);
app.use("/api/upload", uploadRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server test working"
  });
});

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Civic Connect Backend is running!"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working"
  });
});

// Port
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });

// Start server
app.listen(PORT, () => {
  console.log(
    `Civic Connect server running on http://localhost:${PORT}`
  );
});