// ==========================================
// APPLICATION MODEL
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
        },
        status: {
            type: String,
            enum: ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"],
            default: "Applied",
        },
        studentName: {
            type: String,
            default: "",
        },
        studentEmail: {
            type: String,
            default: "",
        },
        studentPhone: {
            type: String,
            default: "",
        },
        jobTitle: {
            type: String,
            default: "",
        },
        companyName: {
            type: String,
            default: "",
        },
        coverLetter: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Application", applicationSchema);
