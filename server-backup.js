
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// =====================================
// BOOK SCHEMA
// =====================================

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, default: "Other" },
  isbn: { type: String, default: "" },
  totalCopies: { type: Number, default: 1, min: 1 },
  availableCopies: { type: Number, default: 1, min: 0 },
  publisher: { type: String, default: "" },
  publicationYear: { type: Number, default: null },
  description: { type: String, default: "" },
  available: { type: Boolean, default: true }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);

// =====================================
// STUDENT SCHEMA
// =====================================

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  course: { type: String, required: true, trim: true },
  booksIssued: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

// =====================================
// ISSUE SCHEMA
// =====================================

const issueSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  status: { type: String, enum: ["Issued", "Returned"], default: "Issued" },
  fine: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

const Issue = mongoose.model("Issue", issueSchema);

// =====================================
// HOME & HEALTH
// =====================================

app.get("/", (req, res) => {
  res.json({ success: true, message: "SmartLib Backend Running Successfully" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// =====================================
// BOOK APIs
// =====================================

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const {
      title, author, category, isbn, totalCopies,
      availableCopies, publisher, publicationYear, description
    } = req.body;

    if (!title?.trim() || !author?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and author are required"
      });
    }

    const total = Number(totalCopies ?? 1);
    const available = Number(availableCopies ?? total);

    if (!Number.isInteger(total) || !Number.isInteger(available) ||
        total < 1 || available < 0 || available > total) {
      return res.status(400).json({
        success: false,
        message: "Invalid total or available copies"
      });
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category, isbn,
      totalCopies: total,
      availableCopies: available,
      publisher,
      publicationYear: publicationYear || null,
      description,
      available: available > 0
    });

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const {
      title, author, category, isbn, totalCopies,
      availableCopies, publisher, publicationYear, description
    } = req.body;

    const total = Number(totalCopies);
    const available = Number(availableCopies);

    if (!title?.trim() || !author?.trim() ||
        !Number.isInteger(total) || !Number.isInteger(available) ||
        total < 1 || available < 0 || available > total) {
      return res.status(400).json({
        success: false,
        message: "Invalid book details or copies"
      });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, {
      title: title.trim(),
      author: author.trim(),
      category, isbn,
      totalCopies: total,
      availableCopies: available,
      publisher,
      publicationYear: publicationYear || null,
      description,
      available: available > 0
    }, { new: true, runValidators: true });

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book updated successfully", data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const activeIssue = await Issue.findOne({
      book: req.params.id,
      status: "Issued"
    });

    if (activeIssue) {
      return res.status(409).json({
        success: false,
        message: "Return the active book before deleting"
      });
    }

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// STUDENT APIs
// =====================================

app.get("/api/students", async (req, res) => {
  try {
    const search = req.query.search;
    const filter = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    } : {};

    const students = await Student.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { studentId, name, email, course, status } = req.body;

    if (!studentId?.trim() || !name?.trim() ||
        !email?.trim() || !course?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Student ID, name, email and course are required"
      });
    }

    const student = await Student.create({
      studentId: studentId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      course: course.trim(),
      status: status || "Active"
    });

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: student
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? "Student ID or email already exists" : error.message
    });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const { studentId, name, email, course, status } = req.body;

    if (!studentId?.trim() || !name?.trim() ||
        !email?.trim() || !course?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Student details are required"
      });
    }

    const student = await Student.findByIdAndUpdate(req.params.id, {
      studentId: studentId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      course: course.trim(),
      status: status || "Active"
    }, { new: true, runValidators: true });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student updated successfully", data: student });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? "Student ID or email already exists" : error.message
    });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const activeIssue = await Issue.findOne({
      student: req.params.id,
      status: "Issued"
    });

    if (activeIssue) {
      return res.status(409).json({
        success: false,
        message: "Return the student's books before deleting"
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// ISSUE & RETURN APIs
// =====================================

app.get("/api/issues", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const issues = await Issue.find(filter)
      .populate("student", "studentId name email course")
      .populate("book", "title author isbn")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ISSUE BOOK - handles old records missing availableCopies
app.post("/api/issues", async (req, res) => {
  let reservedBookId = null;

  try {
    const { studentId, bookId, dueDate } = req.body;

    if (!mongoose.isValidObjectId(studentId) ||
        !mongoose.isValidObjectId(bookId) || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Valid student, book and due date are required"
      });
    }

    const due = new Date(dueDate);

    if (Number.isNaN(due.getTime()) || due <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be a valid future date"
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.status !== "Active") {
      return res.status(400).json({ success: false, message: "Student is inactive" });
    }

    // Atomically handle missing availableCopies in older MongoDB records
    const book = await Book.findOneAndUpdate(
      {
        _id: bookId,
        $or: [
          { availableCopies: { $gt: 0 } },
          {
            availableCopies: { $exists: false },
            totalCopies: { $gt: 0 }
          }
        ]
      },
      [
        {
          $set: {
            availableCopies: {
              $cond: [
                { $eq: [{ $type: "$availableCopies" }, "missing"] },
                { $subtract: ["$totalCopies", 1] },
                { $subtract: ["$availableCopies", 1] }
              ]
            },
            available: {
              $gt: [
                {
                  $cond: [
                    { $eq: [{ $type: "$availableCopies" }, "missing"] },
                    { $subtract: ["$totalCopies", 1] },
                    { $subtract: ["$availableCopies", 1] }
                  ]
                },
                0
              ]
            }
          }
        }
      ],
      { new: true }
    );

    if (!book) {
      return res.status(400).json({
        success: false,
        message: "Book not found or no copies available"
      });
    }

    reservedBookId = book._id;

    const issue = await Issue.create({
      student: student._id,
      book: book._id,
      dueDate: due,
      status: "Issued"
    });

    await Student.findByIdAndUpdate(student._id, {
      $inc: { booksIssued: 1 }
    });

    reservedBookId = null;

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: issue
    });

  } catch (error) {
    if (reservedBookId) {
      await Book.findByIdAndUpdate(reservedBookId, [
        {
          $set: {
            availableCopies: { $add: [{ $ifNull: ["$availableCopies", 0] }, 1] },
            available: true
          }
        }
      ]).catch(() => {});
    }

    console.error("Issue API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// RETURN BOOK
app.put("/api/issues/:id/return", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid issue ID" });
    }

    const issue = await Issue.findOne({
      _id: req.params.id,
      status: "Issued"
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Active issue not found or already returned"
      });
    }

    const now = new Date();
    const due = new Date(issue.dueDate);
    const lateDays = Math.ceil(Math.max(0, now - due) / 86400000);
    const fine = lateDays * 10;

    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: issue._id, status: "Issued" },
      { $set: { status: "Returned", returnDate: now, fine } },
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(409).json({
        success: false,
        message: "Book already returned"
      });
    }

    try {
      await Book.findByIdAndUpdate(issue.book, [
        {
          $set: {
            availableCopies: { $add: [{ $ifNull: ["$availableCopies", 0] }, 1] },
            available: true
          }
        }
      ]);

      await Student.findByIdAndUpdate(issue.student, {
        $inc: { booksIssued: -1 }
      });
    } catch (updateError) {
      await Issue.findByIdAndUpdate(issue._id, {
        $set: { status: "Issued", returnDate: null, fine: 0 }
      });
      throw updateError;
    }

    res.json({
      success: true,
      message: "Book returned successfully",
      fine,
      lateDays,
      data: updatedIssue
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// REPORTS API
// =====================================

app.get("/api/reports", async (req, res) => {
  try {
    const { type = "all", startDate, endDate } = req.query;

    const allowedTypes = ["all", "issued", "returned", "overdue", "fine", "students", "books"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid report type" });
    }

    const issueQuery = {};
    const dateFilter = {};

    if (startDate) {
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid start date" });
      }
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid end date" });
      }
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    if (dateFilter.$gte && dateFilter.$lte && dateFilter.$gte > dateFilter.$lte) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }

    if (Object.keys(dateFilter).length) issueQuery.issueDate = dateFilter;
    if (type === "issued") issueQuery.status = "Issued";
    if (type === "returned") issueQuery.status = "Returned";

    if (type === "overdue") {
      issueQuery.status = "Issued";
      issueQuery.dueDate = { $lt: new Date() };
    }

    if (type === "fine") issueQuery.fine = { $gt: 0 };

    const [issues, totalBooks, totalStudents, books] = await Promise.all([
      Issue.find(issueQuery)
        .populate("student", "name studentId email course")
        .populate("book", "title author category isbn")
        .sort({ issueDate: -1 })
        .lean(),
      Book.countDocuments(),
      Student.countDocuments(),
      Book.find().select("title author category totalCopies availableCopies available").sort({ title: 1 }).lean()
    ]);

    const now = new Date();

    const overdueIssues = issues.filter(i =>
      i.status === "Issued" && new Date(i.dueDate) < now
    ).length;

    const totalFine = issues.reduce((sum, i) => sum + (Number(i.fine) || 0), 0);

    let records = issues;

    if (type === "books") records = books;

    if (type === "students") {
      const map = new Map();

      issues.forEach(i => {
        if (!i.student) return;

        const id = String(i.student._id);

        if (!map.has(id)) {
          map.set(id, {
            student: i.student,
            totalIssues: 0,
            activeIssues: 0,
            returnedIssues: 0,
            totalFine: 0
          });
        }

        const row = map.get(id);
        row.totalIssues++;
        if (i.status === "Issued") row.activeIssues++;
        if (i.status === "Returned") row.returnedIssues++;
        row.totalFine += Number(i.fine) || 0;
      });

      records = Array.from(map.values());
    }

    res.json({
      success: true,
      filters: { type, startDate: startDate || null, endDate: endDate || null },
      summary: {
        totalBooks,
        totalStudents,
        totalIssues: issues.length,
        activeIssues: issues.filter(i => i.status === "Issued").length,
        returnedIssues: issues.filter(i => i.status === "Returned").length,
        overdueIssues,
        totalFine
      },
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error("Reports API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// START SERVER
// =====================================

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`SmartLib backend running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
