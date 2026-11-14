console.log("REPORT.JS LOADED");

const REPORT_API_URL = window.CAMPUSFIND_API_BASE + "/api/items";

const reportForm = document.getElementById("reportForm");
const reportMessage = document.getElementById("reportMessage");

if (reportForm) {
    reportForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        console.log("ACTUAL REPORT SUBMIT HANDLER RUNNING");

        const token = localStorage.getItem("token");

        if (!token) {
            reportMessage.textContent =
                "Please log in before reporting an item.";
            reportMessage.style.color = "red";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

            return;
        }

        const title = document.getElementById("title").value.trim();
        const description = document.getElementById("description").value.trim();
        const category = document.getElementById("category").value;
        const type = document.querySelector('input[name="type"]:checked')?.value;
        const location = document.getElementById("location").value.trim();
        const date = document.getElementById("date").value;
        const imageFile = document.getElementById("image").files[0];

        if (!type) {
            reportMessage.textContent =
                "Please select whether the item is Lost or Found.";
            reportMessage.style.color = "red";
            return;
        }

        const itemData = new FormData();

        itemData.append("title", title);
        itemData.append("description", description);
        itemData.append("category", category);
        itemData.append("type", type);
        itemData.append("location", location);
        itemData.append("date", date);

        if (imageFile) {
            itemData.append("image", imageFile);
        }

        const submitButton = reportForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
        }

        reportMessage.textContent = "Submitting your report...";
        reportMessage.style.color = "blue";

        try {
            const response = await fetch(REPORT_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: itemData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to submit your report."
                );
            }

            reportMessage.textContent =
                result.message || "Item reported successfully!";
            reportMessage.style.color = "green";

            reportForm.reset();

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);

        } catch (error) {
            console.error("Report item error:", error);

            reportMessage.textContent =
                error.message || "Unable to submit the report.";
            reportMessage.style.color = "red";

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Submit Report";
            }
        }
    });
}
