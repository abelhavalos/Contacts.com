/* ---------------------------------------------------
   EVENTS.JS — Load and render events
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const container = document.getElementById("eventList");
    if (!container) return;

    container.innerHTML = "Loading events...";

    const result = await api("getEvents");

    if (result.error) {
        container.innerHTML = "Error loading events.";
        return;
    }

    renderEvents(result.events || [], container);
});

/* ---------------------------------------------------
   RENDER EVENT CARDS
--------------------------------------------------- */
function renderEvents(list, container) {
    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">No events available.</div>
        `;
        return;
    }

    container.innerHTML = list.map(e => `
        <div class="card">
            <h3>${e.title}</h3>
            <p>${e.description || ""}</p>
            <p><strong>Date:</strong> ${e.date || ""}</p>
            <p><strong>Location:</strong> ${e.location || ""}</p>
        </div>
    `).join("");
}