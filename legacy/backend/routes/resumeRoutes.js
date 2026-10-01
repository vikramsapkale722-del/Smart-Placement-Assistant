const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    uploadResume,
    getMyResume,
    downloadResume,
    deleteResume,
} = require("../controllers/resumeController");

// ===========================
// Multer Storage Configuration
// ===========================
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Clean filename and add timestamp
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueName = Date.now() + "-" + cleanName;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed. Please upload a .pdf document."));
        }
    },
});

// Middleware wrapper to return clean JSON on Multer errors
const uploadSinglePDF = (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error. Only PDF files up to 5MB are allowed.",
            });
        }
        next();
    });
};

// ===========================
// Routes
// ===========================
router.post("/upload", protect, authorize("student", "admin"), uploadSinglePDF, uploadResume);
router.get("/myresume", protect, authorize("student", "admin"), getMyResume);
router.get("/download", protect, downloadResume);
router.delete("/delete", protect, authorize("student", "admin"), deleteResume);

router.get("/test", (req, res) => {
    res.json({ success: true, message: "Resume Routes Working" });
});

module.exports = router;