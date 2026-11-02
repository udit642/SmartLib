
const IR_API = "http://localhost:5000/api";

let irStudents = [];
let irBooks = [];
let irIssues = [];

const ir = (id) => document.getElementById(id);


// Escape HTML values
function irEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


// Format date
function irDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Get today's date in YYYY-MM-DD format
function irToday() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}


// Compare dates without time
function irDateOnly(value) {
    if (!value) return null;

    const date = new Date(value);

    if (isNaN(date.getTime())) return null;

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}


// Show notification
function irNotify(message, success = false) {
    const box = ir("irMessage");

    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.className = success
        ? "ir-message success"
        : "ir-message error";

    box.style.display = "block";
}


// API request handler
async function irRequest(url, options = {}) {
    let response;

    try {
        response = await fetch(`${IR_API}${url}`, {
            ...options,
            headers: {
                ...(options.body ? {
                    "Content-Type": "application/json"
                } : {}),
                ...(options.headers || {})
            }
        });
    } catch (error) {
        throw new Error(
            "Backend connect nahi ho raha. Check karo ki localhost:5000 server running hai."
        );
    }

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error("Backend se invalid response mila.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `Request failed (${response.status})`
        );
    }

    return result;
}


// Load students, books and issue records
async function irLoadData() {
    const refreshButton = ir("irRefresh");

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
    }

    try {
        const [studentsResult, booksResult, issuesResult] =
            await Promise.all([
                irRequest("/students"),
                irRequest("/books"),
                irRequest("/issues")
            ]);

        irStudents = studentsResult.data || [];
        irBooks = booksResult.data || [];
        irIssues = issuesResult.data || [];

        irRenderStudents();
        irRenderBooks();
        irRenderIssues();
        irUpdateStats();

    } catch (error) {
        console.error("Issue & Return Error:", error);
        irNotify("Data load nahi hua: " + error.message);

    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "↻ Refresh Data";
        }
    }
}


// Render active students
function irRenderStudents() {
    const select = ir("irStudent");

    if (!select) return;

    const activeStudents = irStudents.filter(student =>
        String(student.status || "").toLowerCase() === "active"
    );

    select.innerHTML = `
        <option value="">Select Student</option>

        ${activeStudents.map(student => `
            <option value="${irEscape(student._id)}">
                ${irEscape(student.name)}
                (${irEscape(student.studentId || "")})
            </option>
        `).join("")}
    `;

    if (activeStudents.length === 0) {
        select.innerHTML = `
            <option value="">No active students available</option>
        `;
    }
}


// Render available books
function irRenderBooks() {
    const select = ir("irBook");

    if (!select) return;

    const availableBooks = irBooks.filter(book =>
        Number(book.availableCopies) > 0
    );

    select.innerHTML = `
        <option value="">Select Available Book</option>

        ${availableBooks.map(book => `
            <option value="${irEscape(book._id)}">
                ${irEscape(book.title)}
                — ${Number(book.availableCopies)} available
            </option>
        `).join("")}
    `;

    if (availableBooks.length === 0) {
        select.innerHTML = `
            <option value="">No available books</option>
        `;
    }
}


// Update statistics
function irUpdateStats() {
    const issued = irIssues.filter(issue =>
        issue.status === "Issued"
    );

    const returned = irIssues.filter(issue =>
        issue.status === "Returned"
    );

    const today = irDateOnly(new Date());

    const overdue = issued.filter(issue => {
        const dueDate = irDateOnly(issue.dueDate);

        return dueDate && today && dueDate < today;
    });

    const totalFine = returned.reduce(
        (sum, issue) => sum + Number(issue.fine || 0),
        0
    );

    if (ir("irTotalIssued")) {
        ir("irTotalIssued").textContent = issued.length;
    }

    if (ir("irOverdue")) {
        ir("irOverdue").textContent = overdue.length;
    }

    if (ir("irTotalReturned")) {
        ir("irTotalReturned").textContent = returned.length;
    }

    if (ir("irFine")) {
        ir("irFine").textContent = "₹" + totalFine;
    }
}


// Render issue and return records
function irRenderIssues() {
    const tbody = ir("irIssuesTable");

    if (!tbody) return;

    const filter = ir("irStatusFilter")?.value || "All";

    const filtered = irIssues.filter(issue =>
        filter === "All" || issue.status === filter
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="ir-empty">
                    No issue records found.
                </td>
            </tr>
        `;
        return;
    }

    const today = irDateOnly(new Date());

    tbody.innerHTML = filtered.map(issue => {
        const student = issue.student || {};
        const book = issue.book || {};

        const isIssued = issue.status === "Issued";

        const dueDate = irDateOnly(issue.dueDate);

        const isOverdue = isIssued &&
            dueDate && today && dueDate < today;

        const lateDays = isOverdue
            ? Math.floor((today - dueDate) / 86400000)
            : 0;

        // ₹10 per overdue day
        const estimatedFine = lateDays * 10;

        const fine = isIssued
            ? estimatedFine
            : Number(issue.fine || 0);

        return `
            <tr>
                <td>
                    <strong>${irEscape(student.name || "Unknown")}</strong>
                    <small>${irEscape(student.studentId || "")}</small>
                </td>

                <td>
                    <strong>${irEscape(book.title || "Unknown")}</strong>
                    <small>${irEscape(book.author || "")}</small>
                </td>

                <td>
                    ${irDate(issue.issueDate || issue.createdAt)}
                </td>

                <td>${irDate(issue.dueDate)}</td>

                <td>
                    <span class="ir-status ${
                        isIssued
                            ? (isOverdue ? "overdue" : "issued")
                            : "returned"
                    }">
                        ${isIssued
                            ? (isOverdue ? "Overdue" : "Issued")
                            : "Returned"}
                    </span>
                </td>

                <td>₹${fine}</td>

                <td>
                    ${
                        isIssued
                            ? `
                                <button
                                    type="button"
                                    class="ir-return-btn"
                                    data-issue-id="${irEscape(issue._id)}">
                                    Return Book
                                </button>
                            `
                            : `<span class="ir-returned-label">Completed</span>`
                    }
                </td>
            </tr>
        `;
    }).join("");
}


// Issue a book
async function irIssueBook(event) {
    event.preventDefault();

    const studentId = ir("irStudent")?.value;
    const bookId = ir("irBook")?.value;
    const dueDate = ir("irDueDate")?.value;

    if (!studentId || !bookId || !dueDate) {
        irNotify("Please select student, book and due date.");
        return;
    }

    if (dueDate < irToday()) {
        irNotify("Due date cannot be in the past.");
        return;
    }

    const submitButton = ir("irIssueForm")?.querySelector(
        'button[type="submit"]'
    );

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Issuing...";
        }

        // Convert selected date to ISO format
        const due = new Date(`${dueDate}T23:59:59`);

        await irRequest("/issues", {
            method: "POST",
            body: JSON.stringify({
                studentId,
                bookId,
                dueDate: due.toISOString()
            })
        });

        ir("irIssueForm").reset();

        if (ir("irDueDate")) {
            ir("irDueDate").min = irToday();
        }

        irNotify("Book issued successfully!", true);

        await irLoadData();

    } catch (error) {
        console.error("Issue Book Error:", error);
        irNotify(error.message);

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "+ Issue Book";
        }
    }
}


// Return a book
async function irReturnBook(issueId) {
    if (!issueId) return;

    const confirmed = confirm(
        "Are you sure you want to return this book?"
    );

    if (!confirmed) return;

    try {
        const result = await irRequest(
            `/issues/${encodeURIComponent(issueId)}/return`,
            { method: "PUT" }
        );

        const fine = Number(result.data?.fine || 0);

        irNotify(
            `Book returned successfully! Fine: ₹${fine}`,
            true
        );

        await irLoadData();

    } catch (error) {
        console.error("Return Book Error:", error);
        irNotify(error.message);
    }
}


// Initialize Issue & Return section
document.addEventListener("DOMContentLoaded", () => {

    const form = ir("irIssueForm");

    if (form) {
        form.addEventListener("submit", irIssueBook);
    }

    const filter = ir("irStatusFilter");

    if (filter) {
        filter.addEventListener("change", irRenderIssues);
    }

    const dueDateInput = ir("irDueDate");

    if (dueDateInput) {
        dueDateInput.min = irToday();
    }

    const refreshButton = ir("irRefresh");

    if (refreshButton) {
        refreshButton.addEventListener("click", irLoadData);
    }

    // Return button click handling
    const issuesTable = ir("irIssuesTable");

    if (issuesTable) {
        issuesTable.addEventListener("click", event => {
            const button = event.target.closest(
                ".ir-return-btn"
            );

            if (!button) return;

            const issueId = button.dataset.issueId;

            irReturnBook(issueId);
        });
    }

    // Initial data load
    irLoadData();
});
