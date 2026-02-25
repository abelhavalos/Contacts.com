/* ---------------------------------------------------
   EVENTS.JS — Load and render events
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const user = getCurrentUser();
    const container = document.getElementById("eventList");
    if (!container) return;

    container.innerHTML = "Loading events...";

    const result = await api("getEvents");

    if (result.error) {
        container.innerHTML = "Error loading events.";
        return;
    }

    const events = result.events || [];

    // Enrich events with creator profile
    const enriched = await Promise.all(
        events.map(async (ev) => {
            const creator = await api("getUser", { userId: ev.creator });
            return {
                ...ev,
                creatorName: creator?.user?.fullName || "Unknown",
                creatorAvatar: creator?.user?.avatarUrl || ""
            };
        })
    );

    renderEvents(enriched, container, user);
});

/* ---------------------------------------------------
   RENDER EVENT CARDS
--------------------------------------------------- */
function renderEvents(list, container, user) {
    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">No events available.</div>
        `;
        return;
    }

    container.innerHTML = list.map(e => {
        const img = e.eventPicture || "";
        const initials = e.creatorName
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase();

        return `
            <div class="card event-card">

                <h3>${e.title}</h3>

                <div class="event-image">
                    ${img
                        ? `<img src="${img}" alt="Event Image">`
                        : `<div class="event-image-fallback">No Image</div>`
                    }
                </div>

                <p>${e.description || ""}</p>

                <div class="event-creator">
                    <div class="avatar">
                        ${
                            e.creatorAvatar
                                ? `<img src="${e.creatorAvatar}" alt="Avatar">`
                                : `<div class="avatar-fallback">${initials}</div>`
                        }
                    </div>
                    <span>Created by ${e.creatorName}</span>
                </div>

                <div class="event-actions">
                    ${
                        e.creator === user.id
                            ? `<button class="danger" onclick="deleteEvent('${e.id}')">Delete Event</button>`
                            : `<button onclick="contactCreator('${e.creator}')">Contact Me</button>`
                    }
                </div>

            </div>
        `;
    }).join("");
}

/* ---------------------------------------------------
   CONTACT CREATOR
--------------------------------------------------- */
function contactCreator(userId) {
    window.location.href = `messages.html?user=${userId}`;
}

/* ---------------------------------------------------
   DELETE EVENT (creator only)
--------------------------------------------------- */
async function deleteEvent(eventId) {
    if (!confirm("Delete this event?")) return;

    const result = await api("deleteEvent", { eventId });

    if (result.error) {
        alert(result.error);
        return;
    }

    location.reload();
}
