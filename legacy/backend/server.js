const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load Environment Variables FIRST
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const companyRoutes = require("./routes/companyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Connect MongoDB Atlas
connectDB();

const app = express();

// =========================
// Middlewares
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// Static: Uploaded Files & Frontend Assets
// =========================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "..")));

// =========================
// API Routes
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/ai", aiRoutes);

// =========================
// API Health Check
// =========================
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Smart Placement Assistant API Running",
        version: "2.0",
        developer: "Vedant Patil",
    });
});

// =========================
// 404 API Handler
// =========================
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API Route Not Found",
    });
});

// =========================
// Global Error Handler
// =========================
app.use((err, req, res, next) => {
    console.error("❌ Global Server Error:", err.message || err);

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            success: false,
            message: "File is too large. Maximum allowed size is 5MB.",
        });
    }

    if (err.message && err.message.toLowerCase().includes("only pdf")) {
        return res.status(400).json({
            success: false,
            message: "Only PDF documents (.pdf) are allowed.",
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// =========================
// Server Initialization
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Smart Placement Assistant Server Active`);
    console.log(`🌐 Local Web Portal: http://localhost:${PORT}`);
    console.log(`📡 API Endpoints:    http://localhost:${PORT}/api`);
    console.log(`👨‍💻 Developer:        Vedant Patil`);
    console.log(`====================================================`);
});