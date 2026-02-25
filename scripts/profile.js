/* ---------------------------------------------------
   PROFILE.JS — Load + Edit Profile
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const user = getCurrentUser();
    const profileContainer = document.getElementById("profileInfo");

    // Load profile
    const result = await api("getProfile", { userId: user.id });

    if (result.error) {
        profileContainer.innerHTML = "Error loading profile.";
        return;
    }

    const { user: userData, profile } = result;

    renderProfile(userData, profile, profileContainer);
    fillEditForm(profile);

    // Handle form submission
    const form = document.getElementById("editProfileForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const bio = document.getElementById("bio").value.trim();
        const location = document.getElementById("location").value.trim();
        const phone = document.getElementById("phone").value.trim();

        const updateResult = await api("updateProfile", {
            userId: user.id,
            bio,
            location,
            phone
        });

        if (updateResult.error) {
            alert(updateResult.error);
            return;
        }

        alert("Profile updated successfully!");

        // Re-render profile card
        renderProfile(userData, updateResult.profile, profileContainer);
    });
});

/* ---------------------------------------------------
   RENDER PROFILE CARD
--------------------------------------------------- */
function renderProfile(user, profile, container) {
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-row">
                <label>Name:</label>
                <span>${user.fullName}</span>
            </div>

            <div class="profile-row">
                <label>Email:</label>
                <span>${user.email}</span>
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
   FILL EDIT FORM WITH EXISTING DATA
--------------------------------------------------- */
function fillEditForm(profile) {
    document.getElementById("bio").value = profile.bio || "";
    document.getElementById("location").value = profile.location || "";
    document.getElementById("phone").value = profile.phone || "";
}