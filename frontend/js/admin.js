
const ADMIN_API = window.CAMPUSFIND_API_BASE + "/api/admin";

const token = localStorage.getItem("token");

const adminMessage = document.getElementById("adminMessage");

let allItems = [];
let allUsers = [];
let allClaims = [];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "N/A"
        : date.toLocaleDateString("en-IN");
}

async function adminFetch(endpoint, options = {}) {
    const response = await fetch(`${ADMIN_API}${endpoint}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        throw new Error("Session expired.");
    }

    if (response.status === 403) {
        window.location.href = "dashboard.html";
        throw new Error("Administrator access required.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Unable to load data.");
    }

    return data;
}

// Load dashboard statistics
async function loadOverview() {
    const result = await adminFetch("/overview");
    const stats = result.statistics;

    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);

        if (element) {
            element.textContent = stats[key];
        }
    });
}

// Load all items
async function loadItems() {
    const result = await adminFetch("/items");

    allItems = result.items || [];
    renderItems(allItems);
}

function renderItems(items) {
    const tbody = document.getElementById("itemsTableBody");

    if (!items.length) {
        tbody.innerHTML =
            '<tr><td colspan="6">No items found.</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${escapeHTML(item.title)}</td>
            <td>${escapeHTML(item.type)}</td>
            <td>${escapeHTML(item.category)}</td>
            <td>${escapeHTML(item.location)}</td>
            <td>
                <span class="admin-status">
                    ${escapeHTML(item.status)}
                </span>
            </td>
            <td>${escapeHTML(item.reportedBy?.name || "Unknown")}</td>
        </tr>
    `).join("");
}

// Load registered users
async function loadUsers() {
    const result = await adminFetch("/users");

    allUsers = result.users || [];
    renderUsers(allUsers);
}

function renderUsers(users) {
    const tbody = document.getElementById("usersTableBody");

    if (!users.length) {
        tbody.innerHTML =
            '<tr><td colspan="4">No users found.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHTML(user.name)}</td>
            <td>${escapeHTML(user.email)}</td>
            <td>${escapeHTML(user.role)}</td>
            <td>${formatDate(user.createdAt)}</td>
        </tr>
    `).join("");
}

// Load claims
async function loadClaims() {
    const result = await adminFetch("/claims");

    allClaims = result.claims || [];
    renderClaims(allClaims);
}

function renderClaims(claims) {
    const tbody = document.getElementById("claimsTableBody");

    if (!claims.length) {
        tbody.innerHTML =
            '<tr><td colspan="6">No claims found.</td></tr>';
        return;
    }

    tbody.innerHTML = claims.map(claim => {
        const actions = claim.status === "pending"
            ? `
                <div class="admin-claim-actions">
                    <button type="button"
                        class="admin-claim-action admin-claim-approve"
                        data-claim-action="approved"
                        data-claim-id="${escapeHTML(claim._id)}">
                        Approve
                    </button>
                    <button type="button"
                        class="admin-claim-action admin-claim-reject"
                        data-claim-action="rejected"
                        data-claim-id="${escapeHTML(claim._id)}">
                        Reject
                    </button>
                </div>
            `
            : '<span class="admin-claim-no-action">—</span>';

        return `
            <tr>
                <td>${escapeHTML(claim.item?.title || "Deleted item")}</td>
                <td>${escapeHTML(claim.claimedBy?.name || "Unknown")}</td>
                <td><span class="admin-status">${escapeHTML(claim.status)}</span></td>
                <td>${claim.returned ? "Yes" : "No"}</td>
                <td>${formatDate(claim.createdAt)}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join("");
}
// Administrator claim actions (the backend route is protected by adminMiddleware).
document.getElementById("claimsTableBody").addEventListener("click", async event => {
    const button = event.target.closest("button[data-claim-action][data-claim-id]");
    if (!button) return;

    const claimId = button.dataset.claimId;
    const status = button.dataset.claimAction;

    if (!claimId || !["approved", "rejected"].includes(status)) return;

    const verb = status === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this claim?`)) return;

    const relatedButtons = Array.from(
        document.querySelectorAll(`button[data-claim-id="${claimId}"]`)
    );
    relatedButtons.forEach(actionButton => {
        actionButton.disabled = true;
    });
    button.textContent = status === "approved" ? "Approving..." : "Rejecting...";

    try {
        const result = await adminFetch(
            `/claims/${encodeURIComponent(claimId)}/status`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            }
        );

        adminMessage.textContent = result.message || `Claim ${status} successfully.`;
        adminMessage.className = "admin-message success";

        await Promise.all([loadClaims(), loadOverview()]);
    } catch (error) {
        adminMessage.textContent = error.message;
        adminMessage.className = "admin-message error";
        relatedButtons.forEach(actionButton => {
            actionButton.disabled = false;
        });
        button.textContent = status === "approved" ? "Approve" : "Reject";
    }
});

// Navigation between dashboard sections
document.querySelectorAll("[data-section]").forEach(link => {
    link.addEventListener("click", async event => {
        event.preventDefault();

        const section = link.dataset.section;

        document.querySelectorAll(".admin-section").forEach(element => {
            element.hidden = true;
        });

        document.querySelectorAll("[data-section]").forEach(element => {
            element.classList.remove("active");
        });

        document.getElementById(`${section}Section`).hidden = false;
        link.classList.add("active");

        try {
            if (section === "items") await loadItems();
            if (section === "users") await loadUsers();
            if (section === "claims") await loadClaims();
        } catch (error) {
            adminMessage.textContent = error.message;
        }
    });
});

// Search items
document.getElementById("itemSearch").addEventListener("input", event => {
    const query = event.target.value.toLowerCase();

    renderItems(allItems.filter(item =>
        [item.title, item.category, item.location, item.status, item.type]
            .some(value => String(value || "").toLowerCase().includes(query))
    ));
});

// Search users
document.getElementById("userSearch").addEventListener("input", event => {
    const query = event.target.value.toLowerCase();

    renderUsers(allUsers.filter(user =>
        [user.name, user.email, user.role]
            .some(value => String(value || "").toLowerCase().includes(query))
    ));
});

// Logout
document.getElementById("adminLogout").addEventListener("click", event => {
    event.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
});

// Mobile navigation
document.getElementById("adminMenuToggle").addEventListener("click", () => {
    const nav = document.getElementById("adminNav");
    const button = document.getElementById("adminMenuToggle");

    const open = nav.classList.toggle("mobile-menu-open");

    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "×" : "☰";
});

// Initialize dashboard
async function initializeAdmin() {
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        await loadOverview();
        adminMessage.textContent = "Dashboard loaded successfully.";
        adminMessage.className = "admin-message success";
    } catch (error) {
        adminMessage.textContent = error.message;
        adminMessage.className = "admin-message error";
    }
}

initializeAdmin();
