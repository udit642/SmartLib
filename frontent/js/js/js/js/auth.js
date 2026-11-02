document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const role = document.getElementById("loginRole").value;

        // ADMIN LOGIN
        if (role === "admin") {

            if (
                email === "admin@smartlib.com" &&
                password === "admin123"
            ) {

                localStorage.setItem("adminLoggedIn", "true");

                window.location.href = "/admin-dashboard.html";

            } else {

                alert("Wrong Admin Email or Password");

            }

            return;
        }

        // STUDENT LOGIN
        alert("Student login system will be connected after registration.");

    });

});