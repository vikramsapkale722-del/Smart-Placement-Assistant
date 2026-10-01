// ==========================================
// RESILIENT IN-MEMORY STORAGE ENGINE
// Smart Placement Assistant
// Activated when MongoDB Atlas is offline / IP not whitelisted
// ==========================================

const bcrypt = require("bcryptjs");

class MemoryStore {
    constructor() {
        this.users = [];
        this.resumes = [];
        this.jobs = [];
        this.applications = [];
        this.savedJobs = [];
        this.notifications = [];
        this.interviews = [];

        this.seedInitialData();
    }

    async seedInitialData() {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const studentPassword = await bcrypt.hash("student123", 10);
        const companyPassword = await bcrypt.hash("company123", 10);

        // Seed Default Admin
        const adminId = "admin_001";
        this.users.push({
            _id: adminId,
            fullName: "Placement Officer (Admin)",
            email: "admin@placement.edu",
            password: hashedPassword,
            role: "admin",
            phone: "+91 98765 43210",
            createdAt: new Date(),
        });

        // Seed Sample Company
        const companyId = "company_001";
        this.users.push({
            _id: companyId,
            fullName: "Google India Recruiter",
            email: "recruiter@google.com",
            password: companyPassword,
            role: "company",
            companyName: "Google India",
            website: "https://careers.google.com",
            location: "Bengaluru / Hyderabad",
            industry: "Technology / Software",
            phone: "+91 80 6721 0000",
            bio: "Google's mission is to organize the world's information and make it universally accessible and useful.",
            createdAt: new Date(),
        });

        // Seed Sample Student
        const studentId = "student_001";
        this.users.push({
            _id: studentId,
            fullName: "Vedant Patil",
            email: "vedant@student.edu",
            password: studentPassword,
            role: "student",
            phone: "+91 91234 56789",
            college: "Government College of Engineering",
            degree: "B.Tech",
            branch: "Computer Engineering",
            graduationYear: "2026",
            cgpa: "8.9",
            skills: ["JavaScript", "Node.js", "Express", "MongoDB", "Python", "Data Structures"],
            projects: "Smart Placement Assistant, AI Portfolio, E-Commerce Platform",
            certifications: "AWS Cloud Practitioner, Full Stack Web Development",
            experience: "Frontend Developer Intern at TechCorp (3 months)",
            github: "https://github.com/vedantpatil",
            linkedin: "https://linkedin.com/in/vedantpatil",
            createdAt: new Date(),
        });

        // Seed Sample Jobs
        this.jobs = [
            {
                _id: "job_001",
                title: "Associate Software Engineer",
                company: "Infosys",
                companyId: "company_001",
                location: "Bengaluru / Pune / Remote",
                salary: "₹4.5 - ₹6.5 LPA",
                type: "Full-Time",
                experience: "Fresher (2025/2026 Batch)",
                skills: ["Java", "SQL", "HTML/CSS", "Python"],
                description: "Looking for enthusiastic engineering graduates to join our digital transformation team. You will work on enterprise cloud applications.",
                eligibility: "B.Tech / B.E (CSE, IT, ECE) with 6.5+ CGPA",
                branch: "Computer / IT / Circuital",
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                status: "Active",
                applicantsCount: 1,
                createdAt: new Date(),
            },
            {
                _id: "job_002",
                title: "Frontend Developer Intern",
                company: "Cognizant",
                companyId: "company_001",
                location: "Hyderabad / Pune",
                salary: "₹25,000 / month",
                type: "Internship",
                experience: "Fresher",
                skills: ["JavaScript", "React", "HTML5", "CSS3"],
                description: "Join as a frontend intern to build responsive, modern student & enterprise portals.",
                eligibility: "Open to 3rd and 4th year undergraduate students",
                branch: "All Engineering Branches",
                deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                status: "Active",
                applicantsCount: 0,
                createdAt: new Date(),
            },
            {
                _id: "job_003",
                title: "Full Stack Developer",
                company: "Google India",
                companyId: companyId,
                location: "Bengaluru / Hyderabad",
                salary: "₹18 - ₹24 LPA",
                type: "Full-Time",
                experience: "0 - 1 Year",
                skills: ["Node.js", "Express", "MongoDB", "React", "System Design"],
                description: "Build scalable cloud services and microservices for global platforms.",
                eligibility: "B.Tech / M.Tech in CS/IT with strong DSA skills",
                branch: "Computer Science / IT",
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                status: "Active",
                applicantsCount: 1,
                createdAt: new Date(),
            },
            {
                _id: "job_004",
                title: "Data Analyst",
                company: "Accenture",
                companyId: "company_001",
                location: "Bengaluru / Gurugram",
                salary: "₹5.5 - ₹8 LPA",
                type: "Full-Time",
                experience: "Fresher",
                skills: ["Python", "SQL", "PowerBI", "Excel"],
                description: "Analyze business metrics, build predictive models, and deliver actionable insights.",
                eligibility: "Degree in Engineering, Statistics, or Mathematics",
                branch: "All Branches",
                deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                status: "Active",
                applicantsCount: 0,
                createdAt: new Date(),
            },
            {
                _id: "job_005",
                title: "Cloud & DevOps Intern",
                company: "Wipro",
                companyId: "company_001",
                location: "Noida / Remote",
                salary: "₹20,000 / month",
                type: "Internship",
                experience: "Fresher",
                skills: ["Linux", "AWS", "Git", "Docker"],
                description: "Hands-on internship working with CI/CD pipelines, container orchestration, and cloud infrastructure.",
                eligibility: "Knowledge of Linux commands and basic cloud fundamentals",
                branch: "Computer / IT",
                deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                status: "Active",
                applicantsCount: 0,
                createdAt: new Date(),
            }
        ];

        // Seed Sample Application
        this.applications.push({
            _id: "app_001",
            jobId: "job_003",
            studentId: studentId,
            companyId: companyId,
            status: "Shortlisted",
            studentName: "Vedant Patil",
            studentEmail: "vedant@student.edu",
            studentPhone: "+91 91234 56789",
            jobTitle: "Full Stack Developer",
            companyName: "Google India",
            appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: "Candidate has strong full stack and MERN skills.",
        });

        // Seed Sample Interview
        this.interviews.push({
            _id: "int_001",
            applicationId: "app_001",
            jobId: "job_003",
            studentId: studentId,
            companyId: companyId,
            jobTitle: "Full Stack Developer",
            companyName: "Google India",
            studentName: "Vedant Patil",
            round: "Technical Interview Round 1",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            time: "11:00 AM",
            meetingLink: "https://meet.google.com/spa-demo-meet",
            status: "Scheduled",
            createdAt: new Date(),
        });

        // Seed Sample Notification
        this.notifications.push({
            _id: "notif_001",
            recipientId: studentId,
            role: "student",
            title: "Application Shortlisted! 🎉",
            message: "Congratulations! Google India has shortlisted your profile for Full Stack Developer.",
            type: "status_change",
            isRead: false,
            createdAt: new Date(),
        });
    }
}

const memoryStore = new MemoryStore();
module.exports = memoryStore;
