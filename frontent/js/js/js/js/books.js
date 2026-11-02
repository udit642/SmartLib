/* =====================================================
   SMARTLIB - STUDENT BOOK BROWSER
   ===================================================== */

const BOOK_STORAGE_KEY = "smartLibBooks";
const ISSUE_STORAGE_KEY = "smartLibIssuedBooks";

let books = [];
let selectedBookId = null;


/* =====================================================
   GET BOOKS
   ===================================================== */

function getBooks() {

    try {

        const data =
            localStorage.getItem(BOOK_STORAGE_KEY);

        if (!data) {
            return [];
        }

        const parsed = JSON.parse(data);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {

        console.error(
            "Error loading books:",
            error
        );

        return [];

    }

}


/* =====================================================
   SAVE BOOKS
   ===================================================== */

function saveBooks(data) {

    localStorage.setItem(
        BOOK_STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =====================================================
   GET ISSUED BOOKS
   ===================================================== */

function getIssuedBooks() {

    try {

        const data =
            localStorage.getItem(ISSUE_STORAGE_KEY);

        if (!data) {
            return [];
        }

        const parsed = JSON.parse(data);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {

        return [];

    }

}


/* =====================================================
   SAVE ISSUED BOOKS
   ===================================================== */

function saveIssuedBooks(data) {

    localStorage.setItem(
        ISSUE_STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   LOAD CATEGORIES
   ===================================================== */

function loadCategories() {

    const categorySelect =
        document.getElementById("category");

    const categories = [];

    books.forEach(function(book) {

        const category =
            String(book.category || "").trim();

        if (
            category &&
            !categories.includes(category)
        ) {

            categories.push(category);

        }

    });


    categories.sort();


    categorySelect.innerHTML =
        `<option value="all">
            All Categories
        </option>`;


    categories.forEach(function(category) {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categorySelect.appendChild(option);

    });

}


/* =====================================================
   RENDER BOOKS
   ===================================================== */

function renderBooks(filteredBooks = books) {

    const container =
        document.getElementById("booksContainer");

    const count =
        document.getElementById("bookCount");


    container.innerHTML = "";

    count.textContent =
        filteredBooks.length;


    if (filteredBooks.length === 0) {

        container.innerHTML = `

            <div class="no-books">

                <div style="font-size:55px;">
                    📚
                </div>

                <h2>No Books Found</h2>

                <p>
                    Try changing your search filters.
                </p>

            </div>

        `;

        return;

    }


    filteredBooks.forEach(function(book) {

        const available =
            Number(book.available) || 0;


        const total =
            Number(book.copies) || 0;


        const status =
            available > 0
                ? "Available"
                : "Not Available";


        const statusClass =
            available > 0
                ? "available"
                : "unavailable";


        const card =
            document.createElement("div");


        card.className =
            "dynamic-book-card";


        card.innerHTML = `

            <div class="dynamic-book-image">
                📖
            </div>


            <div class="dynamic-book-info">

                <span class="dynamic-category">

                    ${escapeHTML(
                        book.category || "General"
                    )}

                </span>


                <h3>

                    ${escapeHTML(
                        book.title
                    )}

                </h3>


                <p class="author">

                    ${escapeHTML(
                        book.author
                    )}

                </p>


                <div class="book-details">

                    <span>
                        🔢 ISBN:
                        ${escapeHTML(
                            book.isbn || "N/A"
                        )}
                    </span>


                    <span>
                        📅 Year:
                        ${escapeHTML(
                            book.year || "N/A"
                        )}
                    </span>


                    <span>
                        📚 Total Copies:
                        ${total}
                    </span>

                </div>


                <div
                    class="book-status ${statusClass}">

                    ${available > 0
                        ? `✓ Available (${available})`
                        : "✕ Not Available"
                    }

                </div>


                <div class="card-buttons">

                    <button
                        class="view-btn"
                        onclick="viewBook(${book.id})">

                        👁 View Details

                    </button>


                    <button
                        class="issue-btn"
                        onclick="issueBook(${book.id})"
                        ${available <= 0 ? "disabled" : ""}>

                        📚 Issue Book

                    </button>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


/* =====================================================
   ADVANCED SEARCH
   ===================================================== */

function searchBooks() {

    const bookName =
        document
            .getElementById("bookName")
            .value
            .trim()
            .toLowerCase();


    const author =
        document
            .getElementById("author")
            .value
            .trim()
            .toLowerCase();


    const category =
        document
            .getElementById("category")
            .value;


    const isbn =
        document
            .getElementById("isbn")
            .value
            .trim()
            .toLowerCase();


    const availability =
        document
            .getElementById("availability")
            .value;


    const year =
        document
            .getElementById("year")
            .value
            .trim();


    const filtered =
        books.filter(function(book) {


            const title =
                String(
                    book.title || ""
                ).toLowerCase();


            const bookAuthor =
                String(
                    book.author || ""
                ).toLowerCase();


            const bookCategory =
                String(
                    book.category || ""
                );


            const bookISBN =
                String(
                    book.isbn || ""
                ).toLowerCase();


            const bookYear =
                String(
                    book.year || ""
                );


            const available =
                Number(
                    book.available || 0
                );


            const matchesTitle =
                !bookName ||
                title.includes(bookName);


            const matchesAuthor =
                !author ||
                bookAuthor.includes(author);


            const matchesCategory =
                category === "all" ||
                bookCategory === category;


            const matchesISBN =
                !isbn ||
                bookISBN.includes(isbn);


            const matchesYear =
                !year ||
                bookYear === year;


            let matchesAvailability = true;


            if (availability === "available") {

                matchesAvailability =
                    available > 0;

            }


            if (availability === "unavailable") {

                matchesAvailability =
                    available <= 0;

            }


            return (

                matchesTitle &&
                matchesAuthor &&
                matchesCategory &&
                matchesISBN &&
                matchesYear &&
                matchesAvailability

            );

        });


    renderBooks(filtered);

}


/* =====================================================
   RESET SEARCH
   ===================================================== */

function resetSearch() {

    document.getElementById(
        "bookName"
    ).value = "";


    document.getElementById(
        "author"
    ).value = "";


    document.getElementById(
        "category"
    ).value = "all";


    document.getElementById(
        "isbn"
    ).value = "";


    document.getElementById(
        "availability"
    ).value = "all";


    document.getElementById(
        "year"
    ).value = "";


    renderBooks();

}


/* =====================================================
   VIEW BOOK DETAILS
   ===================================================== */

function viewBook(id) {

    const book =
        books.find(function(item) {

            return Number(item.id) ===
                   Number(id);

        });


    if (!book) {

        alert("Book not found.");

        return;

    }


    selectedBookId =
        Number(id);


    document.getElementById(
        "modalTitle"
    ).textContent =
        book.title;


    document.getElementById(
        "modalDetails"
    ).innerHTML = `

        <div class="detail-row">

            <span class="detail-label">
                Author
            </span>

            <span>
                ${escapeHTML(book.author)}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Category
            </span>

            <span>
                ${escapeHTML(book.category)}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                ISBN
            </span>

            <span>
                ${escapeHTML(book.isbn || "N/A")}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Publisher
            </span>

            <span>
                ${escapeHTML(book.publisher || "N/A")}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Publication Year
            </span>

            <span>
                ${escapeHTML(book.year || "N/A")}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Total Copies
            </span>

            <span>
                ${Number(book.copies) || 0}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Available
            </span>

            <span>

                ${Number(book.available) || 0}

            </span>

        </div>


        <div class="modal-description">

            <strong>
                Description
            </strong>

            <p>

                ${escapeHTML(
                    book.description ||
                    "No description available."
                )}

            </p>

        </div>

    `;


    const issueButton =
        document.getElementById(
            "modalIssueBtn"
        );


    issueButton.disabled =
        Number(book.available) <= 0;


    issueButton.textContent =
        Number(book.available) > 0
            ? "📚 Issue Book"
            : "✕ Not Available";


    issueButton.onclick =
        function() {

            issueBook(book.id);

        };


    document.getElementById(
        "bookModal"
    ).classList.add("show");

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeBookModal() {

    document.getElementById(
        "bookModal"
    ).classList.remove("show");

}


/* =====================================================
   ISSUE BOOK
   ===================================================== */

function issueBook(id) {

    const index =
        books.findIndex(function(book) {

            return Number(book.id) ===
                   Number(id);

        });


    if (index === -1) {

        alert("Book not found.");

        return;

    }


    const book =
        books[index];


    if (Number(book.available) <= 0) {

        alert(
            "Sorry, this book is not available."
        );

        return;

    }


    /* Current logged-in student */

    let currentUser = null;


    try {

        currentUser =
            JSON.parse(
                localStorage.getItem(
                    "smartLibCurrentUser"
                )
            );

    } catch (error) {

        currentUser = null;

    }


    const studentName =
        currentUser?.name ||
        currentUser?.username ||
        currentUser?.email ||
        "Student";


    /* Decrease available copies */

    book.available =
        Number(book.available) - 1;


    books[index] =
        book;


    saveBooks(books);


    /* Save issue record */

    const issuedBooks =
        getIssuedBooks();


    const issueRecord = {

        id: Date.now(),

        bookId: book.id,

        title: book.title,

        author: book.author,

        isbn: book.isbn,

        student: studentName,

        issueDate:
            new Date()
                .toISOString()
                .split("T")[0],

        status: "Issued"

    };


    issuedBooks.push(issueRecord);


    saveIssuedBooks(
        issuedBooks
    );


    alert(
        `"${book.title}" has been issued successfully!`
    );


    closeBookModal();


    /* Refresh */

    books =
        getBooks();


    renderBooks();


}


/* =====================================================
   LIVE SEARCH
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        books =
            getBooks();


        loadCategories();


        renderBooks();


        const inputs = [

            "bookName",
            "author",
            "isbn",
            "year"

        ];


        inputs.forEach(function(id) {

            document
                .getElementById(id)
                .addEventListener(
                    "input",
                    searchBooks
                );

        });


        document
            .getElementById("category")
            .addEventListener(
                "change",
                searchBooks
            );


        document
            .getElementById("availability")
            .addEventListener(
                "change",
                searchBooks
            );


        document
            .getElementById("bookModal")
            .addEventListener(
                "click",
                function(event) {

                    if (
                        event.target ===
                        this
                    ) {

                        closeBookModal();

                    }

                }
            );


        console.log(
            "SmartLib Books Loaded Successfully"
        );

    }
);