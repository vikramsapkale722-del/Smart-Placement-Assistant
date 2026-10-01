// ==========================================
// ADMIN / PLACEMENT CELL ROUTES
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const express = require("express");
const router = express.Router();
const { getAdminOverview, getAllStudents } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/overview", protect, authorize("admin"), getAdminOverview);
router.get("/students", protect, authorize("admin"), getAllStudents);

module.exports = router;
