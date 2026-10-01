// ==========================================
// JOBS PORTAL SCRIPT
// Smart Placement Assistant
// ==========================================

let allJobs = [];
let currentFilter = "all";
let currentSearch = "";
let selectedJob = null;

const jobsListEl = document.getElementById("jobsList");
const searchInput = document.getElementById("jobSearchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const jobsCountText = document.getElementById("jobsCountText");
const userGreeting = document.getElementById("userGreeting");

// Application Modal Elements
const modal = document.getElementById("applyModal");
const closeModal = document.querySelector(".close-modal");
const cancelBtn = document.getElementById("cancelApplyBtn");
const confirmBtn = document.getElementById("confirmApplyBtn");
const modalJobTitle = document.getElementById("modalJobTitle");
const modalCompany = document.getElementById("modalCompany");
const modalUserInfo = document.getElementById("modalUserInfo");

// 1. Check User Session
const token = localStorage.getItem("token");
let currentUser = null;
try {
    currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser) {
        if (userGreeting) {
            const roleBadge = currentUser.role === "admin" ? " [Admin]" : currentUser.role === "company" ? " [Recruiter]" : "";
            userGreeting.innerText = `👋 Hi, ${currentUser.fullName || "User"}${roleBadge}`;
        }
        const dashBtns = document.querySelectorAll('a[href="dashboard.html"]');
        dashBtns.forEach(btn => {
            if (currentUser.role === "admin") btn.href = "admin-dashboard.html";
            else if (currentUser.role === "company") btn.href = "company-dashboard.html";
        });
    }
} catch (e) {
    console.warn("User parse error", e);
}

// 2. Fetch Jobs from Backend
async function fetchJobs() {
    try {
        const response = await fetch("http://localhost:5000/api/jobs");
        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.jobs)) {
                allJobs = data.jobs;
                renderJobs();
                return;
            }
        }
        throw new Error("Failed to load from backend");
    } catch (err) {
        console.warn("Using offline fallback jobs:", err);
        allJobs = [
            {
                _id: "job1",
                title: "Associate Software Engineer",
                company: "Infosys",
                location: "Bengaluru / Pune / Remote",
                salary: "₹4.5 - ₹6.5 LPA",
                type: "Full-Time",
                experience: "Fresher (2025/2026 Batch)",
                skills: ["Java", "SQL", "HTML/CSS", "Python"],
                description: "Looking for enthusiastic engineering graduates to join our digital transformation team.",
            },
            {
                _id: "job2",
                title: "Frontend Developer Intern",
                company: "Cognizant",
                location: "Hyderabad / Pune",
                salary: "₹25,000 / month",
                type: "Internship",
                experience: "Fresher",
                skills: ["JavaScript", "React", "HTML5", "CSS3"],
                description: "Join as a frontend intern to build responsive, modern student & enterprise portals.",
            },
            {
                _id: "job3",
                title: "Full Stack Developer",
                company: "TCS Digital",
                location: "Mumbai / Bengaluru",
                salary: "₹7.5 - ₹9 LPA",
                type: "Full-Time",
                experience: "0 - 1 Year",
                skills: ["Node.js", "Express", "MongoDB", "React"],
                description: "Build scalable cloud services and microservices for global enterprise clients.",
            },
            {
                _id: "job4",
                title: "Data Analyst",
                company: "Accenture",
                location: "Bengaluru / Gurugram",
                salary: "₹5.5 - ₹8 LPA",
                type: "Full-Time",
                experience: "Fresher",
                skills: ["Python", "SQL", "PowerBI", "Excel"],
                description: "Analyze business metrics, build predictive models, and deliver actionable insights.",
            },
            {
                _id: "job5",
                title: "Cloud & DevOps Intern",
                company: "Wipro",
                location: "Noida / Remote",
                salary: "₹20,000 / month",
                type: "Internship",
                experience: "Fresher",
                skills: ["Linux", "AWS", "Git", "Docker"],
                description: "Hands-on internship working with CI/CD pipelines, container orchestration, and cloud infrastructure.",
            },
        ];
        renderJobs();
    }
}

// 3. Render Jobs
function renderJobs() {
    let appliedJobIds = [];
    try {
        appliedJobIds = JSON.parse(localStorage.getItem("appliedJobs") || "[]");
    } catch (e) {
        appliedJobIds = [];
    }

    const filtered = allJobs.filter((job) => {
        const matchesFilter =
            currentFilter === "all" ||
            (job.type && job.type.toLowerCase() === currentFilter.toLowerCase());

        const query = currentSearch.toLowerCase();
        const matchesSearch =
            !query ||
            (job.title && job.title.toLowerCase().includes(query)) ||
            (job.company && job.company.toLowerCase().includes(query)) ||
            (Array.isArray(job.skills) && job.skills.some((s) => s.toLowerCase().includes(query)));

        return matchesFilter && matchesSearch;
    });

    if (jobsCountText) {
        jobsCountText.innerText = `Available Openings (${filtered.length})`;
    }

    if (filtered.length === 0) {
        jobsListEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748B;">
                <i class="fa-solid fa-folder-open" style="font-size: 36px; margin-bottom: 12px; color: #94A3B8;"></i>
                <h3>No jobs matching your criteria</h3>
                <p>Try searching for a different keyword or resetting filters.</p>
            </div>
        `;
        return;
    }

    jobsListEl.innerHTML = filtered
        .map((job) => {
            const isApplied = appliedJobIds.includes(job._id || job.title);
            const typeClass =
                job.type === "Internship" ? "type-internship" : "type-full-time";

            const skillsHtml = Array.isArray(job.skills)
                ? job.skills.map((s) => `<span class="skill-tag">${s}</span>`).join("")
                : "";

            return `
            <div class="job-card" data-id="${job._id || ""}">
                <div>
                    <div class="job-card-top">
                        <span class="company-badge">${job.company}</span>
                        <span class="job-type-pill ${typeClass}">${job.type || "Full-Time"}</span>
                    </div>

                    <h3 class="job-title">${job.title}</h3>

                    <div class="job-details-meta">
                        <span><i class="fa-solid fa-location-dot"></i> ${job.location || "Pan India"}</span>
                        <span><i class="fa-solid fa-sack-dollar"></i> ${job.salary || "Best in Industry"}</span>
                        <span><i class="fa-solid fa-user-graduate"></i> ${job.experience || "Fresher"}</span>
                    </div>

                    <p class="job-description">${job.description || ""}</p>

                    <div class="skills-wrap">
                        ${skillsHtml}
                    </div>
                </div>

                <button class="apply-btn ${isApplied ? "applied" : ""}" onclick="openApplyModal('${job._id || job.title}')">
                    ${isApplied ? '<i class="fa-solid fa-check"></i> Applied' : "Apply Now"}
                </button>
            </div>
        `;
        })
        .join("");
}

// 4. Modal Interactions
window.openApplyModal = function (jobId) {
    if (!token) {
        const toLogin = confirm("Please login to apply for jobs. Would you like to go to login page?");
        if (toLogin) window.location.href = "login.html";
        return;
    }

    const job = allJobs.find((j) => (j._id || j.title) === jobId);
    if (!job) return;

    selectedJob = job;
    modalJobTitle.innerText = `Apply: ${job.title}`;
    modalCompany.innerText = `${job.company} • ${job.location || "Remote"}`;

    modalUserInfo.innerHTML = `
        <strong>Applicant:</strong> ${currentUser ? currentUser.fullName : "Logged In Student"}<br>
        <strong>Email:</strong> ${currentUser ? currentUser.email : "Registered Email"}<br>
        <strong>Resume:</strong> Attached from your uploaded resume profile.
    `;

    modal.style.display = "flex";
};

if (closeModal) {
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
        if (!selectedJob) return;

        let appliedJobIds = [];
        try {
            appliedJobIds = JSON.parse(localStorage.getItem("appliedJobs") || "[]");
        } catch (e) {
            appliedJobIds = [];
        }

        const id = selectedJob._id || selectedJob.title;
        if (!appliedJobIds.includes(id)) {
            appliedJobIds.push(id);
            localStorage.setItem("appliedJobs", JSON.stringify(appliedJobIds));
        }

        modal.style.display = "none";
        alert(`🎉 Application submitted successfully for ${selectedJob.title} at ${selectedJob.company}!`);
        renderJobs();
    });
}

// 5. Search & Filter Listeners
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        currentSearch = e.target.value.trim();
        renderJobs();
    });
}

filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        renderJobs();
    });
});

// Init
fetchJobs();
