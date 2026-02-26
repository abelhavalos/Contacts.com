/* ---------------------------------------------------
   PROFILE.JS — Load + Edit Profile
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const user = getCurrentUser();
    if (!user || !user.id) {
        console.error("No logged-in user found.");
        return;
    }

    const profileContainer = document.getElementById("profileInfo");
    const form = document.getElementById("editProfileForm");

    if (!profileContainer) {
        console.error("profileInfo container missing in DOM.");
        return;
    }
    if (!form) {
        console.error("editProfileForm missing in DOM.");
        return;
    }

    // Load profile
    const result = await api("getProfile", { userId: user.id });

    if (result.error) {
        profileContainer.innerHTML = "Error loading profile.";
        return;
    }

    const { user: userData, profile } = result;

    // Render profile card
    renderProfile(userData, profile, profileContainer);

    // Fill edit form
    fillEditForm(profile);

    /* ---------------------------------------------------
       HANDLE PROFILE UPDATE
    --------------------------------------------------- */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const bio = document.getElementById("bio")?.value.trim() || "";
        const location = document.getElementById("location")?.value.trim() || "";
        const phone = document.getElementById("phone")?.value.trim() || "";

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

        // Re-render profile card with updated data
        renderProfile(userData, updateResult.profile, profileContainer);
    });
});

/* ---------------------------------------------------
   RENDER PROFILE CARD
--------------------------------------------------- */
function renderProfile(user, profile, container) {
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-row">
                <label>Name:</label>
                <span>${user.fullName || ""}</span>
            </div>

            <div class="profile-row">
                <label>Email:</label>
                <span>${user.email || ""}</span>
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
    if (!profile) return;

    const bioEl = document.getElementById("bio");
    const locationEl = document.getElementById("location");
    const phoneEl = document.getElementById("phone");

    if (bioEl) bioEl.value = profile.bio || "";
    if (locationEl) locationEl.value = profile.location || "";
    if (phoneEl) phoneEl.value = profile.phone || "";
}
