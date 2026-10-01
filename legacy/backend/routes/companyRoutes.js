// ==========================================
// COMPANY ROUTES
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const express = require("express");
const router = express.Router();
const { getCompanyDashboardStats, getAllCompanies } = require("../controllers/companyController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/stats", protect, authorize("company", "admin"), getCompanyDashboardStats);
router.get("/all", getAllCompanies);

module.exports = router;
