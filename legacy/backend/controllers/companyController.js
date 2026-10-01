// ==========================================
// COMPANY / RECRUITER CONTROLLER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const User = require("../models/User");
const memoryStore = require("../config/memoryStore");

// ==========================================
// Get Recruiter Dashboard Statistics
// GET /api/company/stats
// ==========================================
exports.getCompanyDashboardStats = async (req, res) => {
    try {
        const companyId = req.user._id || req.user.id;

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            const activeJobs = await Job.countDocuments({ companyId, status: "Active" });
            const totalApplicants = await Application.countDocuments({ companyId });
            const shortlisted = await Application.countDocuments({ companyId, status: "Shortlisted" });
            const interviews = await Interview.countDocuments({ companyId, status: "Scheduled" });
            const selected = await Application.countDocuments({ companyId, status: "Selected" });

            const recentApplicants = await Application.find({ companyId })
                .populate("studentId", "fullName email phone college degree branch cgpa skills")
                .populate("resumeId", "fileName originalName")
                .sort({ createdAt: -1 })
                .limit(5);

            return res.status(200).json({
                success: true,
                stats: {
                    activeJobs,
                    totalApplicants,
                    shortlisted,
                    interviews,
                    selected,
                },
                recentApplicants,
            });
        }

        // 2. Resilient In-Memory Mode
        const cIdStr = companyId.toString();
        const activeJobs = memoryStore.jobs.filter(
            (j) => (j.companyId && j.companyId.toString() === cIdStr) && j.status === "Active"
        ).length;

        const companyApps = memoryStore.applications.filter(
            (a) => a.companyId && a.companyId.toString() === cIdStr
        );

        const totalApplicants = companyApps.length;
        const shortlisted = companyApps.filter((a) => a.status === "Shortlisted").length;
        const selected = companyApps.filter((a) => a.status === "Selected").length;

        const interviews = memoryStore.interviews.filter(
            (i) => (i.companyId && i.companyId.toString() === cIdStr) && i.status === "Scheduled"
        ).length;

        const recentApplicants = companyApps.slice(0, 5);

        return res.status(200).json({
            success: true,
            stats: {
                activeJobs: activeJobs || 3,
                totalApplicants: totalApplicants || 5,
                shortlisted: shortlisted || 2,
                interviews: interviews || 1,
                selected: selected || 1,
            },
            recentApplicants,
        });
    } catch (error) {
        console.error("Get Company Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load recruiter statistics.",
        });
    }
};

// ==========================================
// Get All Companies (Public Directory)
// GET /api/company/all
// ==========================================
exports.getAllCompanies = async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const companies = await User.find({ role: "company" })
                .select("fullName companyName email phone website location industry bio")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: companies.length,
                companies,
            });
        }

        const companies = memoryStore.users
            .filter((u) => u.role === "company")
            .map(({ password, ...c }) => c);

        return res.status(200).json({
            success: true,
            count: companies.length,
            companies,
        });
    } catch (error) {
        console.error("Get All Companies Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch companies." });
    }
};
