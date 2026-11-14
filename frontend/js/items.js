
const ITEMS_API_URL = window.CAMPUSFIND_API_BASE + "/api/items";

async function loadDashboardItems() {
    const itemsContainer = document.getElementById("dashboardItems");

    // If this script is loaded on another page, do nothing.
    if (!itemsContainer) {
        return;
    }

    itemsContainer.innerHTML = "<p>Loading items...</p>";

    try {
        const response = await fetch(ITEMS_API_URL);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load items.");
        }

        const items = result.items || [];

        if (items.length === 0) {
            itemsContainer.innerHTML =
                "<p>No items have been reported yet.</p>";
            return;
        }

        itemsContainer.innerHTML = "";

        items.forEach((item) => {
            const itemCard = document.createElement("article");
            itemCard.className = "item-card";

            const itemType = item.type
                ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
                : "Item";
            const imageUrl = typeof item.imageUrl === "string" &&
                item.imageUrl.startsWith("/uploads/")
                ? `${window.CAMPUSFIND_API_BASE}${item.imageUrl}`
                : "";

            itemCard.innerHTML = `
                <div class="item-card-content">
                    ${imageUrl
                        ? `<img class="item-card-photo" src="${escapeHTML(imageUrl)}" alt="Photo of ${escapeHTML(item.title || "reported item")}" loading="lazy">`
                        : `<div class="item-photo-placeholder">No photo available</div>`}
                    <span class="item-type">${itemType}</span>
                    <h3>${escapeHTML(item.title || "Untitled item")}</h3>
                    <p>${escapeHTML(item.description || "No description provided.")}</p>
                    <p><strong>Category:</strong> ${escapeHTML(item.category || "Other")}</p>
                    <p><strong>Location:</strong> ${escapeHTML(item.location || "Not specified")}</p>
                    <a href="item-details.html?id=${encodeURIComponent(item._id)}"
                       class="btn btn-primary">
                        View Details
                    </a>
                </div>
            `;

            const image = itemCard.querySelector(".item-card-photo");
            if (image) {
                image.addEventListener("error", () => {
                    const placeholder = document.createElement("div");
                    placeholder.className = "item-photo-placeholder";
                    placeholder.textContent = "No photo available";
                    image.replaceWith(placeholder);
                }, { once: true });
            }

            itemsContainer.appendChild(itemCard);
        });

    } catch (error) {
        console.error("Dashboard items error:", error);

        itemsContainer.innerHTML =
            "<p>Unable to load items. Please check your backend server.</p>";
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

document.addEventListener("DOMContentLoaded", loadDashboardItems);
