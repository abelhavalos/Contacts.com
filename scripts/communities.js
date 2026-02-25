/* ---------------------------------------------------
   COMMUNITIES.JS — Load, render, create, join
--------------------------------------------------- */

requireAuth();
const user = getCurrentUser();

/* ---------------------------------------------------
   INITIAL LOAD
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadCommunities();
});

/* ---------------------------------------------------
   LOAD COMMUNITIES
--------------------------------------------------- */
async function loadCommunities() {
    const grid = document.getElementById("communityGrid");
    if (!grid) return;

    grid.innerHTML = `<div class="empty-state">Loading communities…</div>`;

    const result = await api("getCommunities");

    if (result.error) {
        grid.innerHTML = `<div class="empty-state">Error loading communities.</div>`;
        return;
    }

    const communities = result.communities || [];

    // Render
    renderCommunities(communities);
}

/* ---------------------------------------------------
   RENDER COMMUNITY CARDS
--------------------------------------------------- */
function renderCommunities(list) {
    const grid = document.getElementById("communityGrid");

    if (!list.length) {
        grid.innerHTML = `<div class="empty-state">No communities yet.</div>`;
        return;
    }

    grid.innerHTML = list
        .map((c) => {
            return `
                <div class="card">
                    <img src="${c.image || 'https://via.placeholder.com/300x180?text=Community'}"
                         class="community-card-image">

                    <h3>${c.name}</h3>
                    <p>${c.description || ""}</p>

                    <button class="btn-primary" onclick="openCommunity('${c.id}')">
                        Open
                    </button>
                </div>
            `;
        })
        .join("");
}

/* ---------------------------------------------------
   OPEN COMMUNITY → messages.html
--------------------------------------------------- */
function openCommunity(communityId) {
    window.location.href = `messages.html?community=${communityId}`;
}

/* ---------------------------------------------------
   CREATE COMMUNITY POPUP
--------------------------------------------------- */
function openCreateCommunityPopup() {
    document.getElementById("createCommunityBackdrop").style.display = "flex";
}

function closeCreateCommunityPopup() {
    document.getElementById("createCommunityBackdrop").style.display = "none";
}

/* ---------------------------------------------------
   SUBMIT NEW COMMUNITY
--------------------------------------------------- */
async function submitCommunity() {
    const title = document.getElementById("communityTitle").value.trim();
    const description = document.getElementById("communityDescription").value.trim();
    const imageInput = document.getElementById("communityImageInput");

    if (!title) {
        showMessage("Missing Name", "Please enter a community name.");
        return;
    }

    let base64Image = "";
    if (imageInput.files.length > 0) {
        base64Image = await fileToBase64(imageInput.files[0]);
    }

    const result = await api("createCommunity", {
        userId: user.id,
        name: title,
        description,
        image: base64Image
    });

    if (result.error) {
        showMessage("Error", result.error);
        return;
    }

    closeCreateCommunityPopup();
    loadCommunities();
}

/* ---------------------------------------------------
   DELETE COMMUNITY (Admin Only)
--------------------------------------------------- */
async function deleteCommunity(id) {
    const result = await api("deleteCommunity", { communityId: id });

    if (result.error) {
        showMessage("Error", result.error);
        return;
    }

    loadCommunities();
}

/* ---------------------------------------------------
   IMAGE PICKER → BASE64
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
