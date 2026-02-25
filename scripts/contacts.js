/* ---------------------------------------------------
   CONTACTS.JS — Load, search, render contacts
--------------------------------------------------- */

requireAuth();
const user = getCurrentUser();

/* ---------------------------------------------------
   INITIAL LOAD
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadContacts();
    setupSearch();
});

/* ---------------------------------------------------
   LOAD CONTACTS
--------------------------------------------------- */
async function loadContacts() {
    const container = document.getElementById("contactsContainer");
    const emptyState = document.getElementById("emptyState");
    const loader = document.getElementById("contactsLoader");

    if (loader) loader.style.display = "flex";

    const result = await api("getContacts", { userId: user.id });

    if (loader) loader.style.display = "none";

    if (result.error) {
        container.innerHTML = `<div class="empty-state">Error loading contacts.</div>`;
        return;
    }

    let contacts = result.contacts || [];

    // Remove yourself
    contacts = contacts.filter(c => c.contactId !== user.id);

    renderContacts(contacts);

    emptyState.style.display = contacts.length ? "none" : "block";
}

/* ---------------------------------------------------
   SEARCH CONTACTS
--------------------------------------------------- */
function setupSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", async () => {
        const query = input.value.trim();

        if (!query) {
            loadContacts();
            return;
        }

        const result = await api("searchContacts", {
            userId: user.id,
            query
        });

        if (result.error) return;

        const contacts = result.contacts || [];
        renderContacts(contacts);

        document.getElementById("emptyState").style.display =
            contacts.length ? "none" : "block";
    });
}

/* ---------------------------------------------------
   RENDER CONTACT CARDS
--------------------------------------------------- */
function renderContacts(list) {
    const container = document.getElementById("contactsContainer");

    if (!list.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = list
        .map((c) => {
            const avatar = c.avatarUrl;
            const initials = c.fullName
                ? c.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
                : "?";

            return `
                <div class="contact-card">

                    ${
                        avatar
                            ? `<img class="contact-avatar-img" src="${avatar}" alt="Avatar">`
                            : `<div class="contact-avatar">${initials}</div>`
                    }

                    <div class="contact-info">
                        <div class="contact-name">${c.fullName || "Unknown"}</div>
                        <div class="contact-email">${c.email || ""}</div>
                    </div>

                    <div class="contact-actions">
                        <button class="contact-btn secondary" onclick="viewProfile('${c.contactId}')">
                            View Profile
                        </button>
                        <button class="contact-btn" onclick="messageUser('${c.contactId}', '${c.fullName}', '${c.email}', '${avatar || ""}')">
                            Message
                        </button>
                    </div>

                </div>
            `;
        })
        .join("");
}

/* ---------------------------------------------------
   ACTION BUTTONS
--------------------------------------------------- */
function viewProfile(id) {
    window.location.href = `public-profile.html?email=${encodeURIComponent(id)}`;
}

/* 
   When messaging a user, we save their profile to localStorage
   so messages.html can load the correct chat.
*/
function messageUser(contactId, fullName, email, avatarUrl) {
    const profile = {
        email,
        fullName,
        avatarUrl,
        id: contactId
    };

    localStorage.setItem("private_chat_user", JSON.stringify(profile));

    window.location.href = `messages.html?otherEmail=${encodeURIComponent(email)}`;
}
