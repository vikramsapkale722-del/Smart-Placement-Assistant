// ==========================================
// RESUME MANAGEMENT LOGIC
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const currentUser = requireAuth(["student", "admin"]);

const resumeForm = document.getElementById("resumeForm");
const resumeFileInput = document.getElementById("resumeFile");
const uploadSubmitBtn = document.getElementById("uploadSubmitBtn");
const fileDropArea = document.getElementById("fileDropArea");
const dropText = document.getElementById("dropText");

const currentResumeStatus = document.getElementById("currentResumeStatus");
const noResumeMsg = document.getElementById("noResumeMsg");
const currentFileName = document.getElementById("currentFileName");
const currentUploadDate = document.getElementById("currentUploadDate");
const directViewBtn = document.getElementById("directViewBtn");
const downloadResumeBtn = document.getElementById("downloadResumeBtn");
const deleteResumeBtn = document.getElementById("deleteResumeBtn");

const atsScoreValue = document.getElementById("atsScoreValue");
const resumeSkillsList = document.getElementById("resumeSkillsList");
const aiSuggestionsBox = document.getElementById("aiSuggestionsBox");
const aiSuggestionsList = document.getElementById("aiSuggestionsList");

let activeResumeData = null;

// Format Date Helper
function formatDate(dateStr) {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Display Resume Card
function displayResume(resume) {
    if (!resume) {
        currentResumeStatus.style.display = "none";
        noResumeMsg.style.display = "flex";
        aiSuggestionsBox.style.display = "none";
        activeResumeData = null;
        return;
    }

    activeResumeData = resume;
    currentResumeStatus.style.display = "block";
    noResumeMsg.style.display = "none";

    const cleanName = resume.originalName || (resume.fileName ? resume.fileName.replace(/^\d+-/, "") : "Resume.pdf");
    currentFileName.textContent = cleanName;
    currentUploadDate.textContent = `Uploaded: ${formatDate(resume.uploadedAt)}`;

    if (directViewBtn) {
        directViewBtn.href = `${window.API_BASE}/uploads/${resume.fileName}`;
    }

    if (atsScoreValue) {
        atsScoreValue.textContent = `${resume.atsScore || 85}%`;
    }

    // Render detected skills
    if (resumeSkillsList) {
        const skills = resume.parsedSkills || ["JavaScript", "HTML5/CSS3", "React", "Node.js", "MongoDB", "SQL"];
        resumeSkillsList.innerHTML = skills
            .map((s) => `<span class="resume-skill-pill"><i class="fa-solid fa-check"></i> ${s}</span>`)
            .join("");
    }

    // Render AI Suggestions
    if (aiSuggestionsBox && aiSuggestionsList) {
        const feedback = resume.feedback || [
            "Use strong action verbs to begin every bullet point.",
            "Include measurable metrics (e.g. 'Improved efficiency by 25%').",
            "Ensure GitHub & LinkedIn URLs are clearly visible at top of page.",
            "Tailor project keywords to match target company placement descriptions."
        ];

        aiSuggestionsList.innerHTML = feedback
            .map((tip) => `<li><i class="fa-solid fa-circle-check"></i> <span>${tip}</span></li>`)
            .join("");

        aiSuggestionsBox.style.display = "block";
    }
}

// Load Resume Status from Backend
async function loadResume() {
    try {
        const res = await apiFetch("/api/resume/myresume");
        if (res.ok && res.data.success && res.data.resume) {
            displayResume(res.data.resume);
        } else {
            displayResume(null);
        }
    } catch (err) {
        console.error("Load resume error:", err);
        displayResume(null);
    }
}
loadResume();

// File Input Change Listener
if (resumeFileInput) {
    resumeFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.toLowerCase().endsWith(".pdf")) {
                showToast("Only PDF documents are allowed.", "error");
                resumeFileInput.value = "";
                dropText.textContent = "Click to select PDF or drag & drop";
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast("File exceeds 5MB limit. Please choose a smaller PDF.", "error");
                resumeFileInput.value = "";
                dropText.textContent = "Click to select PDF or drag & drop";
                return;
            }
            dropText.innerHTML = `<strong>Selected:</strong> ${file.name} (${Math.round(file.size / 1024)} KB)`;
        }
    });
}

// Upload / Replace Resume Handler
if (resumeForm) {
    resumeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = resumeFileInput.files[0];
        if (!file) {
            showToast("Please select a PDF resume to upload.", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("resume", file);

        try {
            uploadSubmitBtn.disabled = true;
            uploadSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading & Analyzing...';

            const res = await apiFetch("/api/resume/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok && res.data.success) {
                showToast("✅ Resume uploaded and verified successfully!", "success");
                displayResume(res.data.resume);
                resumeForm.reset();
                dropText.textContent = "Click to select PDF or drag & drop";
            } else {
                showToast(res.data.message || "Failed to upload resume.", "error");
            }
        } catch (error) {
            console.error("Upload error:", error);
            showToast("Connection error while uploading resume.", "error");
        } finally {
            uploadSubmitBtn.disabled = false;
            uploadSubmitBtn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket"></i> Upload / Replace Resume';
        }
    });
}

// Download Resume Handler
if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener("click", () => {
        if (!activeResumeData) {
            showToast("No active resume to download.", "warning");
            return;
        }
        const downloadUrl = `${window.API_BASE}/api/resume/download`;
        const token = getToken();

        // Download via fetch blob to maintain authentication
        fetch(downloadUrl, {
            headers: { Authorization: "Bearer " + token },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Download failed");
                return res.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = activeResumeData.originalName || activeResumeData.fileName || "Resume.pdf";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                showToast("⬇️ Download started!", "info");
            })
            .catch((err) => {
                console.error("Download error:", err);
                showToast("Could not download resume.", "error");
            });
    });
}

// Delete Resume Handler
if (deleteResumeBtn) {
    deleteResumeBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete your active placement resume? This will also remove it from active job applications.")) {
            return;
        }

        try {
            deleteResumeBtn.disabled = true;
            deleteResumeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const res = await apiFetch("/api/resume/delete", {
                method: "DELETE",
            });

            if (res.ok && res.data.success) {
                showToast("🗑️ Resume deleted successfully.", "info");
                displayResume(null);
            } else {
                showToast(res.data.message || "Failed to delete resume.", "error");
            }
        } catch (error) {
            console.error("Delete error:", error);
            showToast("Could not delete resume.", "error");
        } finally {
            deleteResumeBtn.disabled = false;
            deleteResumeBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete';
        }
    });
}

