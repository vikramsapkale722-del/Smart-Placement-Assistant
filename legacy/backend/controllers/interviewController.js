// ==========================================
// INTERVIEW CONTROLLER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const memoryStore = require("../config/memoryStore");

// Schedule New Interview
// POST /api/interviews/schedule
exports.scheduleInterview = async (req, res) => {
    try {
        const {
            applicationId,
            studentId,
            jobId,
            jobTitle,
            companyName,
            studentName,
            round = "Technical Interview Round",
            date,
            time,
            meetingLink = "https://meet.google.com/placement-assistant",
            instructions = "Please join 5 minutes early with your camera enabled and resume ready.",
        } = req.body;

        const companyId = req.user._id || req.user.id;

        if (!studentId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Student, Date, and Time are required to schedule an interview.",
            });
        }

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            const interview = await Interview.create({
                applicationId,
                studentId,
                companyId,
                jobId,
                jobTitle: jobTitle || "Placement Opportunity",
                companyName: companyName || req.user.companyName || req.user.fullName,
                studentName: studentName || "Candidate",
                round,
                date,
                time,
                meetingLink,
                instructions,
                status: "Scheduled",
            });

            // Update application status to "Interview" if applicationId is provided
            if (applicationId) {
                await Application.findByIdAndUpdate(applicationId, { status: "Interview" });
            }

            // Notify Student
            await Notification.create({
                recipientId: studentId,
                role: "student",
                title: "Interview Scheduled! 📅",
                message: `${companyName || "Recruiter"} scheduled ${round} on ${date} at ${time}.`,
                type: "interview",
                link: "dashboard.html",
            });

            return res.status(201).json({
                success: true,
                message: "Interview scheduled and candidate notified!",
                interview,
            });
        }

        // 2. Resilient In-Memory Mode
        const newInterview = {
            _id: "int_" + Date.now(),
            applicationId,
            studentId,
            companyId,
            jobId,
            jobTitle: jobTitle || "Placement Opportunity",
            companyName: companyName || req.user.companyName || req.user.fullName,
            studentName: studentName || "Candidate",
            round,
            date,
            time,
            meetingLink,
            instructions,
            status: "Scheduled",
            createdAt: new Date(),
        };

        memoryStore.interviews.unshift(newInterview);

        if (applicationId) {
            const app = memoryStore.applications.find(
                (a) => a._id === applicationId || a._id.toString() === applicationId.toString()
            );
            if (app) app.status = "Interview";
        }

        memoryStore.notifications.unshift({
            _id: "notif_" + Date.now(),
            recipientId: studentId,
            role: "student",
            title: "Interview Scheduled! 📅",
            message: `${companyName || "Recruiter"} scheduled ${round} on ${date} at ${time}.`,
            type: "interview",
            isRead: false,
            createdAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: "Interview scheduled and candidate notified!",
            interview: newInterview,
        });
    } catch (error) {
        console.error("Schedule Interview Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to schedule interview.",
        });
    }
};

// Get Logged In Student's Interviews
// GET /api/interviews/student
exports.getStudentInterviews = async (req, res) => {
    try {
        const studentId = req.user._id || req.user.id;

        if (mongoose.connection.readyState === 1) {
            const interviews = await Interview.find({ studentId }).sort({ date: 1 });
            return res.status(200).json({ success: true, count: interviews.length, interviews });
        }

        const interviews = memoryStore.interviews.filter(
            (i) => i.studentId === studentId || (i.studentId && i.studentId.toString() === studentId.toString())
        );

        return res.status(200).json({ success: true, count: interviews.length, interviews });
    } catch (error) {
        console.error("Get Student Interviews Error:", error);
        res.status(500).json({ success: false, message: "Failed to load student interviews." });
    }
};

// Get Logged In Company's Interviews
// GET /api/interviews/company
exports.getCompanyInterviews = async (req, res) => {
    try {
        const companyId = req.user._id || req.user.id;
        const isAdmin = req.user.role === "admin";

        if (mongoose.connection.readyState === 1) {
            const filter = isAdmin ? {} : { companyId };
            const interviews = await Interview.find(filter).sort({ date: 1 });
            return res.status(200).json({ success: true, count: interviews.length, interviews });
        }

        let interviews = [...memoryStore.interviews];
        if (!isAdmin) {
            interviews = interviews.filter(
                (i) => i.companyId === companyId || (i.companyId && i.companyId.toString() === companyId.toString())
            );
        }

        return res.status(200).json({ success: true, count: interviews.length, interviews });
    } catch (error) {
        console.error("Get Company Interviews Error:", error);
        res.status(500).json({ success: false, message: "Failed to load company interviews." });
    }
};
