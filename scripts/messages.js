/* ---------------------------------------------------
   MESSAGES.JS — Private + Community chat
--------------------------------------------------- */

requireAuth();
const currentUser = getCurrentUser();

let chatMode = null;          // "private" | "community"
let otherId = null;           // for private chat
let communityId = null;       // for community chat
let pollTimer = null;

/* ---------------------------------------------------
   INIT
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    detectChatMode();
    setupUI();
    loadInitialData();
    startPolling();
});

/* ---------------------------------------------------
   MODE DETECTION
--------------------------------------------------- */
function detectChatMode() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("community")) {
        chatMode = "community";
        communityId = params.get("community");
        return;
    }

    // private chat by otherId / user / otherEmail (flexible)
    otherId = params.get("otherId") || params.get("user") || null;
    chatMode = "private";
}

/* ---------------------------------------------------
   UI SETUP
--------------------------------------------------- */
function setupUI() {
    const sendBtn = document.getElementById("sendBtn");
    const input = document.getElementById("messageInput");
    const toggleMembers = document.getElementById("toggleMembers");

    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (toggleMembers) {
        toggleMembers.addEventListener("click", () => {
            const sidebar = document.getElementById("memberSidebar");
            if (sidebar) {
                sidebar.classList.toggle("show");
            }
        });
    }
}

/* ---------------------------------------------------
   INITIAL DATA LOAD
--------------------------------------------------- */
async function loadInitialData() {
    if (chatMode === "private") {
        await loadPrivateHeader();
    } else if (chatMode === "community") {
        await loadCommunityHeader();
        await loadCommunityMembers();
    }
    await loadMessages();
}

/* ---------------------------------------------------
   HEADER
--------------------------------------------------- */
async function loadPrivateHeader() {
    const headerTitle = document.getElementById("headerTitle");
    if (!headerTitle) return;

    // Try localStorage first
    const stored = localStorage.getItem("private_chat_user");
    if (stored) {
        try {
            const obj = JSON.parse(stored);
            if (obj.fullName) {
                headerTitle.textContent = obj.fullName;
                return;
            }
        } catch (e) {}
    }

    // Fallback: fetch from backend if we have otherId
    if (otherId) {
        const res = await api("getUser", { userId: otherId });
        if (!res.error && res.user) {
            headerTitle.textContent = res.user.fullName || "Chat";
            return;
        }
    }

    headerTitle.textContent = "Chat";
}

async function loadCommunityHeader() {
    const headerTitle = document.getElementById("headerTitle");
    if (!headerTitle || !communityId) return;

    const res = await api("getCommunity", { communityId });
    if (!res.error && res.community) {
        headerTitle.textContent = res.community.name || "Community";
    } else {
        headerTitle.textContent = "Community";
    }
}

/* ---------------------------------------------------
   COMMUNITY MEMBERS
--------------------------------------------------- */
async function loadCommunityMembers() {
    const sidebar = document.getElementById("memberSidebar");
    if (!sidebar || !communityId) return;

    sidebar.innerHTML = "Loading members…";

    const res = await api("getCommunityMembers", { communityId });
    if (res.error) {
        sidebar.innerHTML = "Error loading members.";
        return;
    }

    const members = res.members || [];
    if (!members.length) {
        sidebar.innerHTML = "<div class='empty-state'>No members yet.</div>";
        return;
    }

    sidebar.innerHTML = members
        .map((m) => {
            const initials = (m.fullName || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

            return `
                <div class="member-row">
                    <div class="member-avatar">${initials}</div>
                    <div class="member-name">${m.fullName || "Unknown"}</div>
                </div>
            `;
        })
        .join("");
}

/* ---------------------------------------------------
   LOAD MESSAGES
--------------------------------------------------- */
async function loadMessages() {
    const listEl = document.getElementById("messageList");
    if (!listEl) return;

    let res;
    if (chatMode === "private") {
        if (!otherId) return;
        res = await api("getMessages", {
            mode: "private",
            userId: currentUser.id,
            otherId
        });
    } else if (chatMode === "community") {
        if (!communityId) return;
        res = await api("getMessages", {
            mode: "community",
            communityId
        });
    } else {
        return;
    }

    if (res.error) {
        listEl.innerHTML = "<div class='empty-state'>Error loading messages.</div>";
        return;
    }

    const messages = (res.messages || []).map((m) => ({
        ...m,
        text: safeDecrypt(m.text),
        isMine: m.senderId === currentUser.id
    }));

    renderMessages(messages);
}

/* ---------------------------------------------------
   RENDER MESSAGES
--------------------------------------------------- */
function renderMessages(messages) {
    const listEl = document.getElementById("messageList");
    if (!listEl) return;

    if (!messages.length) {
        listEl.innerHTML = "<div class='empty-state'>No messages yet.</div>";
        return;
    }

    listEl.innerHTML = messages
        .map((m) => {
            const cls = m.isMine ? "message mine" : "message theirs";
            const name = m.senderName || (m.isMine ? "You" : "User");
            const time = formatTime(m.createdAt);

            return `
                <div class="${cls}">
                    <div class="message-meta">
                        <span class="message-sender">${name}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${escapeHtml(m.text || "")}</div>
                </div>
            `;
        })
        .join("");

    scrollToBottom();
}

/* ---------------------------------------------------
   SEND MESSAGE
--------------------------------------------------- */
async function sendMessage() {
    const input = document.getElementById("messageInput");
    if (!input) return;

    const raw = input.value.trim();
    if (!raw) return;

    const encrypted = safeEncrypt(raw);

    // optimistic UI
    const tempMessage = {
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        text: raw,
        createdAt: new Date().toISOString(),
        isMine: true
    };

    appendMessage(tempMessage);
    input.value = "";

    let res;
    if (chatMode === "private") {
        if (!otherId) return;
        res = await api("sendMessage", {
            mode: "private",
            senderId: currentUser.id,
            otherId,
            text: encrypted
        });
    } else if (chatMode === "community") {
        if (!communityId) return;
        res = await api("sendMessage", {
            mode: "community",
            senderId: currentUser.id,
            communityId,
            text: encrypted
        });
    } else {
        return;
    }

    if (res && res.error) {
        // simple error handling; you can improve with popup
        console.error("Error sending message:", res.error);
    } else {
        // reload to sync with server (ids, timestamps, etc.)
        loadMessages();
    }
}

/* ---------------------------------------------------
   APPEND SINGLE MESSAGE (optimistic)
--------------------------------------------------- */
function appendMessage(m) {
    const listEl = document.getElementById("messageList");
    if (!listEl) return;

    const cls = m.isMine ? "message mine" : "message theirs";
    const name = m.senderName || (m.isMine ? "You" : "User");
    const time = formatTime(m.createdAt);

    const html = `
        <div class="${cls}">
            <div class="message-meta">
                <span class="message-sender">${name}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(m.text || "")}</div>
        </div>
    `;

    listEl.insertAdjacentHTML("beforeend", html);
    scrollToBottom();
}

/* ---------------------------------------------------
   POLLING
--------------------------------------------------- */
function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(loadMessages, 5000); // 5s
}

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */
function scrollToBottom() {
    const messagesWrapper = document.getElementById("messages");
    if (!messagesWrapper) return;
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
}

function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* ---------------------------------------------------
   ENCRYPT / DECRYPT WRAPPERS
   (use your existing Contact.com helpers)
--------------------------------------------------- */
function safeEncrypt(text) {
    try {
        if (typeof encrypt === "function") {
            return encrypt(text);
        }
    } catch (e) {
        console.error("encrypt() failed:", e);
    }
    return text;
}

function safeDecrypt(text) {
    try {
        if (typeof decrypt === "function") {
            return decrypt(text);
        }
    } catch (e) {
        console.error("decrypt() failed:", e);
    }
    return text;
}
