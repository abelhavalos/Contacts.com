/* ---------------------------------------------------
   CONTACTS.JS — Load and render contacts
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    const user = getCurrentUser();
    const container = document.getElementById("contactsList");
    if (!container) return;

    container.innerHTML = "Loading contacts...";

    const result = await api("getContacts", { userId: user.id });

    if (result.error) {
        container.innerHTML = "Error loading contacts.";
        return;
    }

    renderContacts(result.contacts || [], container);
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

    container.innerHTML = list.map(c => `
        <div class="card">
            <h3>${c.contactId}</h3>
            <p>Contact ID: ${c.contactId}</p>
            <p>Added: ${c.createdAt || ""}</p>
        </div>
    `).join("");
}