const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    fileName: {
        type: String,
        required: true,
    },

    originalName: {
        type: String,
        default: "",
    },

    filePath: {
        type: String,
        required: true,
    },

    fileSize: {
        type: Number,
        default: 0,
    },

    parsedSkills: {
        type: [String],
        default: [],
    },

    atsScore: {
        type: Number,
        default: 80,
    },

    feedback: {
        type: [String],
        default: [],
    },

    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Resume", resumeSchema);