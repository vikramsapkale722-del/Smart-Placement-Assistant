// ==========================================
// RECRUITER / COMPANY DASHBOARD SCRIPT
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const currentUser = requireAuth(["company", "admin"]);

// 1. Initialize Recruiter Header & Details
function initRecruiterHeader(user) {
    if (!user) return;
    const nameEl = document.getElementById("companyUserName");
    const orgEl = document.getElementById("companyUserOrg");
    const welcomeEl = document.getElementById("welcomeCompany");

    const displayName = user.fullName || "Recruiter";
    const displayOrg = user.companyName || (user.role === "admin" ? "Placement Cell Admin" : "Company Partner");

    if (nameEl) nameEl.innerText = displayName;
    if (orgEl) orgEl.innerText = displayOrg;
    if (welcomeEl) welcomeEl.innerHTML = `Welcome, ${displayName} 👋`;
}
initRecruiterHeader(currentUser);

// 2. Setup Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });
}

// 3. Load Recruiter Statistics
async function loadRecruiterStats() {
    try {
        const res = await apiFetch("/api/company/stats");
        if (res.ok && res.data.success && res.data.stats) {
            const s = res.data.stats;
            const activeJobsEl = document.getElementById("metricActiveJobs");
            const applicantsEl = document.getElementById("metricApplicants");
            const shortlistedEl = document.getElementById("metricShortlisted");
            const interviewsEl = document.getElementById("metricInterviews");

            if (activeJobsEl) activeJobsEl.innerText = s.activeJobs || 0;
            if (applicantsEl) applicantsEl.innerText = s.totalApplicants || 0;
            if (shortlistedEl) shortlistedEl.innerText = s.shortlisted || 0;
            if (interviewsEl) interviewsEl.innerText = s.interviews || 0;
        }
    } catch (e) {
        console.warn("Could not fetch recruiter stats:", e);
    }
}

// 4. Load Company Jobs
async function loadCompanyJobs() {
    const tbody = document.getElementById("companyJobsTbody");
    if (!tbody) return;

    try {
        const res = await apiFetch("/api/jobs/company/my-jobs");
        if (res.ok && res.data.success && Array.isArray(res.data.jobs)) {
            const jobs = res.data.jobs;

            // Update active job count
            const activeCount = jobs.filter(j => j.status === "Active").length;
            const activeJobsEl = document.getElementById("metricActiveJobs");
            if (activeJobsEl) activeJobsEl.innerText = activeCount;

            if (jobs.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; color: #94A3B8; padding: 36px;">
                            <i class="fa-solid fa-folder-open" style="font-size: 28px; margin-bottom: 8px; display:block;"></i>
                            No job openings posted yet. Click <strong>"Post New Job"</strong> to publish your first campus opening.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = jobs.map(job => {
                const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open";
                const statusBadge = job.status === "Active"
                    ? `<span style="background: #ECFDF5; color: #10B981; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">Active</span>`
                    : `<span style="background: #F1F5F9; color: #64748B; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">Closed</span>`;

                return `
                    <tr>
                        <td>
                            <strong style="color: #1E293B;">${job.title}</strong>
                            <div style="font-size: 12px; color: #64748B;">${(job.skills || []).slice(0, 3).join(", ") || "General"}</div>
                        </td>
                        <td>${job.type || "Full-Time"}</td>
                        <td>${job.location || "Pan India"}</td>
                        <td><strong>${job.salary || "Competitive"}</strong></td>
                        <td>${deadline}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button type="button" class="table-action-btn btn-delete" title="Delete Opening" onclick="handleDeleteJob('${job._id}')">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #EF4444; padding: 24px;">
                        Failed to load jobs. Please try refreshing.
                    </td>
                </tr>
            `;
        }
    } catch (err) {
        console.error("Error loading company jobs:", err);
    }
}

// 5. Delete Job Handler
window.handleDeleteJob = async function (jobId) {
    if (!confirm("Are you sure you want to delete this job opening? This action cannot be undone.")) return;

    try {
        const res = await apiFetch(`/api/jobs/${jobId}`, {
            method: "DELETE",
        });

        if (res.ok && res.data.success) {
            showToast("Job opening deleted successfully.", "success");
            loadCompanyJobs();
            loadRecruiterStats();
        } else {
            showToast(res.data.message || "Could not delete job.", "error");
        }
    } catch (e) {
        console.error("Delete error:", e);
        showToast("Error connecting to server.", "error");
    }
};

// 6. Post Job Modal Controls
window.openPostJobModal = function () {
    const modal = document.getElementById("postJobModal");
    if (modal) modal.style.display = "flex";
};

window.closePostJobModal = function () {
    const modal = document.getElementById("postJobModal");
    if (modal) modal.style.display = "none";
};

// 7. Post Job Form Submission
const postJobForm = document.getElementById("postJobForm");
if (postJobForm) {
    postJobForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const title = document.getElementById("jobTitle").value.trim();
        const type = document.getElementById("jobType").value;
        const salary = document.getElementById("jobSalary").value.trim();
        const location = document.getElementById("jobLocation").value.trim();
        const experience = document.getElementById("jobExperience").value.trim();
        const skills = document.getElementById("jobSkills").value.trim();
        const branch = document.getElementById("jobBranch").value.trim();
        const deadline = document.getElementById("jobDeadline").value;
        const description = document.getElementById("jobDescription").value.trim();

        if (!title) {
            showToast("Job Title is required.", "warning");
            return;
        }

        const payload = {
            title,
            type,
            salary: salary || "Competitive",
            location: location || "Remote / Pan India",
            experience: experience || "Fresher",
            skills,
            branch: branch || "All Branches",
            deadline: deadline || "",
            description: description || "",
        };

        const saveBtn = document.getElementById("saveJobBtn");
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

            const res = await apiFetch("/api/jobs", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (res.ok && res.data.success) {
                showToast("🎉 Job opening published successfully!", "success");
                postJobForm.reset();
                closePostJobModal();
                loadCompanyJobs();
                loadRecruiterStats();
            } else {
                showToast(res.data.message || "Failed to post job.", "error");
            }
        } catch (err) {
            console.error("Job post error:", err);
            showToast("Server communication error.", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publish Job';
        }
    });
}

// Initial Data Load
loadRecruiterStats();
loadCompanyJobs();
