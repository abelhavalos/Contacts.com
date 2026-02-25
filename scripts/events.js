/* ---------------------------------------------------
   EVENTS.JS — Load, render, create, delete, contact
--------------------------------------------------- */

requireAuth();
const user = getCurrentUser();

/* ---------------------------------------------------
   INITIAL LOAD
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
    setupImagePicker();
});

/* ---------------------------------------------------
   LOAD EVENTS
--------------------------------------------------- */
async function loadEvents() {
    const grid = document.getElementById("eventsGrid");
    if (!grid) return;

    grid.innerHTML = `<div class="empty-state">Loading events…</div>`;

    const result = await api("getEvents");

    if (result.error) {
        grid.innerHTML = `<div class="empty-state">Error loading events.</div>`;
        return;
    }

    const events = result.events || [];

    renderEvents(events);
}

/* ---------------------------------------------------
   RENDER EVENT CARDS
--------------------------------------------------- */
function renderEvents(list) {
    const grid = document.getElementById("eventsGrid");

    if (!list.length) {
        grid.innerHTML = `<div class="empty-state">No events available.</div>`;
        return;
    }

    grid.innerHTML = list
        .map((e) => {
            const img = e.eventPicture
                ? `data:image/jpeg;base64,${e.eventPicture}`
                : "https://via.placeholder.com/300x180?text=No+Image";

            return `
                <div class="card">

                    <h3>${e.title}</h3>

                    <img class="event-card-image" src="${img}" alt="Event Image">

                    <p>${e.description || ""}</p>

                    <p class="muted">Created by ${e.creatorName || "Unknown"}</p>

                    <div class="event-actions">
                        ${
                            e.creatorId === user.id
                                ? `<button class="delete-btn" onclick="deleteEvent('${e.id}')">Delete</button>`
                                : `<button class="btn-primary" onclick="contactEventCreator('${e.creatorId}', '${e.creatorName}', '${e.title}')">Contact Me</button>`
                        }
                    </div>

                </div>
            `;
        })
        .join("");
}

/* ---------------------------------------------------
   CONTACT EVENT CREATOR → private chat
--------------------------------------------------- */
function contactEventCreator(creatorId, creatorName, eventTitle) {
    const profile = {
        id: creatorId,
        fullName: creatorName,
        context: `Event: ${eventTitle}`
    };

    localStorage.setItem("private_chat_user", JSON.stringify(profile));

    window.location.href = `messages.html?otherId=${encodeURIComponent(creatorId)}`;
}

/* ---------------------------------------------------
   OPEN/CLOSE CREATE EVENT POPUP
--------------------------------------------------- */
function openCreateEventPopup() {
    document.getElementById("createEventBackdrop").style.display = "flex";
}

function closeCreateEventPopup() {
    document.getElementById("createEventBackdrop").style.display = "none";
}

/* ---------------------------------------------------
   IMAGE PICKER
--------------------------------------------------- */
function setupImagePicker() {
    const picker = document.getElementById("eventImagePicker");
    const input = document.getElementById("eventImageInput");

    if (!picker || !input) return;

    picker.onclick = () => input.click();

    input.onchange = () => {
        if (input.files.length > 0) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                document.getElementById("eventImagePreview").src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };
}

/* ---------------------------------------------------
   SUBMIT NEW EVENT
--------------------------------------------------- */
async function submitEvent() {
    const title = document.getElementById("eventTitle").value.trim();
    const description = document.getElementById("eventDescription").value.trim();
    const imageInput = document.getElementById("eventImageInput");

    if (!title) {
        showMessage("Missing Title", "Please enter an event title.");
        return;
    }

    let base64Image = "";
    if (imageInput.files.length > 0) {
        base64Image = await fileToBase64(imageInput.files[0]);
    }

    const result = await api("createEvent", {
        userId: user.id,
        title,
        description,
        eventPicture: base64Image
    });

    if (result.error) {
        showMessage("Error", result.error);
        return;
    }

    closeCreateEventPopup();
    loadEvents();
}

/* ---------------------------------------------------
   DELETE EVENT (creator only)
--------------------------------------------------- */
async function deleteEvent(eventId) {
    const result = await api("deleteEvent", { eventId });

    if (result.error) {
        showMessage("Error", result.error);
        return;
    }

    loadEvents();
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
