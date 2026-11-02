
const API_URL = "http://localhost:5000/api/students";

let students = [];
let editingStudentId = null;

// =====================================
// HTML ELEMENTS
// =====================================

const studentsTable = document.getElementById("studentsTable");
const studentSearch = document.getElementById("studentSearch");

const studentModal = document.getElementById("studentModal");
const studentForm = document.getElementById("studentForm");

const studentCount = document.getElementById("studentCount");
const studentMessage = document.getElementById("studentMessage");

// =====================================
// LOAD STUDENTS
// =====================================

async function loadStudents(search = "") {
    try {
        studentsTable.innerHTML = `
            <tr><td colspan="7">Loading students...</td></tr>
        `;

        const response = await fetch(
            `${API_URL}?search=${encodeURIComponent(search)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load students");
        }

        students = result.data || [];

        renderStudents();

    } catch (error) {
        console.error("Student Loading Error:", error);

        studentsTable.innerHTML = `
            <tr>
                <td colspan="7">Unable to load students. Check backend connection.</td>
            </tr>
        `;
    }
}

// =====================================
// RENDER STUDENTS
// =====================================

function renderStudents() {

    if (studentCount) {
        studentCount.textContent = students.length;
    }

    if (!students.length) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="7">No students found.</td>
            </tr>
        `;
        return;
    }

    studentsTable.innerHTML = students.map(student => `
        <tr>
            <td>${escapeHTML(student.studentId)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>${escapeHTML(student.course)}</td>
            <td>${Number(student.booksIssued || 0)}</td>

            <td>
                <span class="status ${student.status === "Active" ? "active-status" : ""}">
                    ${escapeHTML(student.status)}
                </span>
            </td>

            <td>
                <div class="student-actions">

                    <button
                        class="small-btn edit-btn"
                        onclick="viewStudent('${student._id}')">
                        View
                    </button>

                    <button
                        class="small-btn edit-btn"
                        onclick="editStudent('${student._id}')">
                        Edit
                    </button>

                    <button
                        class="small-btn delete-btn"
                        onclick="deleteStudent('${student._id}')">
                        Remove
                    </button>

                </div>
            </td>
        </tr>
    `).join("");
}

// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// =====================================
// OPEN ADD MODAL
// =====================================

function openAddStudentModal() {

    editingStudentId = null;

    studentForm.reset();

    document.getElementById("studentBooks").value = 0;
    document.getElementById("studentStatus").value = "Active";

    document.getElementById("studentModalTitle").textContent =
        "Add New Student";

    document.getElementById("saveStudentBtn").textContent =
        "Save Student";

    studentMessage.textContent = "";

    studentModal.style.display = "flex";
}

// =====================================
// CLOSE MODAL
// =====================================

function closeStudentModal() {
    studentModal.style.display = "none";
    studentForm.reset();
    editingStudentId = null;
    studentMessage.textContent = "";
}

// =====================================
// ADD STUDENT BUTTON
// =====================================

document.getElementById("addStudentBtn")
    .addEventListener("click", openAddStudentModal);

document.getElementById("closeStudentModal")
    .addEventListener("click", closeStudentModal);

document.getElementById("cancelStudentBtn")
    .addEventListener("click", closeStudentModal);

// Close modal by clicking outside
studentModal.addEventListener("click", event => {
    if (event.target === studentModal) {
        closeStudentModal();
    }
});

// =====================================
// ADD / UPDATE STUDENT
// =====================================

studentForm.addEventListener("submit", async event => {

    event.preventDefault();

    const data = {
        studentId: document.getElementById("studentId").value.trim(),
        name: document.getElementById("studentName").value.trim(),
        email: document.getElementById("studentEmail").value.trim(),
        course: document.getElementById("studentCourse").value.trim(),
        booksIssued: Number(document.getElementById("studentBooks").value),
        status: document.getElementById("studentStatus").value
    };

    const isEditing = Boolean(editingStudentId);

    const url = isEditing
        ? `${API_URL}/${editingStudentId}`
        : API_URL;

    try {

        const saveButton = document.getElementById("saveStudentBtn");

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to save student");
        }

        alert(
            isEditing
                ? "Student updated successfully!"
                : "Student added successfully!"
        );

        closeStudentModal();

        await loadStudents(studentSearch.value.trim());

    } catch (error) {

        alert(error.message);

    } finally {

        const saveButton = document.getElementById("saveStudentBtn");

        saveButton.disabled = false;
        saveButton.textContent = editingStudentId
            ? "Update Student"
            : "Save Student";
    }

});

// =====================================
// SEARCH STUDENTS
// =====================================

studentSearch.addEventListener("input", () => {
    loadStudents(studentSearch.value.trim());
});

// =====================================
// VIEW STUDENT
// =====================================

function viewStudent(id) {

    const student = students.find(item => item._id === id);

    if (!student) return;

    alert(
        `STUDENT DETAILS\n\n` +
        `Student ID: ${student.studentId}\n` +
        `Name: ${student.name}\n` +
        `Email: ${student.email}\n` +
        `Course: ${student.course}\n` +
        `Books Issued: ${student.booksIssued}\n` +
        `Status: ${student.status}`
    );
}

// =====================================
// EDIT STUDENT
// =====================================

function editStudent(id) {

    const student = students.find(item => item._id === id);

    if (!student) return;

    editingStudentId = id;

    document.getElementById("studentId").value = student.studentId;
    document.getElementById("studentName").value = student.name;
    document.getElementById("studentEmail").value = student.email;
    document.getElementById("studentCourse").value = student.course;
    document.getElementById("studentBooks").value = student.booksIssued || 0;
    document.getElementById("studentStatus").value = student.status;

    document.getElementById("studentModalTitle").textContent =
        "Edit Student Details";

    document.getElementById("saveStudentBtn").textContent =
        "Update Student";

    studentMessage.textContent = "";

    studentModal.style.display = "flex";
}

// =====================================
// DELETE STUDENT
// =====================================

async function deleteStudent(id) {

    const student = students.find(item => item._id === id);

    if (!student) return;

    const confirmDelete = confirm(
        `Are you sure you want to remove ${student.name}?`
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to delete student");
        }

        alert("Student deleted successfully!");

        await loadStudents(studentSearch.value.trim());

    } catch (error) {

        alert(error.message);

    }
}

// =====================================
// INITIAL LOAD
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
});
