const AUTH_API_URL = window.CAMPUSFIND_API_BASE + "/api/auth";

// Register a new user
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("registerMessage");

        message.textContent = "Creating your account...";

        try {
            const response = await fetch(`${AUTH_API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed.");
            }

            message.textContent = result.message || "Registration successful!";

            if (result.token) {
                localStorage.setItem("token", result.token);
            }

            if (result.user) {
                localStorage.setItem("user", JSON.stringify(result.user));
            }

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } catch (error) {
            message.textContent = error.message;
        }
    });
}


// Login an existing user
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        try {
            const response = await fetch(`${AUTH_API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed.");
            }

            message.textContent = result.message || "Login successful!";

            if (result.token) {
                localStorage.setItem("token", result.token);
            }

            if (result.user) {
                localStorage.setItem("user", JSON.stringify(result.user));
            }

            setTimeout(() => {
                const user = result.user || {};

                if (user.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            }, 1000);

        } catch (error) {
            message.textContent = error.message;
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const logoutLinks = document.querySelectorAll(
        "#logoutLink, #logoutBtn"
    );

    logoutLinks.forEach(function (logoutLink) {
        logoutLink.addEventListener("click", function (event) {
            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        });
    });
});