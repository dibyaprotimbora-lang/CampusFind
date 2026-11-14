const API_URL = window.CAMPUSFIND_API_BASE + "/api/items";

const itemsGrid = document.getElementById("itemsGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const filterButtons = document.querySelectorAll(".filter-btn");

let activeType = "all";
let allItems = [];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "Date not specified";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date not specified";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function createItemCard(item) {
  const itemType = item.type === "lost" ? "Lost" : "Found";
  const typeClass = item.type === "lost" ? "lost" : "found";
  const imageUrl = typeof item.imageUrl === "string" &&
    item.imageUrl.startsWith("/uploads/")
    ? `${window.CAMPUSFIND_API_BASE}${item.imageUrl}`
    : "";

  return `
    <article class="item-card">
      <div class="item-card-content">

        ${imageUrl
          ? `<img class="item-card-photo" src="${escapeHTML(imageUrl)}" alt="Photo of ${escapeHTML(item.title || "reported item")}" loading="lazy">`
          : `<div class="item-photo-placeholder">No photo available</div>`}

        <span class="item-badge ${typeClass}">
          ${itemType} Item
        </span>

        <h3>${escapeHTML(item.title)}</h3>

        <p class="item-description">
          ${escapeHTML(item.description)}
        </p>

        <div class="item-meta">
          <span>📍 ${escapeHTML(item.location)}</span>
          <span>📅 ${formatDate(item.date)}</span>
        </div>

        <div class="item-card-footer">
          <span class="item-category">
            ${escapeHTML(item.category)}
          </span>

          <span class="item-status ${item.status}">
            ${escapeHTML(item.status)}
          </span>
        </div>

      </div>
    </article>
  `;
}

function renderItems() {
  if (!itemsGrid) return;

  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const selectedCategory = categoryFilter
    ? categoryFilter.value
    : "all";

  const filteredItems = allItems.filter((item) => {
    const matchesType =
      activeType === "all" || item.type === activeType;

    const matchesCategory =
      selectedCategory === "all" ||
      item.category === selectedCategory;

    const selectedStatus = statusFilter
      ? statusFilter.value
      : "all";

    const matchesStatus =
      selectedStatus === "all" ||
      item.status === selectedStatus;

    const searchableText = [
      item.title,
      item.description,
      item.location,
      item.category
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);

    return (
      matchesType &&
      matchesCategory &&
      matchesStatus &&
      matchesSearch
    );
  });

  if (filteredItems.length === 0) {
    itemsGrid.innerHTML = `
      <p class="empty-message">
        No listings found. Be the first to report an item!
      </p>
    `;
    return;
  }

  itemsGrid.innerHTML = filteredItems
    .map(createItemCard)
    .join("");

  itemsGrid.querySelectorAll(".item-card-photo").forEach((image) => {
    image.addEventListener("error", () => {
      const placeholder = document.createElement("div");
      placeholder.className = "item-photo-placeholder";
      placeholder.textContent = "No photo available";
      image.replaceWith(placeholder);
    }, { once: true });
  });
}

async function loadItems() {
  if (!itemsGrid) return;

  itemsGrid.innerHTML = `
    <p class="loading-message">
      Loading campus listings...
    </p>
  `;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Could not load campus listings.");
    }

    const result = await response.json();

    allItems = Array.isArray(result.items)
      ? result.items
      : [];

    renderItems();
  } catch (error) {
    console.error("Error loading items:", error);

    itemsGrid.innerHTML = `
      <p class="error-message">
        Unable to load listings. Please check whether the backend is running.
      </p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadItems);

// All Items / Lost / Found buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeType = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");

    renderItems();
  });
});

// Category dropdown
if (categoryFilter) {
  categoryFilter.addEventListener("change", renderItems);
}

if (statusFilter) {
  statusFilter.addEventListener("change", renderItems);
}

// Search field
if (searchInput) {
  searchInput.addEventListener("input", renderItems);
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
    }

    if (categoryFilter) {
      categoryFilter.value = "all";
    }

    if (statusFilter) {
      statusFilter.value = "all";
    }

    activeType = "all";

    filterButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.filter === "all"
      );
    });

    renderItems();
  });
}
