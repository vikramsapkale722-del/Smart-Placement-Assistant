// ==========================================
// LOGIN LOGIC & AUTHENTICATION
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

// Prevent authenticated users from staying on login page
redirectIfAuthenticated();

const loginForm = document.getElementById("loginForm");
const submitBtn = document.getElementById("loginSubmitBtn");

// Quick Demo Fill Helper
window.fillDemo = function (role) {
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");

    if (role === "student") {
        emailEl.value = "vedant@student.edu";
        passEl.value = "student123";
        showToast("Student demo credentials filled!", "info");
    } else if (role === "company") {
        emailEl.value = "recruiter@google.com";
        passEl.value = "company123";
        showToast("Recruiter demo credentials filled!", "info");
    } else if (role === "admin") {
        emailEl.value = "admin@placement.edu";
        passEl.value = "admin123";
        showToast("Admin demo credentials filled!", "info");
    }
};

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showToast("Please fill in both email and password.", "warning");
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

        const res = await apiFetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        if (res.ok && res.data.success) {
            setToken(res.data.token);
            setCurrentUser(res.data.user);

            const role = res.data.user.role || "student";
            showToast(`✅ Welcome, ${res.data.user.fullName || "User"}!`, "success");

            setTimeout(() => {
                if (role === "admin") {
                    window.location.href = "admin-dashboard.html";
                } else if (role === "company") {
                    window.location.href = "company-dashboard.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            }, 800);
        } else {
            showToast(res.data.message || "Invalid email or password.", "error");
        }
    } catch (error) {
        console.error("Login submission error:", error);
        showToast("Server connection error. Please try again.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
    }
});