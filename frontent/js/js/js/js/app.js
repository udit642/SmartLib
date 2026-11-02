

function getData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);

        if (data === null) {
            return defaultValue;
        }

        return JSON.parse(data);

    } catch (error) {
        console.error("Error reading localStorage:", error);
        return defaultValue;
    }
}


/* =====================================================
   SAVE DATA TO LOCAL STORAGE
   ===================================================== */

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;

    } catch (error) {
        console.error("Error saving localStorage:", error);
        return false;
    }
}


/* =====================================================
   GET CURRENT LOGGED-IN USER
   ===================================================== */

function getCurrentUser() {
    try {
        const user = localStorage.getItem("smartLibCurrentUser");

        if (!user) {
            return null;
        }

        return JSON.parse(user);

    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}


/* =====================================================
   LOGOUT USER
   ===================================================== */

function logoutUser() {

    localStorage.removeItem("smartLibCurrentUser");

    window.location.href = "login.html";
}


/* =====================================================
   SHOW MESSAGE / NOTIFICATION
   ===================================================== */

function showMessage(message, type = "success") {

    // Remove old message
    const oldMessage = document.querySelector(".smart-message");

    if (oldMessage) {
        oldMessage.remove();
    }


    // Create message box
    const messageBox = document.createElement("div");

    messageBox.className = "smart-message";

    messageBox.textContent = message;


    // Basic styling
    messageBox.style.position = "fixed";
    messageBox.style.top = "25px";
    messageBox.style.right = "25px";
    messageBox.style.zIndex = "99999";

    messageBox.style.padding = "14px 20px";

    messageBox.style.borderRadius = "10px";

    messageBox.style.color = "#ffffff";

    messageBox.style.fontSize = "14px";

    messageBox.style.fontWeight = "600";

    messageBox.style.fontFamily = "Arial, sans-serif";

    messageBox.style.boxShadow =
        "0 10px 30px rgba(0, 0, 0, 0.15)";


    // Success / Error color
    if (type === "error") {

        messageBox.style.backgroundColor = "#dc2626";

    } else if (type === "warning") {

        messageBox.style.backgroundColor = "#f59e0b";

    } else {

        messageBox.style.backgroundColor = "#16a34a";
    }


    // Add message to page
    document.body.appendChild(messageBox);


    // Remove after 2.5 seconds
    setTimeout(function () {

        if (messageBox) {
            messageBox.remove();
        }

    }, 2500);
}


/* =====================================================
   LOGOUT LINK
   ===================================================== */

document.addEventListener("click", function (event) {

    const logoutLink = event.target.closest(".logout-link");

    if (logoutLink) {

        event.preventDefault();

        logoutUser();
    }

});


/* =====================================================
   UPDATE STUDENT NAME
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const currentUser = getCurrentUser();


    // Find student name elements
    const nameElements =
        document.querySelectorAll("#sidebarStudentName");


    // Display logged-in student's name
    nameElements.forEach(function (element) {

        if (currentUser && currentUser.name) {

            element.textContent = currentUser.name;

        } else {

            element.textContent = "Student";
        }

    });

});


/* =====================================================
   PAGE LOAD CHECK
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("SmartLib App Loaded Successfully");

});
