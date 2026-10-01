// ==========================================
// AI CONTROLLER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");
const { generateAIResponse, analyzeSkillsAndMatch } = require("../services/aiService");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const User = require("../models/User");
const memoryStore = require("../config/memoryStore");

// AI Chat Endpoint
// POST /api/ai/chat
exports.chatWithAI = async (req, res) => {
    try {
        const { message, context = "general" } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message for the AI assistant.",
            });
        }

        const aiResult = await generateAIResponse(message, context);

        return res.status(200).json({
            success: true,
            source: aiResult.source,
            reply: aiResult.text,
        });
    } catch (error) {
        console.error("AI Chat Controller Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate AI response.",
        });
    }
};

// Skill & Resume Job Match Analyzer
// POST /api/ai/analyze-match
exports.analyzeResumeMatch = async (req, res) => {
    try {
        const { jobId } = req.body;
        const userId = req.user ? req.user._id || req.user.id : null;

        let studentSkills = [];
        if (req.user && Array.isArray(req.user.skills)) {
            studentSkills = req.user.skills;
        }

        let targetJob = null;
        if (jobId) {
            if (mongoose.connection.readyState === 1) {
                targetJob = await Job.findById(jobId);
            } else {
                targetJob = memoryStore.jobs.find((j) => j._id === jobId || j._id.toString() === jobId.toString());
            }
        }

        const matchResult = analyzeSkillsAndMatch(studentSkills, targetJob);

        return res.status(200).json({
            success: true,
            jobTitle: targetJob ? targetJob.title : "General Placement Profile",
            company: targetJob ? targetJob.company : "Top Tech Recruiters",
            ...matchResult,
        });
    } catch (error) {
        console.error("Analyze Match Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to analyze resume skills match.",
        });
    }
};
