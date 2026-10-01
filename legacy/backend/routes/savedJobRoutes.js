// ==========================================
// SAVED JOBS ROUTES
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const express = require("express");
const router = express.Router();
const { toggleSaveJob, getSavedJobs } = require("../controllers/savedJobController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/toggle", protect, authorize("student", "admin"), toggleSaveJob);
router.get("/", protect, authorize("student", "admin"), getSavedJobs);

module.exports = router;
