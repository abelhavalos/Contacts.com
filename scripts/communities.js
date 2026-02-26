/* ---------------------------------------------------
   COMMUNITIES.JS — Load and render communities
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const user = getCurrentUser();
    const container = document.getElementById("communityList");
    if (!container) return;

    container.innerHTML = "Loading communities...";

    // Fetch all communities
    const result = await api("getCommunities");

    if (result.error) {
        container.innerHTML = "Error loading communities.";
        return;
    }

    const communities = result.communities || [];

    // Fetch membership for each community
    const enriched = await Promise.all(
        communities.map(async (c) => {
            const members = await api("getCommunityMembers", { communityId: c.id });

            return {
                ...c,
                members: members.members || [],
                isMember: members.members?.some(m => m.userId === user.id)
            };
        })
    );

    renderCommunities(enriched, container, user);
});

/* ---------------------------------------------------
   RENDER COMMUNITY CARDS
--------------------------------------------------- */
function renderCommunities(list, container, user) {
    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">No communities yet.</div>
        `;
        return;
    }

    container.innerHTML = list.map(c => {
        const memberCount = c.members.length;

        return `
            <div class="card community-card">

                <h3>${c.name}</h3>
                <p>${c.description || ""}</p>

                <p class="muted">${memberCount} member${memberCount === 1 ? "" : "s"}</p>

                <div class="community-actions">
                    ${
                        c.isMember
                            ? `<button class="secondary" onclick="enterCommunity('${c.id}')">Enter</button>`
                            : `<button onclick="joinCommunity('${c.id}')">Join</button>`
                    }
                </div>

            </div>
        `;
    }).join("");
}

/* ---------------------------------------------------
   JOIN COMMUNITY
--------------------------------------------------- */
async function joinCommunity(communityId) {
    const user = getCurrentUser();

    const result = await api("joinCommunity", {
        userId: user.id,
        communityId
    });

    if (result.error) {
        alert(result.error);
        return;
    }

    // Reload page to update membership state
    location.reload();
}

/* ---------------------------------------------------
   ENTER COMMUNITY CHAT
--------------------------------------------------- */
function enterCommunity(communityId) {
    window.location.href = `messages.html?community=${communityId}`;
}
