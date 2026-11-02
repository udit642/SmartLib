// ===============================
// ADMIN LOGIN
// ===============================

const ADMIN_EMAIL = "admin@smartlib.com";
const ADMIN_PASSWORD = "admin123";

function adminLogin() {

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (!email || !password) {
        alert("Login fields not found!");
        return;
    }

    const enteredEmail = email.value.trim();
    const enteredPassword = password.value.trim();

    if (
        enteredEmail === ADMIN_EMAIL &&
        enteredPassword === ADMIN_PASSWORD
    ) {

        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminEmail", enteredEmail);

        alert("Admin Login Successful!");

        window.location.href = "admin-dashboard.html";

    } else {

        alert("Invalid Admin Email or Password!");
    }
}


// ===============================
// ADMIN LOGOUT
// ===============================

function adminLogout() {

    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");

    window.location.href = "login.html";
}


// ===============================
// CHECK ADMIN LOGIN
// ===============================

function checkAdminLogin() {

    const loggedIn = localStorage.getItem("adminLoggedIn");

    if (loggedIn !== "true") {
        window.location.href = "login.html";
    }
}


// ===============================
// YOUR EXISTING BOOK CODE
// ===============================

function renderAdminBooks() { 
 
    const table = document.getElementById("adminBooksTable"); 
 
    if (!table) { 
        return; 
    } 
 
    const books = adminGetBooks(); 
 
    table.innerHTML = ""; 
 
    books.forEach(book => { 
 
        table.innerHTML += ` 
            <tr> 
 
                <td>${book.id}</td> 
 
                <td>${book.title}</td> 
 
                <td>${book.author}</td> 
 
                <td>${book.category}</td> 
 
                <td>${book.quantity}</td> 
 
                <td>${book.available}</td> 
 
                <td> 
 
                    <button 
                        class="small-btn edit-btn" 
                        onclick="editBook('${book.id}')"> 
                        Edit 
                    </button> 
 
                    <button 
                        class="small-btn delete-btn" 
                        onclick="deleteBook('${book.id}')"> 
                        Delete 
                    </button> 
 
                </td> 
 
            </tr> 
        `; 
 
    }); 
}
























function renderAdminBooks() {

    const table = document.getElementById("adminBooksTable");

    if (!table) {
        return;
    }

    const books = adminGetBooks();

    table.innerHTML = "";

    books.forEach(book => {

        table.innerHTML += `
            <tr>

                <td>
                    ${book.id}
                </td>

                <td>
                    ${book.title}
                </td>

                <td>
                    ${book.author}
                </td>

                <td>
                    ${book.category}
                </td>

                <td>
                    ${book.quantity}
                </td>

                <td>
                    ${book.available}
                </td>

                <td>

                    <button
                        class="small-btn edit-btn"
                        onclick="editBook('${book.id}')">
                        Edit
                    </button>

                    <button
                        class="small-btn delete-btn"
                        onclick="deleteBook('${book.id}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });

}