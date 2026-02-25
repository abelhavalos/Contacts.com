/* ---------------------------------------------------
   DASHBOARD.JS — User info + notifications
--------------------------------------------------- */

requireAuth();
const user = getCurrentUser();

/* ---------------------------------------------------
   INITIAL LOAD
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadUserName();
    loadNotifications();
});

/* ---------------------------------------------------
   LOAD USER NAME INTO HEADER
--------------------------------------------------- */
function loadUserName() {
    const nameEl = document.getElementById("userName");
    if (nameEl && user) {
        nameEl.textContent = user.fullName;
    }
}

/* ---------------------------------------------------
   LOAD NOTIFICATIONS
--------------------------------------------------- */
async function loadNotifications() {
    const bubble = document.getElementById("notificationBubble");
    const panel = document.getElementById("notificationsPanel");

    if (!bubble || !panel) return;

    const result = await api("getNotifications", { userId: user.id });

    if (result.error) {
        console.warn("Error loading notifications:", result.error);
        return;
    }

    const notifications = result.notifications || [];

    // Update bubble
    if (notifications.length > 0) {
        bubble.textContent = notifications.length;
        bubble.classList.remove("hidden");
    } else {
        bubble.classList.add("hidden");
    }

    // Render panel
    panel.innerHTML = notifications
        .map((n) => {
            return `
                <div class="notification-item" onclick="openNotification('${n.id}', '${n.link || ""}')">
                    <div class="notification-text">${n.text}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
            `;
        })
        .join("");

    // Clicking bubble toggles panel
    bubble.onclick = () => {
        panel.style.display = panel.style.display === "block" ? "none" : "block";
    };
}

/* ---------------------------------------------------
   OPEN NOTIFICATION
--------------------------------------------------- */
async function openNotification(notificationId, link) {
    // Mark as read
    await api("markNotificationRead", { notificationId });

    // Hide panel
    document.getElementById("notificationsPanel").style.display = "none";

    // Navigate if link exists
    if (link) {
        window.location.href = link;
    } else {
        // Reload notifications
        loadNotifications();
    }
}

/* ---------------------------------------------------
   CLOSE PANEL WHEN CLICKING OUTSIDE
--------------------------------------------------- */
document.addEventListener("click", (e) => {
    const panel = document.getElementById("notificationsPanel");
    const bubble = document.getElementById("notificationBubble");

    if (!panel || !bubble) return;

    const clickedInside =
        panel.contains(e.target) || bubble.contains(e.target);

    if (!clickedInside) {
        panel.style.display = "none";
    }
});
