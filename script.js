console.log("Script loaded and running");

// ====== CONFIG ======
const SUPABASE_URL = "https://juinlrgyqbpssyjcuola.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aW5scmd5cWJwc3N5amN1b2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTYxNDcsImV4cCI6MjA4NDYzMjE0N30.6Q28mR-MAsD0mJIEXT2uFVGzBX6hECJZDN3Nq_70i2I";

// ====== CREATE CLIENT ======
const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase client created");

// ====== LOGIN HANDLER ======
const form = document.getElementById("loginForm");

if (!form) {
    console.error("Login form not found");
} else {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }

        console.log("Attempting login for:", email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("Login error:", error);
            alert("Login failed: " + error.message);
            return;
        }

        console.log("Login success:", data);

        // Redirect to dashboard
        window.location.href = "dashboard.html";
    });
}
