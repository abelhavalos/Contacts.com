function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("show");
}

function loadNavbar() {
    const user = JSON.parse(localStorage.getItem("contacts_user"));

    const loggedInNav = `
        <div class="hamburger" onclick="toggleMenu()">
            <span></span><span></span><span></span>
        </div>
        <div class="logo">Contacts<span>.</span>com</div>
        <div class="nav-links">
            <a href="dashboard.html">Dashboard</a>
            <a href="communities.html">Communities</a>
            <a href="events.html">Events</a>
            <a href="contacts.html">Contacts</a>
            <a href="profile.html">Profile</a>
            <a href="#" onclick="logout()">Logout</a>
        </div>
    `;

    const publicNav = `
        <div class="hamburger" onclick="toggleMenu()">
            <span></span><span></span><span></span>
        </div>
        <div class="logo">Contacts<span>.</span>com</div>
        <div class="nav-links">
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <button class="btn-primary" onclick="window.location.href='signup.html'">Sign Up</button>
        </div>
    `;

    document.getElementById("navbar").innerHTML = user ? loggedInNav : publicNav;

    document.getElementById("mobileMenu").innerHTML = user
        ? `
            <a href="dashboard.html">Dashboard</a>
            <a href="communities.html">Communities</a>
            <a href="events.html">Events</a>
            <a href="contacts.html">Contacts</a>
            <a href="profile.html">Profile</a>
            <a href="#" onclick="logout()">Logout</a>
        `
        : `
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <button class="btn-primary" onclick="window.location.href='signup.html'">Sign Up</button>
        `;
}

function logout() {
    localStorage.removeItem("contacts_user");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", loadNavbar);

