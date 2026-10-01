// ==========================================
// AI ROUTES
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const express = require("express");
const router = express.Router();
const { chatWithAI, analyzeResumeMatch } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// Public / student chat
router.post("/chat", chatWithAI);

// Protected resume & job match analysis
router.post("/analyze-match", protect, analyzeResumeMatch);

module.exports = router;
