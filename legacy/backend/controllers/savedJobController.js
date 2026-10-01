// ==========================================
// SAVED JOB CONTROLLER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");
const SavedJob = require("../models/SavedJob");
const Job = require("../models/Job");
const memoryStore = require("../config/memoryStore");

// Toggle Save / Bookmark
// POST /api/saved-jobs/toggle
exports.toggleSaveJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const studentId = req.user._id || req.user.id;

        if (!jobId) {
            return res.status(400).json({ success: false, message: "Job ID is required." });
        }

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            const existing = await SavedJob.findOne({ studentId, jobId });
            if (existing) {
                await SavedJob.findByIdAndDelete(existing._id);
                return res.status(200).json({
                    success: true,
                    saved: false,
                    message: "Job removed from saved jobs.",
                });
            } else {
                await SavedJob.create({ studentId, jobId });
                return res.status(200).json({
                    success: true,
                    saved: true,
                    message: "Job saved successfully!",
                });
            }
        }

        // 2. Resilient In-Memory Mode
        const idx = memoryStore.savedJobs.findIndex(
            (s) =>
                (s.studentId === studentId || s.studentId.toString() === studentId.toString()) &&
                (s.jobId === jobId || s.jobId.toString() === jobId.toString())
        );

        if (idx !== -1) {
            memoryStore.savedJobs.splice(idx, 1);
            return res.status(200).json({
                success: true,
                saved: false,
                message: "Job removed from saved jobs.",
            });
        } else {
            memoryStore.savedJobs.push({
                _id: "save_" + Date.now(),
                studentId,
                jobId,
                savedAt: new Date(),
            });
            return res.status(200).json({
                success: true,
                saved: true,
                message: "Job saved successfully!",
            });
        }
    } catch (error) {
        console.error("Toggle Save Job Error:", error);
        res.status(500).json({ success: false, message: "Failed to toggle saved job." });
    }
};

// Get All Saved Jobs
// GET /api/saved-jobs
exports.getSavedJobs = async (req, res) => {
    try {
        const studentId = req.user._id || req.user.id;

        if (mongoose.connection.readyState === 1) {
            const savedList = await SavedJob.find({ studentId }).populate("jobId").sort({ savedAt: -1 });
            const jobs = savedList.map((item) => item.jobId).filter(Boolean);
            return res.status(200).json({
                success: true,
                count: jobs.length,
                jobs,
            });
        }

        const savedIds = memoryStore.savedJobs
            .filter((s) => s.studentId === studentId || s.studentId.toString() === studentId.toString())
            .map((s) => s.jobId.toString());

        const jobs = memoryStore.jobs.filter((j) => savedIds.includes(j._id.toString()));

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error("Get Saved Jobs Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch saved jobs." });
    }
};
