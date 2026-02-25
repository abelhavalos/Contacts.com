/* ---------------------------------------------------
   MESSAGES.JS — Conversation-based chat
--------------------------------------------------- */

requireAuth();
const currentUser = getCurrentUser();

let chatMode = null;          // "private" | "community"
let otherId = null;           // for private chat
let communityId = null;       // for community chat
let conversationId = null;
let pollTimer = null;

/* ---------------------------------------------------
   INIT
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    detectChatMode();
    setupUI();
    await resolveConversation();
    await loadInitialData();
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

    otherId = params.get("otherId") || params.get("user") || null;
    chatMode = "private";
}

/* ---------------------------------------------------
   RESOLVE CONVERSATION (get or create)
--------------------------------------------------- */
async function resolveConversation() {
    if (chatMode === "private") {
        if (!otherId) return;
        const res = await api("getOrCreateDMConversation", {
            userA: currentUser.id,
            userB: otherId
        });
        if (!res.error && res.conversationId) {
            conversationId = res.conversationId;
        }
    } else if (chatMode === "community") {
        if (!communityId) return;
        const res = await api("getOrCreateCommunityConversation", {
            communityId,
            userId: currentUser.id
        });
        if (!res.error && res.conversationId) {
            conversationId = res.conversationId;
        }
    }
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
    if (!conversationId) return;

    if (chatMode === "private") {
        await loadPrivateHeader();
    } else if (chatMode === "community") {
        await loadCommunityHeader();
        await loadConversationMembers();
    }

    await loadMessages();
}

/* ---------------------------------------------------
   HEADER
--------------------------------------------------- */
async function loadPrivateHeader() {
    const headerTitle = document.getElementById("headerTitle");
    if (!headerTitle) return;

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
   MEMBERS (for community)
--------------------------------------------------- */
async function loadConversationMembers() {
    const sidebar = document.getElementById("memberSidebar");
    if (!sidebar || !conversationId) return;

    sidebar.innerHTML = "Loading members…";

    const res = await api("getConversationMembers", { conversationId });
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
    if (!listEl || !conversationId) return;

    const res = await api("getMessages", { conversationId });

    if (res.error) {
        listEl.innerHTML = "<div class='empty-state'>Error loading messages.</div>";
        return;
    }

    const messages = (res.messages || []).map((m) => ({
        ...m,
        text: m.text || "",
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
            const name = m.isMine ? "You" : (m.senderName || "User");
            const time = formatTime(m.timestamp);

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
    if (!conversationId) return;

    const input = document.getElementById("messageInput");
    if (!input) return;

    const raw = input.value.trim();
    if (!raw) return;

    // optimistic UI
    const tempMessage = {
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        text: raw,
        timestamp: new Date().toISOString(),
        isMine: true
    };

    appendMessage(tempMessage);
    input.value = "";

    const res = await api("sendMessage", {
        conversationId,
        senderId: currentUser.id,
        text: raw
    });

    if (res && res.error) {
        console.error("Error sending message:", res.error);
    } else {
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
    const name = m.isMine ? "You" : (m.senderName || "User");
    const time = formatTime(m.timestamp);

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
    pollTimer = setInterval(loadMessages, 5000);
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
   FRONTEND ENCRYPT/DECRYPT STUBS
   (backend already encrypts/decrypts)
--------------------------------------------------- */
function encrypt(text) {
    return text;
}

function decrypt(text) {
    return text;
}
