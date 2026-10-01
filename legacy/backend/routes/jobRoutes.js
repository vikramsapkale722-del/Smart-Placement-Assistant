const express = require("express");
const router = express.Router();

const {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getCompanyJobs,
} = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllJobs);
router.get("/company/my-jobs", protect, authorize("company", "admin"), getCompanyJobs);
router.get("/:id", getJobById);

// Protected routes (Admin / Company)
router.post("/", protect, authorize("company", "admin"), createJob);
router.put("/:id", protect, authorize("company", "admin"), updateJob);
router.delete("/:id", protect, authorize("company", "admin"), deleteJob);

module.exports = router;

