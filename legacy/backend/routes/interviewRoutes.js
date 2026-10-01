// ==========================================
// INTERVIEW ROUTES
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const express = require("express");
const router = express.Router();
const {
    scheduleInterview,
    getStudentInterviews,
    getCompanyInterviews,
} = require("../controllers/interviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Company / Admin schedules interview
router.post("/schedule", protect, authorize("company", "admin"), scheduleInterview);

// Student gets their interviews
router.get("/student", protect, authorize("student", "admin"), getStudentInterviews);

// Company gets interviews they scheduled
router.get("/company", protect, authorize("company", "admin"), getCompanyInterviews);

module.exports = router;
