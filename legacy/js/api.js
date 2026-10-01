// ==========================================
// SMART PLACEMENT ASSISTANT - CLIENT API CORE
// Developer: Vedant Patil
// ==========================================

(function () {
    // Dynamic API Base URL
    // If opened via Express server (port 5000), use relative path ""
    // If opened via Live Server (port 5500, 3000, etc.) or file://, use http://localhost:5000
    const isExpress = window.location.port === "5000";
    window.API_BASE = isExpress ? "" : "http://localhost:5000";

    // ------------------------------------------
    // Session & Auth Helpers
    // ------------------------------------------
    window.getToken = function () {
        return localStorage.getItem("token") || null;
    };

    window.setToken = function (token) {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    };

    window.getCurrentUser = function () {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error("Failed to parse stored user", e);
            return null;
        }
    };

    window.setCurrentUser = function (user) {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        } else {
            localStorage.removeItem("user");
        }
    };

    window.logout = function (confirmPrompt = true) {
        if (confirmPrompt) {
            if (!confirm("Are you sure you want to log out?")) return;
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("appliedJobs");
        window.location.href = "login.html";
    };

    // ------------------------------------------
    // Route Guard & Role Authorization
    // ------------------------------------------
    window.requireAuth = function (allowedRoles = []) {
        const token = window.getToken();
        const user = window.getCurrentUser();

        if (!token || !user) {
            window.location.href = "login.html";
            return null;
        }

        const role = user.role || "student";

        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            sessionStorage.setItem("spa_role_notice", `Access restricted. Redirected to your ${role.toUpperCase()} dashboard.`);
            // Redirect to appropriate dashboard based on role
            if (role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else if (role === "company") {
                window.location.href = "company-dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }
            return null;
        }

        return user;
    };

    // Auto-display role notice if redirected
    document.addEventListener("DOMContentLoaded", () => {
        const notice = sessionStorage.getItem("spa_role_notice");
        if (notice) {
            sessionStorage.removeItem("spa_role_notice");
            setTimeout(() => {
                if (typeof window.showToast === "function") {
                    window.showToast(notice, "warning");
                }
            }, 500);
        }
    });

    // Prevent logged-in users from staying on login/register pages
    window.redirectIfAuthenticated = function () {
        const token = window.getToken();
        const user = window.getCurrentUser();
        if (token && user) {
            const role = user.role || "student";
            if (role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else if (role === "company") {
                window.location.href = "company-dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }
        }
    };

    // ------------------------------------------
    // Centralized API Request Wrapper
    // ------------------------------------------
    window.apiFetch = async function (endpoint, options = {}) {
        const token = window.getToken();
        const headers = options.headers ? { ...options.headers } : {};

        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }

        // Set Content-Type to JSON unless sending FormData
        if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const url = endpoint.startsWith("http") ? endpoint : `${window.API_BASE}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Handle unauthorized (expired/invalid token)
            if (response.status === 401) {
                console.warn("Session expired or unauthorized");
                // Don't auto-redirect on public endpoints like login/register
                if (!endpoint.includes("/api/auth/login") && !endpoint.includes("/api/auth/register")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "login.html";
                }
            }

            const data = await response.json();
            return {
                ok: response.ok,
                status: response.status,
                data,
            };
        } catch (error) {
            console.error("Network / API error:", error);
            return {
                ok: false,
                status: 0,
                data: {
                    success: false,
                    message: "Unable to connect to the server. Please ensure the backend is running.",
                },
            };
        }
    };

    // ------------------------------------------
    // Dynamic Profile Completion Calculation
    // ------------------------------------------
    window.calculateProfileCompletion = function (user) {
        if (!user) return 0;
        const trackedFields = [
            "fullName",
            "email",
            "phone",
            "college",
            "degree",
            "branch",
            "graduationYear",
            "cgpa",
            "skills",
            "projects",
            "certifications",
            "experience",
            "github",
            "linkedin"
        ];

        let completed = 0;
        trackedFields.forEach(field => {
            const val = user[field];
            if (Array.isArray(val) && val.length > 0) {
                completed++;
            } else if (typeof val === "string" && val.trim().length > 0) {
                completed++;
            } else if (typeof val === "number" && !isNaN(val) && val > 0) {
                completed++;
            }
        });

        return Math.round((completed / trackedFields.length) * 100);
    };

    // ------------------------------------------
    // Toast Notification System
    // ------------------------------------------
    window.showToast = function (message, type = "info") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "99999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "10px";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `spa-toast spa-toast-${type}`;

        let icon = "fa-circle-info";
        let bg = "#2563EB";
        if (type === "success") {
            icon = "fa-circle-check";
            bg = "#10B981";
        } else if (type === "error") {
            icon = "fa-circle-exclamation";
            bg = "#EF4444";
        } else if (type === "warning") {
            icon = "fa-triangle-exclamation";
            bg = "#F59E0B";
        }

        toast.style.background = bg;
        toast.style.color = "#FFFFFF";
        toast.style.padding = "12px 18px";
        toast.style.borderRadius = "8px";
        toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.18)";
        toast.style.fontFamily = "'Inter', sans-serif";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "500";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.gap = "10px";
        toast.style.maxWidth = "360px";
        toast.style.animation = "slideInRight 0.3s ease";

        toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            toast.style.transition = "0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };
})();
