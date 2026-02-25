/* ---------------------------------------------------
   COMMUNITIES.JS — Load and render communities
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const container = document.getElementById("communityList");
    if (!container) return;

    container.innerHTML = "Loading communities...";

    const result = await api("getCommunities");

    if (result.error) {
        container.innerHTML = "Error loading communities.";
        return;
    }

    renderCommunities(result.communities || [], container);
});

/* ---------------------------------------------------
   RENDER COMMUNITY CARDS
--------------------------------------------------- */
function renderCommunities(list, container) {
    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">No communities yet.</div>
        `;
        return;
    }

    container.innerHTML = list.map(c => `
        <div class="card">
            <h3>${c.name}</h3>
            <p>${c.description || ""}</p>
        </div>
    `).join("");
}