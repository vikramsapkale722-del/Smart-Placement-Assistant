// ==========================================
// SAVED JOB MODEL
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        savedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("SavedJob", savedJobSchema);
