const CLAIMS_API_URL = window.CAMPUSFIND_API_BASE + "/api/claims";

const claimsMessage = document.getElementById("claimsMessage");
const receivedClaimsList = document.getElementById("receivedClaimsList");
const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}

function addClaimDetail(card, label, value) {
    const detail = document.createElement("p");
    const labelElement = document.createElement("strong");

    labelElement.textContent = `${label}: `;
    detail.append(labelElement, document.createTextNode(value));
    card.appendChild(detail);
}

async function loadReceivedClaims() {
    if (!claimsMessage || !receivedClaimsList) {
        console.error("Claims received page is missing required elements.");
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        claimsMessage.textContent = "Please log in to view received claims.";
        return;
    }

    try {
        const response = await fetch(`${CLAIMS_API_URL}/received`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load received claims.");
        }

        receivedClaimsList.replaceChildren();

        if (!Array.isArray(data.claims) || data.claims.length === 0) {
            claimsMessage.textContent =
                "No claims have been received for your reported items yet.";
            return;
        }

        claimsMessage.textContent = "";

        for (const claim of data.claims) {
            const card = document.createElement("article");
            card.className = "claim-card";

            const heading = document.createElement("h2");
            heading.textContent = claim.item?.title || "Unknown item";
            card.appendChild(heading);

            addClaimDetail(card, "Category", claim.item?.category || "N/A");
            addClaimDetail(card, "Location", claim.item?.location || "N/A");
            addClaimDetail(card, "Claimed by", claim.claimedBy?.name || "Student");
            addClaimDetail(card, "Status", claim.status || "pending");
            addClaimDetail(card, "Message", claim.message || "No message provided.");

            if (claim.status === "pending") {
                for (const status of ["approved", "rejected"]) {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.textContent = status === "approved" ? "Approve" : "Reject";
                    button.addEventListener("click", () => {
                        updateClaimStatus(claim._id, status, button);
                    });
                    card.appendChild(button);
                }
            }

            if (claim.status === "approved" && !claim.returned) {
                const returnedButton = document.createElement("button");
                returnedButton.type = "button";
                returnedButton.textContent = "Mark as Returned";
                returnedButton.addEventListener("click", () => {
                    markClaimReturned(claim._id, returnedButton);
                });
                card.appendChild(returnedButton);
            }

            if (claim.returned) {
                addClaimDetail(card, "Return Status", "Returned");

                if (claim.returnedAt) {
                    addClaimDetail(
                        card,
                        "Returned On",
                        new Date(claim.returnedAt).toLocaleString()
                    );
                }
            }

            receivedClaimsList.appendChild(card);
        }
    } catch (error) {
        claimsMessage.textContent =
            error instanceof Error
                ? error.message
                : "Failed to load received claims.";
        console.error("Load received claims error:", error);
    }
}

async function updateClaimStatus(claimId, status, button) {
    const token = localStorage.getItem("token");

    if (!token) {
        claimsMessage.textContent = "Please log in to update claim status.";
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(
            `${CLAIMS_API_URL}/${encodeURIComponent(claimId)}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update claim status.");
        }

        await loadReceivedClaims();
        claimsMessage.textContent = `Claim ${status} successfully.`;
    } catch (error) {
        claimsMessage.textContent =
            error instanceof Error
                ? error.message
                : "Failed to update claim status.";
        console.error("Update claim status error:", error);
        button.disabled = false;
    }
}

async function markClaimReturned(claimId, button) {
    const token = localStorage.getItem("token");

    if (!token) {
        claimsMessage.textContent = "Please log in to update the return status.";
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(
            `${CLAIMS_API_URL}/${encodeURIComponent(claimId)}/returned`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to mark item as returned.");
        }

        await loadReceivedClaims();
        claimsMessage.textContent =
            data.message || "Item marked as returned successfully.";
    } catch (error) {
        claimsMessage.textContent =
            error instanceof Error
                ? error.message
                : "Failed to mark item as returned.";
        console.error("Mark claim returned error:", error);
        button.disabled = false;
    }
}

loadReceivedClaims();
