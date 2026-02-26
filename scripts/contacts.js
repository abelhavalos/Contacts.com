/* ---------------------------------------------------
   CONTACTS.JS — Load and render contacts
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const user = getCurrentUser();
    const container = document.getElementById("contactsList");
    if (!container) return;

    container.innerHTML = "Loading contacts...";

    // Fetch contacts for this user
    const result = await api("getContacts", { userId: user.id });

    if (result.error) {
        container.innerHTML = "Error loading contacts.";
        return;
    }

    const contacts = result.contacts || [];

    // Remove yourself from the list
    const filtered = contacts.filter(c => c.contactId !== user.id);

    renderContacts(filtered, container);
});

/* ---------------------------------------------------
   RENDER CONTACT CARDS
--------------------------------------------------- */
function renderContacts(list, container) {
    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">You have no contacts yet.</div>
        `;
        return;
    }

    container.innerHTML = list.map(c => {
        const avatar = c.avatarUrl || "";
        const initials = c.fullName
            ? c.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
            : "?";

        return `
            <div class="card contact-card">

                <div class="avatar">
                    ${avatar
                        ? `<img src="${avatar}" alt="Avatar">`
                        : `<div class="avatar-fallback">${initials}</div>`
                    }
                </div>

                <h3>${c.fullName || "Unknown"}</h3>
                <p>${c.email || ""}</p>

                <div class="contact-actions">
                    <button onclick="viewProfile('${c.contactId}')">View Profile</button>
                    <button onclick="messageUser('${c.contactId}')">Message</button>
                </div>

            </div>
        `;
    }).join("");
}

/* ---------------------------------------------------
   ACTION BUTTONS
--------------------------------------------------- */
function viewProfile(id) {
    window.location.href = `profile.html?userId=${id}`;
}

function messageUser(id) {
    window.location.href = `messages.html?user=${id}`;
}
