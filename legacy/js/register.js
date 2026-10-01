// ==========================================
// REGISTER LOGIC & API INTEGRATION
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

// Prevent authenticated users from staying on register page
redirectIfAuthenticated();

const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerSubmitBtn");
const selectedRoleInput = document.getElementById("selectedRole");
const studentFields = document.getElementById("studentFields");
const companyFields = document.getElementById("companyFields");
const tabStudent = document.getElementById("tabStudent");
const tabCompany = document.getElementById("tabCompany");

// Switch Role Toggle
window.switchRole = function (role) {
    selectedRoleInput.value = role;

    if (role === "student") {
        tabStudent.classList.add("active");
        tabCompany.classList.remove("active");
        studentFields.style.display = "block";
        companyFields.style.display = "none";
        registerBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Student Account';
    } else {
        tabCompany.classList.add("active");
        tabStudent.classList.remove("active");
        studentFields.style.display = "none";
        companyFields.style.display = "block";
        registerBtn.innerHTML = '<i class="fa-solid fa-briefcase"></i> Create Recruiter Account';
    }
};

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const role = selectedRoleInput.value || "student";
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!fullName || !email || !password) {
            showToast("Please fill in all required fields.", "warning");
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters long.", "warning");
            return;
        }

        const payload = {
            fullName,
            email,
            password,
            role,
        };

        if (role === "student") {
            payload.college = document.getElementById("college").value.trim();
            payload.branch = document.getElementById("branch").value.trim();
            payload.graduationYear = document.getElementById("graduationYear").value.trim();
        } else {
            payload.companyName = document.getElementById("companyName").value.trim() || fullName;
            payload.industry = document.getElementById("industry").value.trim();
            payload.location = document.getElementById("location").value.trim();
            payload.website = document.getElementById("website").value.trim();
        }

        try {
            registerBtn.disabled = true;
            registerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            const res = await apiFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (res.ok && res.data.success) {
                setToken(res.data.token);
                setCurrentUser(res.data.user);

                showToast(`🎉 Registration Successful! Welcome, ${res.data.user.fullName}.`, "success");

                setTimeout(() => {
                    if (role === "company") {
                        window.location.href = "company-dashboard.html";
                    } else {
                        window.location.href = "dashboard.html";
                    }
                }, 1000);
            } else {
                showToast(res.data.message || "Registration failed. Please try again.", "error");
            }
        } catch (error) {
            console.error("Register Error:", error);
            showToast("Unable to connect to server. Please try again.", "error");
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = role === "company"
                ? '<i class="fa-solid fa-briefcase"></i> Create Recruiter Account'
                : '<i class="fa-solid fa-user-plus"></i> Create Student Account';
        }
    });
}