// ==========================================
// STUDENT PROFILE SCRIPT
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const currentUser = requireAuth(["student", "admin"]);

function renderProfile(user) {
    if (!user) return;

    // Header elements
    const fullNameEl = document.getElementById("fullName");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");
    const roleBadgeEl = document.getElementById("roleBadge");
    const collegeSubtext = document.getElementById("profileCollege");
    const avatarEl = document.getElementById("profileAvatar");

    if (fullNameEl) fullNameEl.innerText = user.fullName || "Student Name";
    if (emailEl) emailEl.innerText = user.email || "No Email";
    if (phoneEl) phoneEl.innerText = user.phone || "Not added";
    if (roleBadgeEl) roleBadgeEl.innerText = (user.role || "student").toUpperCase();
    if (collegeSubtext) collegeSubtext.innerText = user.college || "Placement Candidate";
    if (avatarEl && user.profileImage) avatarEl.src = user.profileImage;

    // Academic elements
    const viewCollege = document.getElementById("viewCollege");
    const viewDegreeBranch = document.getElementById("viewDegreeBranch");
    const viewGradYear = document.getElementById("viewGradYear");
    const viewCgpa = document.getElementById("viewCgpa");

    if (viewCollege) viewCollege.innerText = user.college || "Not added";
    if (viewDegreeBranch) {
        const deg = user.degree || "";
        const branch = user.branch || "";
        viewDegreeBranch.innerText = deg && branch ? `${deg} in ${branch}` : deg || branch || "Not added";
    }
    if (viewGradYear) viewGradYear.innerText = user.graduationYear || "Not added";
    if (viewCgpa) viewCgpa.innerText = user.cgpa ? `${user.cgpa} CGPA` : "Not added";

    // Social Links
    const viewLinkedin = document.getElementById("viewLinkedin");
    const viewGithub = document.getElementById("viewGithub");

    if (viewLinkedin) {
        if (user.linkedin && user.linkedin.startsWith("http")) {
            viewLinkedin.innerHTML = `<a href="${user.linkedin}" target="_blank" rel="noopener noreferrer">${user.linkedin}</a>`;
        } else {
            viewLinkedin.innerText = user.linkedin || "Not linked";
        }
    }

    if (viewGithub) {
        if (user.github && user.github.startsWith("http")) {
            viewGithub.innerHTML = `<a href="${user.github}" target="_blank" rel="noopener noreferrer">${user.github}</a>`;
        } else {
            viewGithub.innerText = user.github || "Not linked";
        }
    }

    // Skills Chips
    const skillsWrap = document.getElementById("skillsChipsWrap");
    if (skillsWrap) {
        const skills = Array.isArray(user.skills)
            ? user.skills
            : typeof user.skills === "string" && user.skills.trim()
            ? user.skills.split(",").map((s) => s.trim())
            : [];

        if (skills.length > 0) {
            skillsWrap.innerHTML = skills
                .map((skill) => `<span class="profile-skill-chip"><i class="fa-solid fa-code"></i> ${skill}</span>`)
                .join("");
        } else {
            skillsWrap.innerHTML = '<span class="no-data-text">No technical skills added yet. Click "Edit Full Profile" to add.</span>';
        }
    }

    // Projects & Highlights
    const viewProjects = document.getElementById("viewProjects");
    const viewCertifications = document.getElementById("viewCertifications");
    const viewExperience = document.getElementById("viewExperience");

    if (viewProjects) viewProjects.innerText = user.projects || "No key projects listed yet.";
    if (viewCertifications) viewCertifications.innerText = user.certifications || "No certifications listed yet.";
    if (viewExperience) viewExperience.innerText = user.experience || "No prior internships or work experience listed yet.";

    // Dynamic Completion Percentage Calculation
    const percent = calculateProfileCompletion(user);
    const percentText = document.getElementById("completionPercentText");
    const progressBar = document.getElementById("completionProgressBar");
    const tipText = document.getElementById("completionTip");

    if (percentText) percentText.innerText = `${percent}%`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    if (tipText) {
        if (percent < 50) {
            tipText.innerText = "⚠️ Profile is incomplete. Add college, branch, skills, and projects to boost recruiter visibility.";
            tipText.style.color = "#D97706";
        } else if (percent < 85) {
            tipText.innerText = "👍 Good progress! Add certifications and live GitHub/portfolio links to reach 100%.";
            tipText.style.color = "#2563EB";
        } else {
            tipText.innerText = "🌟 Outstanding! Your profile is fully optimized for campus recruiters and placement drives.";
            tipText.style.color = "#059669";
        }
    }
}

// 1. Initial Render from Cache
try {
    const cached = getCurrentUser();
    if (cached) renderProfile(cached);
} catch (e) {
    console.error("Cache render error", e);
}

// 2. Fetch Latest User Data
async function syncLatestProfile() {
    const res = await apiFetch("/api/auth/me");
    if (res.ok && res.data.success && res.data.user) {
        setCurrentUser(res.data.user);
        renderProfile(res.data.user);
    }
}
syncLatestProfile();

// ==========================================
// Edit Profile Form Handling
// ==========================================
const editBtn = document.getElementById("editBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editFormWrap = document.getElementById("editFormWrap");
const profileViewWrap = document.getElementById("profileViewWrap");
const editProfileForm = document.getElementById("editProfileForm");
const saveBtn = document.getElementById("saveProfileBtn");

if (editBtn) {
    editBtn.addEventListener("click", () => {
        const user = getCurrentUser() || {};

        document.getElementById("editFullName").value = user.fullName || "";
        document.getElementById("editPhone").value = user.phone || "";
        document.getElementById("editCollege").value = user.college || "";
        document.getElementById("editDegree").value = user.degree || "";
        document.getElementById("editBranch").value = user.branch || "";
        document.getElementById("editGradYear").value = user.graduationYear || "";
        document.getElementById("editCgpa").value = user.cgpa || "";

        const skills = Array.isArray(user.skills) ? user.skills.join(", ") : user.skills || "";
        document.getElementById("editSkills").value = skills;
        document.getElementById("editProjects").value = user.projects || "";
        document.getElementById("editCertifications").value = user.certifications || "";
        document.getElementById("editExperience").value = user.experience || "";
        document.getElementById("editLinkedin").value = user.linkedin || "";
        document.getElementById("editGithub").value = user.github || "";

        profileViewWrap.style.display = "none";
        editFormWrap.style.display = "block";
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        editFormWrap.style.display = "none";
        profileViewWrap.style.display = "block";
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("editFullName").value.trim();
        if (!fullName) {
            showToast("Full Name cannot be empty.", "warning");
            return;
        }

        const payload = {
            fullName,
            phone: document.getElementById("editPhone").value.trim(),
            college: document.getElementById("editCollege").value.trim(),
            degree: document.getElementById("editDegree").value.trim(),
            branch: document.getElementById("editBranch").value.trim(),
            graduationYear: document.getElementById("editGradYear").value.trim(),
            cgpa: document.getElementById("editCgpa").value.trim(),
            skills: document.getElementById("editSkills").value.trim(),
            projects: document.getElementById("editProjects").value.trim(),
            certifications: document.getElementById("editCertifications").value.trim(),
            experience: document.getElementById("editExperience").value.trim(),
            linkedin: document.getElementById("editLinkedin").value.trim(),
            github: document.getElementById("editGithub").value.trim(),
        };

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const res = await apiFetch("/api/auth/profile", {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (res.ok && res.data.success) {
                setCurrentUser(res.data.user);
                renderProfile(res.data.user);

                showToast("✅ Profile updated successfully!", "success");

                setTimeout(() => {
                    editFormWrap.style.display = "none";
                    profileViewWrap.style.display = "block";
                }, 600);
            } else {
                showToast(res.data.message || "Failed to update profile.", "error");
            }
        } catch (err) {
            console.error("Profile save error:", err);
            showToast("Connection error while saving profile.", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Profile';
        }
    });
}