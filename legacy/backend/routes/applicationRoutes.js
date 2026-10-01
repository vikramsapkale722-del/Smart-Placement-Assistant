// ==========================================
// APPLICATION ROUTES
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const express = require("express");
const router = express.Router();
const {
    applyForJob,
    getStudentApplications,
    getCompanyApplicants,
    updateApplicationStatus,
} = require("../controllers/applicationController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Student applies for job
router.post("/apply", protect, authorize("student", "admin"), applyForJob);

// Student gets their applications
router.get("/my-applications", protect, authorize("student", "admin"), getStudentApplications);

// Company gets applicants
router.get("/company/applicants", protect, authorize("company", "admin"), getCompanyApplicants);

// Company / Admin updates application status
router.put("/:id/status", protect, authorize("company", "admin"), updateApplicationStatus);

module.exports = router;
