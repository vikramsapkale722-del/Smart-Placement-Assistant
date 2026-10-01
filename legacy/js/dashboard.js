// ==========================================
// STUDENT DASHBOARD LOGIC
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const currentUser = requireAuth(["student", "admin"]);

// 1. Update User Header Info
function updateUserHeader(user) {
    if (!user) return;
    const welcomeEl = document.getElementById("welcomeName");
    const profileEl = document.getElementById("profileName");
    const topAvatar = document.getElementById("topAvatar");
    const roleCaption = document.getElementById("roleCaption");

    if (welcomeEl) welcomeEl.innerHTML = `Welcome, ${user.fullName || "Student"} 👋`;
    if (profileEl) profileEl.innerText = user.fullName || "Student";
    if (roleCaption) roleCaption.innerText = user.college ? `${user.branch || "Student"} • ${user.college}` : "Placement Candidate";
    if (topAvatar && user.profileImage) topAvatar.src = user.profileImage;

    // Profile strength stat
    const percent = calculateProfileCompletion(user);
    const profilePercentText = document.getElementById("profilePercentText");
    const profileTipText = document.getElementById("profileTipText");
    if (profilePercentText) profilePercentText.innerText = `${percent}%`;
    if (profileTipText) profileTipText.innerText = percent === 100 ? "Fully Complete 🌟" : "Click to complete";
}

updateUserHeader(currentUser);

// 2. Fetch Latest Profile
async function syncProfile() {
    const res = await apiFetch("/api/auth/me");
    if (res.ok && res.data.success && res.data.user) {
        setCurrentUser(res.data.user);
        updateUserHeader(res.data.user);
    }
}
syncProfile();

// 3. Load Resume Status & Score
async function loadResumeMetrics() {
    const scoreText = document.getElementById("resumeScoreText");
    const noteText = document.getElementById("resumeStatusNote");

    try {
        const res = await apiFetch("/api/resume/myresume");
        if (res.ok && res.data.success && res.data.resume) {
            const resume = res.data.resume;
            if (scoreText) scoreText.innerText = `${resume.atsScore || 85}%`;
            if (noteText) noteText.innerText = "Verified & Active ✅";
        } else {
            if (scoreText) scoreText.innerText = "0%";
            if (noteText) noteText.innerText = "Upload required ⚠️";
        }
    } catch (e) {
        if (scoreText) scoreText.innerText = "--";
    }
}
loadResumeMetrics();

// 4. Load Student Applications & Recent Applications Table
async function loadApplications() {
    const countEl = document.getElementById("appliedJobsCount");
    const tableWrap = document.getElementById("recentApplicationsTable");

    try {
        const res = await apiFetch("/api/applications/my-applications");
        if (res.ok && res.data.success && Array.isArray(res.data.applications)) {
            const apps = res.data.applications;
            if (countEl) countEl.innerText = apps.length;

            if (apps.length === 0) {
                tableWrap.innerHTML = `
                    <div class="empty-placeholder">
                        <i class="fa-solid fa-folder-open"></i>
                        <p>You haven't applied to any jobs yet.</p>
                        <a href="jobs.html" class="btn-micro">Explore & Apply Now</a>
                    </div>
                `;
                return;
            }

            tableWrap.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Position</th>
                            <th>Applied Date</th>
                            <th>Current Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apps.slice(0, 5).map(app => {
                            const statusClass = `status-${(app.status || "applied").toLowerCase().replace(/\s+/g, "-")}`;
                            const d = new Date(app.appliedAt || app.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric"
                            });
                            return `
                                <tr>
                                    <td><strong>${app.companyName || "Company"}</strong></td>
                                    <td>${app.jobTitle}</td>
                                    <td>${d}</td>
                                    <td><span class="status-pill ${statusClass}">${app.status}</span></td>
                                    <td>
                                        <a href="applications.html" class="table-link">Track <i class="fa-solid fa-arrow-right"></i></a>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            `;
        }
    } catch (e) {
        console.error("Load applications error:", e);
    }
}
loadApplications();

// 5. Load Upcoming Interviews
async function loadInterviews() {
    const countEl = document.getElementById("interviewsCount");
    const listWrap = document.getElementById("interviewsList");

    try {
        const res = await apiFetch("/api/interviews/student");
        if (res.ok && res.data.success && Array.isArray(res.data.interviews)) {
            const interviews = res.data.interviews;
            if (countEl) countEl.innerText = interviews.length;

            if (interviews.length === 0) {
                listWrap.innerHTML = `
                    <div class="empty-placeholder">
                        <i class="fa-solid fa-calendar-xmark"></i>
                        <p>No interviews scheduled yet. Keep applying to active openings!</p>
                    </div>
                `;
                return;
            }

            listWrap.innerHTML = interviews.map(i => `
                <div class="interview-card-mini">
                    <div class="interview-time-badge">
                        <span class="int-date">${i.date}</span>
                        <span class="int-time">${i.time}</span>
                    </div>
                    <div class="interview-details">
                        <h4>${i.jobTitle}</h4>
                        <p class="company-sub">${i.companyName} • <em>${i.round}</em></p>
                        ${i.meetingLink ? `
                            <a href="${i.meetingLink}" target="_blank" class="join-meet-btn">
                                <i class="fa-solid fa-video"></i> Join Video Call
                            </a>
                        ` : ""}
                    </div>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Load interviews error:", e);
    }
}
loadInterviews();

// 6. Load Recommended Jobs
async function loadRecommendedJobs() {
    const listWrap = document.getElementById("recommendedJobsList");

    try {
        const res = await apiFetch("/api/jobs");
        if (res.ok && res.data.success && Array.isArray(res.data.jobs)) {
            const jobs = res.data.jobs.slice(0, 4);

            listWrap.innerHTML = jobs.map(j => `
                <div class="job-item-mini">
                    <div class="job-mini-info">
                        <span class="company-badge-micro">${j.company}</span>
                        <h4>${j.title}</h4>
                        <div class="job-mini-meta">
                            <span><i class="fa-solid fa-location-dot"></i> ${j.location || "Remote"}</span>
                            <span><i class="fa-solid fa-sack-dollar"></i> ${j.salary || "Competitive"}</span>
                            <span><i class="fa-solid fa-business-time"></i> ${j.type}</span>
                        </div>
                    </div>
                    <a href="jobs.html" class="apply-micro-btn">
                        Apply <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Load recommended jobs error:", e);
    }
}
loadRecommendedJobs();

// 7. Notification System & Bell Dropdown
const notifBtn = document.getElementById("notifBtn");
const notifDropdown = document.getElementById("notifDropdown");
const notifBadge = document.getElementById("notifBadge");
const notifList = document.getElementById("notifList");
const markAllReadBtn = document.getElementById("markAllReadBtn");

async function syncNotifications() {
    try {
        const res = await apiFetch("/api/notifications");
        if (res.ok && res.data.success) {
            const count = res.data.unreadCount || 0;
            if (count > 0) {
                notifBadge.style.display = "inline-block";
                notifBadge.innerText = count;
            } else {
                notifBadge.style.display = "none";
            }

            const notifs = res.data.notifications || [];
            if (notifs.length > 0) {
                notifList.innerHTML = notifs.map(n => `
                    <div class="notif-item ${n.isRead ? "" : "unread"}" onclick="handleNotifClick('${n._id}', '${n.link || ""}')">
                        <div class="notif-item-header">
                            <strong>${n.title}</strong>
                            <small>${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                        <p>${n.message}</p>
                    </div>
                `).join("");
            } else {
                notifList.innerHTML = '<p class="empty-notif">No notifications.</p>';
            }
        }
    } catch (e) {
        console.warn("Notifications sync error", e);
    }
}
syncNotifications();

if (notifBtn) {
    notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = notifDropdown.style.display === "block";
        notifDropdown.style.display = isOpen ? "none" : "block";
    });
}

document.addEventListener("click", (e) => {
    if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.style.display = "none";
    }
});

window.handleNotifClick = async function (id, link) {
    await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });
    syncNotifications();
    if (link) window.location.href = link;
};

if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", async () => {
        await apiFetch("/api/notifications/read-all", { method: "PUT" });
        syncNotifications();
    });
}

// 8. Search Input Redirection to Jobs
const dashSearchInput = document.getElementById("dashSearchInput");
if (dashSearchInput) {
    dashSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const q = encodeURIComponent(dashSearchInput.value.trim());
            window.location.href = `jobs.html?search=${q}`;
        }
    });
}

// 9. Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });
}