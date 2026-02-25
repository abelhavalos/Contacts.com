/* ---------------------------------------------------
   PROFILE.JS — Load, render, edit, update profile
--------------------------------------------------- */

requireAuth();
const user = getCurrentUser();

/* ---------------------------------------------------
   INITIAL LOAD
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    setupProfileImagePicker();
});

/* ---------------------------------------------------
   LOAD PROFILE FROM BACKEND
--------------------------------------------------- */
async function loadProfile() {
    const container = document.getElementById("profileInfo");

    if (!container) return;

    container.innerHTML = `<div class="empty-state">Loading profile…</div>`;

    const result = await api("getProfile", { userId: user.id });

    if (result.error) {
        container.innerHTML = `<div class="empty-state">Error loading profile.</div>`;
        return;
    }

    const { user: userData, profile } = result;

    renderProfile(userData, profile);
    fillEditForm(profile);
}

/* ---------------------------------------------------
   RENDER PROFILE CARD
--------------------------------------------------- */
function renderProfile(userData, profile) {
    const container = document.getElementById("profileInfo");
    if (!container) return;

    const avatar = userData.avatarUrl
        ? `data:image/jpeg;base64,${userData.avatarUrl}`
        : "images/default-avatar.png";

    container.innerHTML = `
        <div class="profile-card">

            <div class="profile-avatar-wrapper">
                <img id="profileAvatar" class="profile-avatar" src="${avatar}">
            </div>

            <div class="profile-row">
                <label>Name:</label>
                <span>${userData.fullName || ""}</span>
            </div>

            <div class="profile-row">
                <label>Email:</label>
                <span>${userData.email || ""}</span>
            </div>

            <div class="profile-row">
                <label>Bio:</label>
                <span>${profile.bio || ""}</span>
            </div>

            <div class="profile-row">
                <label>Location:</label>
                <span>${profile.location || ""}</span>
            </div>

            <div class="profile-row">
                <label>Phone:</label>
                <span>${profile.phone || ""}</span>
            </div>

        </div>
    `;
}

/* ---------------------------------------------------
   FILL EDIT FORM
--------------------------------------------------- */
function fillEditForm(profile) {
    document.getElementById("bio").value = profile.bio || "";
    document.getElementById("location").value = profile.location || "";
    document.getElementById("phone").value = profile.phone || "";
}

/* ---------------------------------------------------
   PROFILE IMAGE PICKER
--------------------------------------------------- */
function setupProfileImagePicker() {
    const picker = document.getElementById("profileImagePicker");
    const input = document.getElementById("profileImageInput");

    if (!picker || !input) return;

    picker.onclick = () => input.click();

    input.onchange = () => {
        if (input.files.length > 0) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                document.getElementById("profileAvatarPreview").src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };
}

/* ---------------------------------------------------
   SAVE PROFILE
--------------------------------------------------- */
async function saveProfile() {
    const bio = document.getElementById("bio").value.trim();
    const location = document.getElementById("location").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const imageInput = document.getElementById("profileImageInput");

    let base64Image = "";
    if (imageInput.files.length > 0) {
        base64Image = await fileToBase64(imageInput.files[0]);
    }

    const result = await api("updateProfile", {
        userId: user.id,
        bio,
        location,
        phone,
        avatar: base64Image
    });

    if (result.error) {
        showMessage("Error", result.error);
        return;
    }

    showMessage("Success", "Profile updated successfully.");
    loadProfile();
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

/* ---------------------------------------------------
   UNIVERSAL POPUP
--------------------------------------------------- */
function showMessage(title, text) {
    const backdrop = document.getElementById("messageBackdrop");
    document.getElementById("messageTitle").textContent = title;
    document.getElementById("messageText").textContent = text;
    backdrop.style.display = "flex";
}

function hideMessagePopup() {
    document.getElementById("messageBackdrop").style.display = "none";
}
