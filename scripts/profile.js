/* ============================
   NAVBAR
============================ */
function toggleMenu() {
  document.getElementById("mobileMenu").classList.toggle("show");
}

function loadNavbar() {
  const nav = `
    <div class="hamburger" onclick="toggleMenu()">
      <span></span><span></span><span></span>
    </div>
    <div class="logo">Contacts<span>.</span>com</div>
    <div class="nav-links">
      <a href="dashboard.html">Dashboard</a>
      <a href="communities.html">Communities</a>
      <a href="events.html">Events</a>
      <a href="contacts.html">Contacts</a>
      <a href="profile.html" class="active">Profile</a>
      <a href="#" onclick="logout()">Logout</a>
    </div>
  `;
  document.getElementById("navbar").innerHTML = nav;

  document.getElementById("mobileMenu").innerHTML = `
    <a href="dashboard.html">Dashboard</a>
    <a href="communities.html">Communities</a>
    <a href="events.html">Events</a>
    <a href="contacts.html">Contacts</a>
    <a href="profile.html" class="active">Profile</a>
    <a href="#" onclick="logout()">Logout</a>
  `;
}

/* ============================
   POPUPS & LOADER
============================ */
function showPopup(title, message) {
  document.getElementById("popupTitle").innerText = title;
  document.getElementById("popupMessage").innerText = message;

  document.getElementById("deleteConfirmPopup").style.display = "none";
  document.getElementById("mainPopup").style.display = "block";
  document.getElementById("popupBackdrop").style.display = "flex";
}

function hidePopup() {
  document.getElementById("mainPopup").style.display = "none";
  document.getElementById("popupBackdrop").style.display = "none";
}

function showDeleteConfirm() {
  document.getElementById("mainPopup").style.display = "none";
  document.getElementById("deleteConfirmPopup").style.display = "block";
  document.getElementById("popupBackdrop").style.display = "flex";
}

function hideDeleteConfirm() {
  document.getElementById("deleteConfirmPopup").style.display = "none";
  document.getElementById("popupBackdrop").style.display = "none";
}

function showLoader(text) {
  const loader = document.getElementById("profileLoader");
  loader.querySelector(".loading-text").innerText = text;
  loader.style.display = "flex";
}

function hideLoader() {
  document.getElementById("profileLoader").style.display = "none";
}

/* ============================
   LOCAL USER
============================ */
function getLocalUser() {
  // Support both keys if you migrated
  const fromContacts = localStorage.getItem("contacts_user");
  const fromContact = localStorage.getItem("contact_user");

  const user = fromContacts ? JSON.parse(fromContacts) :
               fromContact ? JSON.parse(fromContact) : null;

  return user;
}

function setLocalUser(user) {
  localStorage.setItem("contacts_user", JSON.stringify(user));
}

/* ============================
   DOM HELPERS
============================ */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function setAvatar(src) {
  const img = document.getElementById("profileAvatar");
  if (img && src) img.src = src;
}

/* ============================
   INIT
============================ */
document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  initPasswordToggle();
  initAvatarHandler();
  loadProfile();
});

/* ============================
   LOAD PROFILE
============================ */
async function loadProfile() {
  const user = getLocalUser();
  if (!user || !user.id) {
    window.location.href = "login.html";
    return;
  }

  showLoader("Loading profile…");

  try {
    const result = await api("getProfile", { userId: user.id });

    if (!result.success) {
      hideLoader();
      showPopup("Error", result.message || "Could not load profile.");
      return;
    }

    const { user: u, profile } = result;

    // Update local user cache
    const updatedLocal = { ...user, ...u };
    setLocalUser(updatedLocal);

    // Identity
    setVal("fullNameInput", u.fullName || "");
    setVal("emailInput", u.email || "");

    // Profile details
    setVal("bioInput", profile.bio || "");
    setVal("locationInput", profile.location || "");
    setVal("phoneInput", profile.phone || "");

    // Avatar
    const avatarSrc = profile.avatar || u.avatarUrl || "default-avatar.png";
    setAvatar(avatarSrc);

    hideLoader();
  } catch (err) {
    hideLoader();
    showPopup("Network error", "Could not reach the server.");
  }
}

/* ============================
   EDITING
============================ */
function enableEditing() {
  ["fullNameInput", "emailInput", "passwordInput", "bioInput", "locationInput", "phoneInput"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });

  document.getElementById("editBtn").style.display = "none";
  document.getElementById("saveBtn").style.display = "inline-block";
  document.getElementById("cancelBtn").style.display = "inline-block";
}

function disableEditing() {
  ["fullNameInput", "emailInput", "passwordInput", "bioInput", "locationInput", "phoneInput"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });

  document.getElementById("editBtn").style.display = "inline-block";
  document.getElementById("saveBtn").style.display = "none";
  document.getElementById("cancelBtn").style.display = "none";

  // Clear password field
  setVal("passwordInput", "");
}

function cancelEditing() {
  disableEditing();
  loadProfile();
}

/* ============================
   SAVE PROFILE
============================ */
async function saveProfile() {
  const user = getLocalUser();
  if (!user || !user.id) {
    window.location.href = "login.html";
    return;
  }

  const fullName = val("fullNameInput").trim();
  const email = val("emailInput").trim();
  const password = val("passwordInput").trim();
  const bio = val("bioInput").trim();
  const location = val("locationInput").trim();
  const phone = val("phoneInput").trim();

  if (!fullName) {
    showPopup("Missing name", "Full name is required.");
    return;
  }
  if (!email) {
    showPopup("Missing email", "Email is required.");
    return;
  }

  showLoader("Saving profile…");

  try {
    // 1) Update profile details (PROFILES)
    const profileRes = await api("updateProfile", {
      userId: user.id,
      bio,
      location,
      phone
    });

    if (!profileRes.success) {
      hideLoader();
      showPopup("Update failed", profileRes.message || "Could not update profile details.");
      return;
    }

    // 2) Update identity (USERS: fullName + email)
    const identityRes = await api("updateIdentity", {
      userId: user.id,
      fullName,
      email
    });

    if (!identityRes.success) {
      hideLoader();
      showPopup("Update failed", identityRes.message || "Could not update name/email.");
      return;
    }

    // 3) Update password if provided
    if (password) {
      const passRes = await api("updatePassword", {
        userId: user.id,
        password
      });

      if (!passRes.success) {
        hideLoader();
        showPopup("Password update failed", passRes.message || "Could not update password.");
        return;
      }
    }

    // Update local cache
    const updatedLocal = {
      ...user,
      fullName,
      email
    };
    setLocalUser(updatedLocal);

    showLoader("Profile updated!");
    setTimeout(() => {
      hideLoader();
      disableEditing();
    }, 600);
  } catch (err) {
    hideLoader();
    showPopup("Network error", "Could not reach the server.");
  }
}

/* ============================
   PASSWORD TOGGLE
============================ */
function initPasswordToggle() {
  const btn = document.getElementById("togglePasswordBtn");
  const input = document.getElementById("passwordInput");
  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
    } else {
      input.type = "password";
    }
  });
}

/* ============================
   AVATAR HANDLING
============================ */
function initAvatarHandler() {
  const avatarImg = document.getElementById("profileAvatar");
  const fileInput = document.getElementById("avatarFileInput");
  const changeBtn = document.getElementById("changeAvatarBtn");

  if (!avatarImg || !fileInput || !changeBtn) return;

  avatarImg.addEventListener("click", () => fileInput.click());
  changeBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.src = e.target.result;
    };

    img.onload = () => {
      compressAndUploadAvatar(img);
    };

    reader.readAsDataURL(file);
  });
}

function compressAndUploadAvatar(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const MAX_WIDTH = 300;
  const scale = MAX_WIDTH / img.width;

  canvas.width = MAX_WIDTH;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let base64 = canvas.toDataURL("image/jpeg", 0.25);
  if (base64.length > 120000) base64 = canvas.toDataURL("image/jpeg", 0.20);
  if (base64.length > 120000) base64 = canvas.toDataURL("image/jpeg", 0.18);
  if (base64.length > 120000) base64 = canvas.toDataURL("image/jpeg", 0.15);

  setAvatar(base64);
  saveAvatar(base64);
}

async function saveAvatar(base64) {
  const user = getLocalUser();
  if (!user || !user.id) return;

  showLoader("Updating picture…");

  try {
    const res = await api("updateAvatar", {
      userId: user.id,
      avatar: base64
    });

    if (!res.success) {
      hideLoader();
      showPopup("Update failed", res.message || "Could not update picture.");
      return;
    }

    // Optionally sync avatarUrl in local user
    const updatedLocal = { ...user, avatarUrl: base64 };
    setLocalUser(updatedLocal);

    showLoader("Picture updated!");
    setTimeout(hideLoader, 600);
  } catch (err) {
    hideLoader();
    showPopup("Network error", "Could not reach the server.");
  }
}

/* ============================
   DELETE ACCOUNT
============================ */
async function confirmDeleteAccount() {
  const user = getLocalUser();
  hideDeleteConfirm();

  if (!user || !user.id) {
    showPopup("Error", "User not found. Please log in again.");
    return;
  }

  showLoader("Deleting account…");

  try {
    const res = await api("deleteAccount", { userId: user.id });

    if (!res.success) {
      hideLoader();
      showPopup("Delete failed", res.message || "Could not delete account.");
      return;
    }

    localStorage.removeItem("contacts_user");
    localStorage.removeItem("contact_user");

    showLoader("Account deleted");
    setTimeout(() => (window.location.href = "signup.html"), 700);
  } catch (err) {
    hideLoader();
    showPopup("Network error", "Could not reach the server.");
  }
}

/* ============================
   LOGOUT
============================ */
function logout() {
  localStorage.removeItem("contacts_user");
  localStorage.removeItem("contact_user");
  window.location.href = "index.html";
}
