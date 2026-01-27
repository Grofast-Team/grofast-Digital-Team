/**
 * Grofast Team Authentication System
 * Production-ready authentication with role-based access
 */

// ========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_URL = "https://juinlrgyqbpssyjcuola.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aW5scmd5cWJwc3N5amN1b2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTYxNDcsImV4cCI6MjA4NDYzMjE0N30.6Q28mR-MAsD0mJIEXT2uFVGzBX6hECJZDN3Nq_70i2I";

// Use 'client' instead of 'supabase' to avoid conflicts with CDN
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// UI HELPERS
// ========================================
function showLoading(button, text = "Processing...") {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.classList.add("loading");
}

function hideLoading(button) {
    button.disabled = false;
    button.textContent = button.dataset.originalText || "Submit";
    button.classList.remove("loading");
}

function showError(message) {
    // Remove any existing error
    const existingError = document.querySelector(".error-message");
    if (existingError) existingError.remove();

    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `<span class="error-icon">⚠️</span> ${message}`;

    const form = document.getElementById("loginForm") || document.getElementById("resetForm");
    if (form) {
        form.insertBefore(errorDiv, form.firstChild);
    }

    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const existingSuccess = document.querySelector(".success-message");
    if (existingSuccess) existingSuccess.remove();

    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.innerHTML = `<span class="success-icon">✓</span> ${message}`;

    const form = document.getElementById("loginForm") || document.getElementById("resetForm");
    if (form) {
        form.insertBefore(successDiv, form.firstChild);
    }
}

// ========================================
// LOGIN HANDLER
// ========================================
async function handleLogin(e) {
    e.preventDefault();

    const submitBtn = document.querySelector(".login-btn");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showError("Please enter both email and password.");
        return;
    }

    showLoading(submitBtn, "Signing in...");

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            hideLoading(submitBtn);
            showError(error.message);
            return;
        }

        // Store session
        localStorage.setItem("session", JSON.stringify(data.session));

        // Redirect to dashboard
        window.location.href = "dashboard.html";

    } catch (err) {
        hideLoading(submitBtn);
        showError("An unexpected error occurred. Please try again.");
        console.error("Login error:", err);
    }
}

// ========================================
// FORGOT PASSWORD HANDLER
// ========================================
async function handleForgotPassword(e) {
    e.preventDefault();

    const email = prompt("Enter your email address to receive a password reset link:");

    if (!email || !email.includes("@")) {
        if (email !== null) {
            showError("Please enter a valid email address.");
        }
        return;
    }

    try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) {
            showError(error.message);
            return;
        }

        showSuccess("Password reset link sent! Check your email inbox.");
    } catch (err) {
        showError("Failed to send reset email. Please try again.");
        console.error("Password reset error:", err);
    }
}

// ========================================
// INITIALIZE PAGE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in
    checkExistingSession();

    // Attach login form handler
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    // Attach forgot password handler
    const forgotPasswordLink = document.querySelector(".forgot-password");
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", handleForgotPassword);
    }
});

// Check if user is already logged in
async function checkExistingSession() {
    const sessionStr = localStorage.getItem("session");

    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);

            // Verify the session is still valid
            const { data, error } = await client.auth.getUser(session.access_token);

            if (data?.user && !error) {
                window.location.href = "dashboard.html";
            } else {
                // Clear invalid session
                localStorage.removeItem("session");
            }
        } catch {
            localStorage.removeItem("session");
        }
    }
}
