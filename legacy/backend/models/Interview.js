// ==========================================
// INTERVIEW MODEL
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        jobTitle: {
            type: String,
            required: true,
        },
        companyName: {
            type: String,
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        round: {
            type: String,
            default: "Technical Interview",
        },
        date: {
            type: String,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        meetingLink: {
            type: String,
            default: "",
        },
        instructions: {
            type: String,
            default: "Please be ready with a working webcam, microphone, and a copy of your resume.",
        },
        status: {
            type: String,
            enum: ["Scheduled", "Completed", "Cancelled"],
            default: "Scheduled",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Interview", interviewSchema);
