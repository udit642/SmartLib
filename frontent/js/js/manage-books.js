
const API_URL = "http://localhost:5000/api/books";

let allBooks = [];
let deleteBookId = null;

// DOM Elements
const bookForm = document.getElementById("bookForm");
const bookModal = document.getElementById("bookModal");
const deleteModal = document.getElementById("deleteModal");
const booksTableBody = document.getElementById("booksTableBody");

const bookSearch = document.getElementById("bookSearch");
const categoryFilter = document.getElementById("categoryFilter");

// Safe HTML text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Show notification
function notify(message) {
    if (typeof showMessage === "function") {
        showMessage(message);
    } else {
        alert(message);
    }
}

// Open Add Book Modal
function openAddModal() {
    bookForm.reset();

    document.getElementById("bookId").value = "";
    document.getElementById("bookCopies").value = 1;
    document.getElementById("bookAvailable").value = 1;
    document.getElementById("modalTitle").textContent = "➕ Add New Book";

    bookModal.style.display = "flex";
}

// Close Add/Edit Modal
function closeBookModal() {
    bookModal.style.display = "none";
}

// Load Books from MongoDB
async function loadBooks() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load books");
        }

        allBooks = result.data || [];
        renderBooks();

    } catch (error) {
        console.error("Load books error:", error);
        notify("Unable to load books. Check your backend server.");
    }
}

// Display Books
function renderBooks() {
    const searchText = bookSearch.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    const filteredBooks = allBooks.filter(book => {

        const matchesSearch =
            (book.title || "").toLowerCase().includes(searchText) ||
            (book.author || "").toLowerCase().includes(searchText) ||
            (book.isbn || "").toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            book.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    booksTableBody.innerHTML = "";

    filteredBooks.forEach(book => {

        const total = Number(book.totalCopies ?? 1);
        const available = Number(book.availableCopies ?? (book.available ? 1 : 0));
        const issued = total - available;

        const status = available > 0
            ? '<span class="status-badge available">Available</span>'
            : '<span class="status-badge unavailable">Out of Stock</span>';

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>${escapeHTML(book.title)}</strong>
            </td>

            <td>${escapeHTML(book.author)}</td>

            <td>${escapeHTML(book.category || "Other")}</td>

            <td>${escapeHTML(book.isbn || "N/A")}</td>

            <td>${total}</td>

            <td>${available}</td>

            <td>${status}</td>

            <td>
                <button type="button"
                    class="edit-book-btn"
                    data-action="edit"
                    data-id="${escapeHTML(book._id)}">
                    ✏️ Edit
                </button>

                <button type="button"
                    class="delete-book-btn"
                    data-action="delete"
                    data-id="${escapeHTML(book._id)}">
                    🗑️ Delete
                </button>
            </td>
        `;

        booksTableBody.appendChild(row);
    });

    // Summary
    const totalCopies = allBooks.reduce(
        (sum, book) => sum + Number(book.totalCopies ?? 1), 0
    );

    const availableCopies = allBooks.reduce(
        (sum, book) => sum + Number(book.availableCopies ?? (book.available ? 1 : 0)), 0
    );

    document.getElementById("bookCount").textContent = allBooks.length;

    document.getElementById("totalCopies").textContent = totalCopies;

    document.getElementById("availableCopies").textContent = availableCopies;

    document.getElementById("issuedCopies").textContent =
        totalCopies - availableCopies;

    // Empty state
    const emptyMessage = document.getElementById("emptyBooksMessage");

    emptyMessage.style.display =
        filteredBooks.length === 0 ? "block" : "none";
}

// Add or Update Book
bookForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const bookId = document.getElementById("bookId").value;

    const totalCopies = Number(
        document.getElementById("bookCopies").value
    );

    const availableCopies = Number(
        document.getElementById("bookAvailable").value
    );

    if (
        !Number.isInteger(totalCopies) ||
        !Number.isInteger(availableCopies) ||
        totalCopies < 1 ||
        availableCopies < 0 ||
        availableCopies > totalCopies
    ) {
        notify("Please enter valid book copies.");
        return;
    }

    const bookData = {
        title: document.getElementById("bookTitle").value.trim(),
        author: document.getElementById("bookAuthor").value.trim(),
        category: document.getElementById("bookCategory").value,
        isbn: document.getElementById("bookISBN").value.trim(),
        totalCopies,
        availableCopies,
        publisher: document.getElementById("bookPublisher").value.trim(),
        publicationYear:
            document.getElementById("bookYear").value || null,
        description:
            document.getElementById("bookDescription").value.trim()
    };

    try {
        const response = await fetch(
            bookId ? `${API_URL}/${bookId}` : API_URL,
            {
                method: bookId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bookData)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Operation failed");
        }

        notify(result.message);

        closeBookModal();
        await loadBooks();

    } catch (error) {
        console.error("Save book error:", error);
        notify(error.message);
    }
});

// Edit Book
function editBook(id) {

    const book = allBooks.find(item => item._id === id);

    if (!book) return;

    document.getElementById("bookId").value = book._id;
    document.getElementById("bookTitle").value = book.title || "";
    document.getElementById("bookAuthor").value = book.author || "";
    document.getElementById("bookCategory").value = book.category || "Other";
    document.getElementById("bookISBN").value = book.isbn || "";
    document.getElementById("bookCopies").value = book.totalCopies ?? 1;
    document.getElementById("bookAvailable").value =
        book.availableCopies ?? (book.available ? 1 : 0);

    document.getElementById("bookPublisher").value = book.publisher || "";
    document.getElementById("bookYear").value = book.publicationYear || "";
    document.getElementById("bookDescription").value = book.description || "";

    document.getElementById("modalTitle").textContent = "✏️ Edit Book";

    bookModal.style.display = "flex";
}

// Open Delete Confirmation
function confirmDelete(id) {

    deleteBookId = id;

    deleteModal.style.display = "flex";
}

// Delete Book
async function deleteBook() {

    if (!deleteBookId) return;

    try {
        const response = await fetch(
            `${API_URL}/${deleteBookId}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Delete failed");
        }

        notify(result.message);

        deleteModal.style.display = "none";
        deleteBookId = null;

        await loadBooks();

    } catch (error) {
        console.error("Delete book error:", error);
        notify(error.message);
    }
}

// Table Action Buttons
booksTableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
        editBook(id);
    }

    if (button.dataset.action === "delete") {
        confirmDelete(id);
    }
});

// Button Events
document.getElementById("openAddBookBtn")
    .addEventListener("click", openAddModal);

document.getElementById("emptyAddBookBtn")
    .addEventListener("click", openAddModal);

document.getElementById("closeBookModal")
    .addEventListener("click", closeBookModal);

document.getElementById("cancelBookBtn")
    .addEventListener("click", closeBookModal);

document.getElementById("cancelDeleteBtn")
    .addEventListener("click", () => {
        deleteModal.style.display = "none";
        deleteBookId = null;
    });

document.getElementById("confirmDeleteBtn")
    .addEventListener("click", deleteBook);

// Search
bookSearch.addEventListener("input", renderBooks);

// Category Filter
categoryFilter.addEventListener("change", renderBooks);

// Reset Filters
document.getElementById("clearFiltersBtn")
    .addEventListener("click", () => {
        bookSearch.value = "";
        categoryFilter.value = "all";
        renderBooks();
    });

// Logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function(event) {
        event.preventDefault();

        if (typeof logoutUser === "function") {
            logoutUser();
        } else {
            window.location.href = "index.html";
        }
    });
}

// Load books when page opens
document.addEventListener("DOMContentLoaded", loadBooks);
