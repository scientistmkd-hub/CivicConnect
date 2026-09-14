const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Get Users Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});


// BLOCK / UNBLOCK USER
router.put("/:id/block", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isBlocked = !user.isBlocked;

    await user.save();

    res.json({
      success: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      user
    });

  } catch (error) {
    console.error("Block User Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
});

module.exports = router;