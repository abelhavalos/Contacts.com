/* ---------------------------------------------------
   AUTH.JS — Signup, Login, Session (Contacts.com)
--------------------------------------------------- */

/* 
   IMPORTANT:
   Your new login.html and signup.html do NOT use <form> tags.
   They use buttons with onclick="loginUser()" and onclick="signupUser()".
   So we remove all form listeners and expose two functions instead.
*/

/* ---------------------------------------------------
   SIGNUP
--------------------------------------------------- */
async function signupUser() {
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!fullName || !email || !password) {
        showPopup("Missing Fields", "Please fill out all fields.");
        return;
    }

    // Show loader
    const loader = document.getElementById("signupLoader");
    if (loader) loader.style.display = "flex";

    const result = await api("signup", { fullName, email, password });

    if (loader) loader.style.display = "none";

    if (result.error) {
        showPopup("Signup Failed", result.error);
        return;
    }

    saveUserSession(result.user);
    window.location.href = "dashboard.html";
}

/* ---------------------------------------------------
   LOGIN
--------------------------------------------------- */
async function loginUser() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showPopup("Missing Fields", "Please enter your email and password.");
        return;
    }

    // Show loader
    const loader = document.getElementById("loginLoader");
    if (loader) loader.style.display = "flex";

    const result = await api("login", { email, password });

    if (loader) loader.style.display = "none";

    if (result.error) {
        showPopup("Login Failed", result.error);
        return;
    }

    saveUserSession(result.user);
    window.location.href = "dashboard.html";
}

/* ---------------------------------------------------
   SESSION HELPERS
--------------------------------------------------- */
function saveUserSession(user) {
    localStorage.setItem("contact_user", JSON.stringify(user));
}

function getCurrentUser() {
    const raw = localStorage.getItem("contact_user");
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

/* ---------------------------------------------------
   LOGOUT
--------------------------------------------------- */
function logout() {
    localStorage.removeItem("contact_user");
    window.location.href = "login.html";
}

/* ---------------------------------------------------
   POPUP HELPERS (used by login/signup)
--------------------------------------------------- */
function showPopup(title, message) {
    const backdrop = document.getElementById("popupBackdrop");
    const titleEl = document.getElementById("popupTitle");
    const msgEl = document.getElementById("popupMessage");

    if (!backdrop) {
        alert(message);
        return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    backdrop.style.display = "flex";
}

function hidePopup() {
    const backdrop = document.getElementById("popupBackdrop");
    if (backdrop) backdrop.style.display = "none";
}
