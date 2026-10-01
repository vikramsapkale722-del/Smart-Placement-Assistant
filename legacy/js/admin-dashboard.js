// ==========================================
// ADMIN / PLACEMENT CELL DASHBOARD SCRIPT
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const currentUser = requireAuth(["admin"]);

// 1. Initialize Admin Header
function initAdminHeader(user) {
    if (!user) return;
    const nameEl = document.getElementById("adminUserName");
    const welcomeEl = document.getElementById("welcomeAdmin");

    const displayName = user.fullName || "Placement Officer (Admin)";
    if (nameEl) nameEl.innerText = displayName;
    if (welcomeEl) welcomeEl.innerHTML = `Placement Cell Administration • ${displayName} 🛡️`;
}
initAdminHeader(currentUser);

// 2. Setup Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });
}

// 3. Load Admin Analytics Overview
async function loadAdminOverview() {
    try {
        const res = await apiFetch("/api/admin/overview");
        if (res.ok && res.data.success && res.data.stats) {
            const s = res.data.stats;
            const studentsEl = document.getElementById("metricStudents");
            const companiesEl = document.getElementById("metricCompanies");
            const totalJobsEl = document.getElementById("metricTotalJobs");
            const placementRateEl = document.getElementById("metricPlacementRate");

            if (studentsEl) studentsEl.innerText = s.totalStudents || 0;
            if (companiesEl) companiesEl.innerText = s.totalCompanies || 0;
            if (totalJobsEl) totalJobsEl.innerText = s.totalJobs || 0;
            if (placementRateEl) placementRateEl.innerText = `${s.placementRate || 75}%`;
        }
    } catch (e) {
        console.warn("Could not fetch admin overview:", e);
    }
}

// 4. Load Student Directory
async function loadStudentsDirectory() {
    const tbody = document.getElementById("adminStudentsTbody");
    if (!tbody) return;

    try {
        const res = await apiFetch("/api/admin/students");
        if (res.ok && res.data.success && Array.isArray(res.data.students)) {
            const students = res.data.students;

            if (students.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #94A3B8; padding: 36px;">
                            No students registered yet.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = students.map(s => {
                const skillsStr = Array.isArray(s.skills) && s.skills.length > 0
                    ? s.skills.slice(0, 3).join(", ")
                    : "Not specified";
                const collegeStr = s.college ? `${s.college} (${s.branch || "General"})` : "Self Enrolled";

                return `
                    <tr>
                        <td>
                            <strong style="color: #1E293B;">${s.fullName}</strong>
                            <div style="font-size: 12px; color: #64748B;">${s.phone || "No phone added"}</div>
                        </td>
                        <td>${s.email}</td>
                        <td>${collegeStr}</td>
                        <td><strong>${s.cgpa || "--"}</strong></td>
                        <td><span style="font-size: 12px; color: #2563EB;">${skillsStr}</span></td>
                        <td>
                            <span style="background: #ECFDF5; color: #10B981; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">
                                Active Candidate
                            </span>
                        </td>
                    </tr>
                `;
            }).join("");
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #EF4444; padding: 24px;">
                        Failed to load students directory.
                    </td>
                </tr>
            `;
        }
    } catch (err) {
        console.error("Error loading students:", err);
    }
}

// Initialize
loadAdminOverview();
loadStudentsDirectory();
