const SUPABASE_URL = "https://juinlrgyqbpssyjcuola.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aW5scmd5cWJwc3N5amN1b2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTYxNDcsImV4cCI6MjA4NDYzMjE0N30.6Q28mR-MAsD0mJIEXT2uFVGzBX6hECJZDN3Nq_70i2I";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    // Store session
    localStorage.setItem("session", JSON.stringify(data.session));

    window.location.href = "dashboard.html";
}
