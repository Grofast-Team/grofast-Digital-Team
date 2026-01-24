// Load Supabase library dynamically
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload = initSupabase;
document.head.appendChild(script);

function initSupabase() {
    const SUPABASE_URL = "https://juinlrgyqbpssyjcuola.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aW5scmd5cWJwc3N5amN1b2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTYxNDcsImV4cCI6MjA4NDYzMjE0N30.6Q28mR-MAsD0mJIEXT2uFVGzBX6hECJZDN3Nq_70i2I";

    const supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    const form = document.getElementById("loginForm");

    if (!form) {
        alert("Login form not found. Check form ID.");
        return;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert("Login failed: " + error.message);
            return;
        }

        // Login successful
        window.location.href = "dashboard.html";
    });
}
