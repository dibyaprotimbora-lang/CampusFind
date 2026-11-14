
const CLAIMS_API_URL = window.CAMPUSFIND_API_BASE + "/api/claims/my-claims";

const claimsMessage = document.getElementById("claimsMessage");
const claimsList = document.getElementById("claimsList");

function createStatusBadge(status) {
    const badge = document.createElement("span");
    badge.className = `claim-status-badge status-${status}`;
    badge.textContent = status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Pending";

    return badge;
}

function getStatusNotification(status) {
    if (status === "approved") {
        return "🎉 Your claim has been approved! Please coordinate with the reporter to collect your item.";
    }

    if (status === "rejected") {
        return "Your claim was rejected by the reporter.";
    }

    return "Your claim is waiting for the reporter's review.";
}

async function loadMyClaims() {
    const token = localStorage.getItem("token");

    if (!token) {
        claimsMessage.textContent = "Please log in to view your claims.";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

        return;
    }

    try {
        const response = await fetch(CLAIMS_API_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load claims.");
        }

        claimsList.replaceChildren();

        if (!Array.isArray(result.claims) || result.claims.length === 0) {
            claimsMessage.textContent = "You haven't claimed any items yet.";
            return;
        }

        claimsMessage.textContent = "";

        for (const claim of result.claims) {
            const item = claim.item;

            if (!item) {
                continue;
            }

            const card = document.createElement("div");
            card.className = "claim-card";

            const heading = document.createElement("h3");
            heading.textContent = item.title || "Unknown item";

            const category = document.createElement("p");
            category.textContent = `Category: ${item.category || "N/A"}`;

            const location = document.createElement("p");
            location.textContent = `Location: ${item.location || "N/A"}`;

            const statusRow = document.createElement("p");
            statusRow.append(
                document.createTextNode("Claim Status: "),
                createStatusBadge(claim.status)
            );

            const notification = document.createElement("p");
            notification.className = `claim-notification status-${claim.status}`;
            notification.textContent = getStatusNotification(claim.status);

            card.append(
                heading,
                category,
                location,
                statusRow,
                notification
            );

            claimsList.appendChild(card);
        }

    } catch (error) {
        console.error("My claims error:", error);

        claimsMessage.textContent =
            error instanceof Error
                ? error.message
                : "Unable to load your claims.";
    }
}

loadMyClaims();
