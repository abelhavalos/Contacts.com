/* ---------------------------------------------------
   DASHBOARD.JS — Loads user info + page data
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    requireAuth(); // Redirects to login if not logged in

    const user = getCurrentUser();
    const page = document.querySelector(".page");

    if (!page) return;

    // Simple welcome header
    const welcome = document.createElement("div");
    welcome.classList.add("dashboard-welcome");

    welcome.innerHTML = `
        <h1>Welcome, ${user.fullName}</h1>
        <p>Your communities, events, and contacts are ready when you are.</p>
    `;

    page.prepend(welcome);

    // Future: Load dashboard data (communities, events, contacts)
    // loadUserCommunities();
    // loadUpcomingEvents();
    // loadRecentContacts();
});

