// ==========================================
// APPLICATION CONTROLLER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const Notification = require("../models/Notification");
const memoryStore = require("../config/memoryStore");

// ==========================================
// Apply for Job
// POST /api/applications/apply
// ==========================================
exports.applyForJob = async (req, res) => {
    try {
        const { jobId, coverLetter = "" } = req.body;
        const studentId = req.user._id || req.user.id;

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required to apply.",
            });
        }

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            // Check if job exists
            const job = await Job.findById(jobId);
            if (!job) {
                return res.status(404).json({ success: false, message: "Job not found." });
            }

            // Check if already applied
            const existing = await Application.findOne({ jobId, studentId });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "You have already applied for this position.",
                });
            }

            // Check resume
            const resume = await Resume.findOne({ userId: studentId });

            const application = await Application.create({
                jobId,
                studentId,
                companyId: job.companyId,
                resumeId: resume ? resume._id : null,
                studentName: req.user.fullName,
                studentEmail: req.user.email,
                studentPhone: req.user.phone || "",
                jobTitle: job.title,
                companyName: job.company,
                coverLetter,
                status: "Applied",
            });

            // Increment job applicant count
            await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

            // Notify company if companyId exists
            if (job.companyId) {
                await Notification.create({
                    recipientId: job.companyId,
                    role: "company",
                    title: "New Job Applicant 📥",
                    message: `${req.user.fullName} has applied for "${job.title}".`,
                    type: "application",
                    link: "company-dashboard.html",
                });
            }

            return res.status(201).json({
                success: true,
                message: `Application submitted successfully for ${job.title} at ${job.company}!`,
                application,
            });
        }

        // 2. Resilient In-Memory Mode
        const memJob = memoryStore.jobs.find((j) => j._id === jobId || j._id.toString() === jobId.toString());
        if (!memJob) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        const existingMem = memoryStore.applications.find(
            (a) =>
                (a.jobId === jobId || a.jobId.toString() === jobId.toString()) &&
                (a.studentId === studentId || a.studentId.toString() === studentId.toString())
        );
        if (existingMem) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this position.",
            });
        }

        const memResume = memoryStore.resumes.find(
            (r) => r.userId === studentId || (r.userId && r.userId.toString() === studentId.toString())
        );

        const newApp = {
            _id: "app_" + Date.now(),
            jobId,
            studentId,
            companyId: memJob.companyId,
            resumeId: memResume ? memResume._id : null,
            studentName: req.user.fullName,
            studentEmail: req.user.email,
            studentPhone: req.user.phone || "",
            jobTitle: memJob.title,
            companyName: memJob.company,
            coverLetter,
            status: "Applied",
            notes: "",
            appliedAt: new Date(),
        };

        memoryStore.applications.unshift(newApp);
        memJob.applicantsCount = (memJob.applicantsCount || 0) + 1;

        // Notification in memory
        memoryStore.notifications.unshift({
            _id: "notif_" + Date.now(),
            recipientId: memJob.companyId || "admin_001",
            role: "company",
            title: "New Job Applicant 📥",
            message: `${req.user.fullName} has applied for "${memJob.title}".`,
            type: "application",
            isRead: false,
            createdAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: `Application submitted successfully for ${memJob.title} at ${memJob.company}!`,
            application: newApp,
        });
    } catch (error) {
        console.error("Apply Job Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to submit application.",
        });
    }
};

// ==========================================
// Get Logged In Student's Applications
// GET /api/applications/my-applications
// ==========================================
exports.getStudentApplications = async (req, res) => {
    try {
        const studentId = req.user._id || req.user.id;

        if (mongoose.connection.readyState === 1) {
            const applications = await Application.find({ studentId })
                .populate("jobId")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: applications.length,
                applications,
            });
        }

        const apps = memoryStore.applications.filter(
            (a) => a.studentId === studentId || (a.studentId && a.studentId.toString() === studentId.toString())
        );

        return res.status(200).json({
            success: true,
            count: apps.length,
            applications: apps,
        });
    } catch (error) {
        console.error("Get Student Applications Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student applications.",
        });
    }
};

// ==========================================
// Get Company / Recruiter Applicants
// GET /api/applications/company/applicants
// ==========================================
exports.getCompanyApplicants = async (req, res) => {
    try {
        const companyId = req.user._id || req.user.id;
        const isAdmin = req.user.role === "admin";

        if (mongoose.connection.readyState === 1) {
            const filter = isAdmin ? {} : { companyId };
            const applications = await Application.find(filter)
                .populate("studentId", "-password")
                .populate("resumeId")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: applications.length,
                applications,
            });
        }

        let apps = [...memoryStore.applications];
        if (!isAdmin) {
            apps = apps.filter(
                (a) => a.companyId === companyId || (a.companyId && a.companyId.toString() === companyId.toString())
            );
        }

        return res.status(200).json({
            success: true,
            count: apps.length,
            applications: apps,
        });
    } catch (error) {
        console.error("Get Company Applicants Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch applicants.",
        });
    }
};

// ==========================================
// Update Application Status
// PUT /api/applications/:id/status
// ==========================================
exports.updateApplicationStatus = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status, notes = "" } = req.body;

        const validStatuses = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            const app = await Application.findById(applicationId);
            if (!app) {
                return res.status(404).json({ success: false, message: "Application not found." });
            }

            app.status = status;
            if (notes) app.notes = notes;
            await app.save();

            // Notify student
            await Notification.create({
                recipientId: app.studentId,
                role: "student",
                title: `Application Status: ${status} 📋`,
                message: `Your application for "${app.jobTitle}" at ${app.companyName} has been updated to "${status}".`,
                type: "status_change",
                link: "applications.html",
            });

            return res.status(200).json({
                success: true,
                message: `Application status updated to ${status}!`,
                application: app,
            });
        }

        // 2. Resilient In-Memory Mode
        const app = memoryStore.applications.find(
            (a) => a._id === applicationId || a._id.toString() === applicationId.toString()
        );
        if (!app) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        app.status = status;
        if (notes) app.notes = notes;

        memoryStore.notifications.unshift({
            _id: "notif_" + Date.now(),
            recipientId: app.studentId,
            role: "student",
            title: `Application Status: ${status} 📋`,
            message: `Your application for "${app.jobTitle}" at ${app.companyName} has been updated to "${status}".`,
            type: "status_change",
            isRead: false,
            createdAt: new Date(),
        });

        return res.status(200).json({
            success: true,
            message: `Application status updated to ${status}!`,
            application: app,
        });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update application status.",
        });
    }
};
