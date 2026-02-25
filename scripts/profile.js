/* ---------------------------------------------------
   PROFILE.JS — Contacts.com Profile System
--------------------------------------------------- */

requireAuth();
const user = getCurrentUser();

let originalAvatar = ""; // stored so we don't overwrite avatar accidentally

/* ---------------------------------------------------
   INITIAL LOAD
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    setupAvatarPicker();
});

/* ---------------------------------------------------
   LOAD PROFILE
--------------------------------------------------- */
async function loadProfile() {
    showLoader(true);

    const res = await api("getProfile", { userId: user.id });

    showLoader(false);

    if (res.error) {
        showPopup("Error", res.error);
        return;
    }

    const { user: userData, profile } = res;

    // Fill header
    document.getElementById("fullNameDisplay").textContent = userData.fullName || "";
    document.getElementById("locationDisplay").textContent = profile.location || "City, State";

    // Avatar
    const avatar = profile.avatar
        ? `data:image/jpeg;base64,${profile.avatar}`
        : "images/default-avatar.png";

    document.getElementById("profilePicPreview").src = avatar;
    originalAvatar = profile.avatar || "";

    // Fill editable fields
    document.getElementById("about").value = profile.bio || "";
    document.getElementById("location").value = profile.location || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("phone").value = profile.phone || "";

    disableEditing();
}

/* ---------------------------------------------------
   ENABLE / DISABLE EDITING
--------------------------------------------------- */
function enableEditing() {
    document.getElementById("about").disabled = false;
    document.getElementById("location").disabled = false;
    document.getElementById("email").disabled = false;
    document.getElementById("phone").disabled = false;

    document.getElementById("editBtn").style.display = "none";
    document.getElementById("saveBtn").style.display = "block";
}

function disableEditing() {
    document.getElementById("about").disabled = true;
    document.getElementById("location").disabled = true;
    document.getElementById("email").disabled = true;
    document.getElementById("phone").disabled = true;

    document.getElementById("editBtn").style.display = "block";
    document.getElementById("saveBtn").style.display = "none";
}

/* ---------------------------------------------------
   AVATAR PICKER
--------------------------------------------------- */
function setupAvatarPicker() {
    const preview = document.getElementById("profilePicPreview");
    const fileInput = document.getElementById("profilePicFileInput");

    preview.onclick = () => fileInput.click();

    fileInput.onchange = () => {
        if (fileInput.files.length === 0) return;

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            preview.src = reader.result;
        };

        reader.readAsDataURL(file);
    };
}

/* ---------------------------------------------------
   SAVE PROFILE
--------------------------------------------------- */
async function saveProfile() {
    showLoader(true);

    const bio = document.getElementById("about").value.trim();
    const location = document.getElementById("location").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    const fileInput = document.getElementById("profilePicFileInput");

    let avatarBase64 = originalAvatar;

    if (fileInput.files.length > 0) {
        avatarBase64 = await fileToBase64(fileInput.files[0]);
    }

    // Update profile sheet
    const res = await api("updateProfile", {
        userId: user.id,
        bio,
        location,
        phone,
        avatar: avatarBase64
    });

    // Update email if changed
    if (!res.error && email !== user.email) {
        await api("updateEmail", { userId: user.id, newEmail: email });
    }

    showLoader(false);

    if (res.error) {
        showPopup("Error", res.error);
        return;
    }

    showPopup("Success", "Profile updated successfully.");
    loadProfile();
}

/* ---------------------------------------------------
   DELETE PROFILE
--------------------------------------------------- */
function showDeleteConfirm() {
    document.getElementById("popupBackdrop").style.display = "flex";
    document.getElementById("deleteConfirmPopup").style.display = "block";
}

function hideDeleteConfirm() {
    document.getElementById("popupBackdrop").style.display = "none";
    document.getElementById("deleteConfirmPopup").style.display = "none";
}

async function confirmDeleteAccount() {
    showLoader(true);

    const res = await api("deleteAccount", { userId: user.id });

    showLoader(false);

    if (res.error) {
        showPopup("Error", res.error);
        return;
    }

    localStorage.removeItem("contact_user");
    window.location.href = "signup.html";
}

/* ---------------------------------------------------
   POPUPS
--------------------------------------------------- */
function showPopup(title, message) {
    document.getElementById("popupTitle").textContent = title;
    document.getElementById("popupMessage").textContent = message;

    document.getElementById("popupBackdrop").style.display = "flex";
    document.getElementById("mainPopup").style.display = "block";
}

function hidePopup() {
    document.getElementById("popupBackdrop").style.display = "none";
    document.getElementById("mainPopup").style.display = "none";
}

/* ---------------------------------------------------
   LOADER
--------------------------------------------------- */
function showLoader(show) {
    document.getElementById("profileLoader").style.display = show ? "flex" : "none";
}

/* ---------------------------------------------------
   FILE → BASE64
--------------------------------------------------- */
function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
    });
}
