const mongoose = require("mongoose");
const Job = require("../models/Job");
const memoryStore = require("../config/memoryStore");

// Default initial jobs
const defaultJobs = [
    {
        title: "Associate Software Engineer",
        company: "Infosys",
        location: "Bengaluru / Pune / Remote",
        salary: "₹4.5 - ₹6.5 LPA",
        type: "Full-Time",
        experience: "Fresher (2025/2026 Batch)",
        skills: ["Java", "SQL", "HTML/CSS", "Python"],
        description: "Looking for enthusiastic engineering graduates to join our digital transformation team.",
        eligibility: "B.Tech / B.E (CSE, IT, ECE) with 6.5+ CGPA",
        branch: "Computer / IT / Circuital",
        deadline: "2026-10-30",
        status: "Active",
        applicantsCount: 1,
    },
    {
        title: "Frontend Developer Intern",
        company: "Cognizant",
        location: "Hyderabad / Pune",
        salary: "₹25,000 / month",
        type: "Internship",
        experience: "Fresher",
        skills: ["JavaScript", "React", "HTML5", "CSS3"],
        description: "Join as a frontend intern to build responsive, modern student & enterprise portals.",
        eligibility: "Open to 3rd and 4th year undergraduate students",
        branch: "All Engineering Branches",
        deadline: "2026-10-15",
        status: "Active",
        applicantsCount: 0,
    },
    {
        title: "Full Stack Developer",
        company: "Google India",
        location: "Bengaluru / Hyderabad",
        salary: "₹18 - ₹24 LPA",
        type: "Full-Time",
        experience: "0 - 1 Year",
        skills: ["Node.js", "Express", "MongoDB", "React", "System Design"],
        description: "Build scalable cloud services and microservices for global enterprise clients.",
        eligibility: "B.Tech / M.Tech in CS/IT with strong DSA skills",
        branch: "Computer Science / IT",
        deadline: "2026-11-15",
        status: "Active",
        applicantsCount: 1,
    },
    {
        title: "Data Analyst",
        company: "Accenture",
        location: "Bengaluru / Gurugram",
        salary: "₹5.5 - ₹8 LPA",
        type: "Full-Time",
        experience: "Fresher",
        skills: ["Python", "SQL", "PowerBI", "Excel"],
        description: "Analyze business metrics, build predictive models, and deliver actionable insights.",
        eligibility: "Degree in Engineering, Statistics, or Mathematics",
        branch: "All Branches",
        deadline: "2026-10-25",
        status: "Active",
        applicantsCount: 0,
    },
    {
        title: "Cloud & DevOps Intern",
        company: "Wipro",
        location: "Noida / Remote",
        salary: "₹20,000 / month",
        type: "Internship",
        experience: "Fresher",
        skills: ["Linux", "AWS", "Git", "Docker"],
        description: "Hands-on internship working with CI/CD pipelines, container orchestration, and cloud infrastructure.",
        eligibility: "Knowledge of Linux commands and basic cloud fundamentals",
        branch: "Computer / IT",
        deadline: "2026-10-20",
        status: "Active",
        applicantsCount: 0,
    },
];

// ==========================================
// Get All Jobs (with Search & Filters)
// GET /api/jobs
// ==========================================
exports.getAllJobs = async (req, res) => {
    try {
        const { search, type, location, sort } = req.query;

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            let query = {};

            if (type && type !== "all") {
                query.type = new RegExp(`^${type}$`, "i");
            }

            if (location && location !== "all") {
                query.location = { $regex: location, $options: "i" };
            }

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { company: { $regex: search, $options: "i" } },
                    { skills: { $regex: search, $options: "i" } },
                ];
            }

            let sortOption = { createdAt: -1 };
            if (sort === "salary_high") sortOption = { salary: -1 };
            if (sort === "oldest") sortOption = { createdAt: 1 };

            let jobs = await Job.find(query).sort(sortOption);

            // Auto-seed if empty
            if (jobs.length === 0 && !search && (!type || type === "all")) {
                await Job.insertMany(defaultJobs);
                jobs = await Job.find().sort({ createdAt: -1 });
            }

            return res.status(200).json({
                success: true,
                count: jobs.length,
                jobs,
            });
        }

        // 2. Resilient In-Memory Mode
        let filtered = [...memoryStore.jobs];

        if (type && type !== "all") {
            filtered = filtered.filter((j) => j.type && j.type.toLowerCase() === type.toLowerCase());
        }

        if (location && location !== "all") {
            filtered = filtered.filter((j) => j.location && j.location.toLowerCase().includes(location.toLowerCase()));
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                (j) =>
                    (j.title && j.title.toLowerCase().includes(q)) ||
                    (j.company && j.company.toLowerCase().includes(q)) ||
                    (Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(q)))
            );
        }

        if (sort === "oldest") {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            jobs: filtered,
        });
    } catch (error) {
        console.error("Fetch Jobs Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs.",
        });
    }
};

// ==========================================
// Get Single Job By ID
// GET /api/jobs/:id
// ==========================================
exports.getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;

        if (mongoose.connection.readyState === 1) {
            const job = await Job.findById(jobId);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: "Job not found.",
                });
            }
            return res.status(200).json({
                success: true,
                job,
            });
        }

        const memJob = memoryStore.jobs.find((j) => j._id === jobId || j._id.toString() === jobId.toString());
        if (!memJob) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }

        return res.status(200).json({
            success: true,
            job: memJob,
        });
    } catch (error) {
        console.error("Fetch Job Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching job details.",
        });
    }
};

// ==========================================
// Create New Job
// POST /api/jobs
// ==========================================
exports.createJob = async (req, res) => {
    try {
        const {
            title,
            company,
            location = "Remote / Pan India",
            salary = "Competitive",
            type = "Full-Time",
            experience = "Fresher",
            skills = [],
            description = "",
            eligibility = "Open to all eligible graduates",
            branch = "All Branches",
            deadline = "",
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Job Title is required.",
            });
        }

        const companyName = company || req.user.companyName || req.user.fullName || "Placement Partner";
        const companyId = req.user._id || req.user.id;
        const parsedSkills = Array.isArray(skills)
            ? skills
            : skills
            ? skills.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        // 1. Atlas Database Mode
        if (mongoose.connection.readyState === 1) {
            const job = await Job.create({
                title: title.trim(),
                company: companyName,
                companyId,
                location: location.trim(),
                salary: salary.trim(),
                type,
                experience: experience.trim(),
                skills: parsedSkills,
                description: description.trim(),
                eligibility: eligibility.trim(),
                branch: branch.trim(),
                deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                status: "Active",
            });

            return res.status(201).json({
                success: true,
                message: "Job posted successfully!",
                job,
            });
        }

        // 2. Resilient In-Memory Mode
        const newJob = {
            _id: "job_" + Date.now(),
            title: title.trim(),
            company: companyName,
            companyId,
            location: location.trim(),
            salary: salary.trim(),
            type,
            experience: experience.trim(),
            skills: parsedSkills,
            description: description.trim(),
            eligibility: eligibility.trim(),
            branch: branch.trim(),
            deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "Active",
            applicantsCount: 0,
            createdAt: new Date(),
        };

        memoryStore.jobs.unshift(newJob);

        return res.status(201).json({
            success: true,
            message: "Job posted successfully!",
            job: newJob,
        });
    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to post job.",
        });
    }
};

// ==========================================
// Update Job
// PUT /api/jobs/:id
// ==========================================
exports.updateJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const updateData = { ...req.body };
        const userId = (req.user._id || req.user.id).toString();

        if (updateData.skills && typeof updateData.skills === "string") {
            updateData.skills = updateData.skills.split(",").map((s) => s.trim()).filter(Boolean);
        }

        if (mongoose.connection.readyState === 1) {
            const existingJob = await Job.findById(jobId);
            if (!existingJob) {
                return res.status(404).json({ success: false, message: "Job not found." });
            }

            // Company can only modify their own job; Admin can modify any job
            if (req.user.role === "company" && existingJob.companyId && existingJob.companyId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You do not have permission to update jobs posted by another organization.",
                });
            }

            const job = await Job.findByIdAndUpdate(jobId, { $set: updateData }, { new: true });
            return res.status(200).json({ success: true, message: "Job updated successfully!", job });
        }

        const idx = memoryStore.jobs.findIndex((j) => j._id === jobId || j._id.toString() === jobId.toString());
        if (idx === -1) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        const existingMemJob = memoryStore.jobs[idx];
        if (req.user.role === "company" && existingMemJob.companyId && existingMemJob.companyId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to update jobs posted by another organization.",
            });
        }

        Object.assign(memoryStore.jobs[idx], updateData);
        return res.status(200).json({ success: true, message: "Job updated successfully!", job: memoryStore.jobs[idx] });
    } catch (error) {
        console.error("Update Job Error:", error);
        res.status(500).json({ success: false, message: "Failed to update job." });
    }
};

// ==========================================
// Delete Job
// DELETE /api/jobs/:id
// ==========================================
exports.deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = (req.user._id || req.user.id).toString();

        if (mongoose.connection.readyState === 1) {
            const existingJob = await Job.findById(jobId);
            if (!existingJob) {
                return res.status(404).json({ success: false, message: "Job not found." });
            }

            // Company can only delete their own job; Admin can delete any job
            if (req.user.role === "company" && existingJob.companyId && existingJob.companyId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You do not have permission to delete jobs posted by another organization.",
                });
            }

            await Job.findByIdAndDelete(jobId);
            return res.status(200).json({ success: true, message: "Job deleted successfully!" });
        }

        const idx = memoryStore.jobs.findIndex((j) => j._id === jobId || j._id.toString() === jobId.toString());
        if (idx === -1) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        const existingMemJob = memoryStore.jobs[idx];
        if (req.user.role === "company" && existingMemJob.companyId && existingMemJob.companyId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to delete jobs posted by another organization.",
            });
        }

        memoryStore.jobs.splice(idx, 1);
        return res.status(200).json({ success: true, message: "Job deleted successfully!" });
    } catch (error) {
        console.error("Delete Job Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete job." });
    }
};

// ==========================================
// Get Jobs Posted By Current Company
// GET /api/jobs/company/my-jobs
// ==========================================
exports.getCompanyJobs = async (req, res) => {
    try {
        const companyId = req.user._id || req.user.id;

        if (mongoose.connection.readyState === 1) {
            const jobs = await Job.find({ companyId }).sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                count: jobs.length,
                jobs,
            });
        }

        const jobs = memoryStore.jobs.filter(
            (j) => j.companyId === companyId || (j.companyId && j.companyId.toString() === companyId.toString())
        );

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error("Get Company Jobs Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch company jobs.",
        });
    }
};

