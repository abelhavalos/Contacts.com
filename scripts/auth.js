/* ---------------------------------------------------
   AUTH.JS — Signup, Login, Session
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    /* SIGNUP */
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();

            const result = await api("signup", { fullName, email });

            if (result.error) {
                alert(result.error);
                return;
            }

            saveUserSession(result.user);
            window.location.href = "dashboard.html";
        });
    }

    /* LOGIN */
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();

            const result = await api("login", { email });

            if (result.error) {
                alert(result.error);
                return;
            }

            saveUserSession(result.user);
            window.location.href = "dashboard.html";
        });
    }
});

/* ---------------------------------------------------
   SESSION HELPERS
--------------------------------------------------- */
function saveUserSession(user) {
    localStorage.setItem("contacts_user", JSON.stringify(user));
}

function getCurrentUser() {
    const raw = localStorage.getItem("contacts_user");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
    }
}

function logout() {
    localStorage.removeItem("contacts_user");
    window.location.href = "login.html";
}