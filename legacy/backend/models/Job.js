const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        company: {
            type: String,
            required: true,
            trim: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        location: {
            type: String,
            default: "Remote / Pan India",
        },
        salary: {
            type: String,
            default: "₹4 - ₹12 LPA",
        },
        type: {
            type: String,
            enum: ["Full-Time", "Internship", "Part-Time"],
            default: "Full-Time",
        },
        experience: {
            type: String,
            default: "Fresher / 0-1 Year",
        },
        skills: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            default: "Exciting placement opportunity for fresh graduates.",
        },
        eligibility: {
            type: String,
            default: "B.Tech / B.E / MCA with 60% or 6.0+ CGPA",
        },
        branch: {
            type: String,
            default: "All Engineering & Tech Branches",
        },
        graduationYear: {
            type: String,
            default: "2025 / 2026",
        },
        deadline: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["Active", "Closed"],
            default: "Active",
        },
        applicantsCount: {
            type: Number,
            default: 0,
        },
        applyUrl: {
            type: String,
            default: "#",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Job", jobSchema);

