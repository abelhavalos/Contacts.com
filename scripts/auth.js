// ===============================
// AUTH HELPERS
// ===============================

// Save user session
function saveUserSession(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

// Load user session
function getUserSession() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Logout
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ===============================
// SIGNUP
// ===============================
async function handleSignup(e) {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await api("signup", {
      fullName,
      email,
      password,
      avatarUrl: ""
    });

    saveUserSession(res.user);
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
}

// ===============================
// LOGIN
// ===============================
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await api("login", { email, password });

    saveUserSession(res.user);
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
}
