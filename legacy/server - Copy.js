const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

dotenv.config({ path: "./backend/.env" });

// Connect Database
connectDB();

const app = express();

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());

// ======================
// Static Folder
// ======================
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ======================
// Routes
// ======================
app.use("/api/auth", authRoutes);

app.use("/api/resume", (req, res, next) => {
    console.log("Resume Route Hit:", req.method, req.url);
    next();
});

app.use("/api/resume", resumeRoutes);

// ======================
// Test Routes
// ======================
app.get("/", (req, res) => {
    res.send("🚀 Smart Placement Assistant Backend Running...");
});

app.get("/test-upload", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "uploads",
            "1785528879149-Project_Abstract-v2.pdf"
        )
    );
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});