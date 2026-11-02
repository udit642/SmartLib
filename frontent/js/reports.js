document.addEventListener("DOMContentLoaded", () => {
    const API = "http://localhost:5000/api";

    const typeInput = document.getElementById("reportType");
    const startInput = document.getElementById("reportStartDate");
    const endInput = document.getElementById("reportEndDate");
    const generateBtn = document.getElementById("generateReport");
    const refreshBtn = document.getElementById("reportRefresh");
    const exportCSVBtn = document.getElementById("exportReportCSV");
    const exportPDFBtn = document.getElementById("exportReportPDF");

    const message = document.getElementById("reportMessage");
    const tableHead = document.getElementById("reportTableHead");
    const tableBody = document.getElementById("reportTableBody");

    const summaryIds = {
        totalIssues: "reportTotalIssues",
        activeIssues: "reportActiveIssues",
        returnedIssues: "reportReturnedIssues",
        overdueIssues: "reportOverdueIssues",
        totalFine: "reportTotalFine"
    };

    let currentRecords = [];
    let currentType = "all";

    function showMessage(text, error = false) {
        if (!message) return;
        message.textContent = text;
        message.style.color = error ? "#dc2626" : "#16a34a";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "-"
            : date.toLocaleDateString("en-IN");
    }

    function setSummary(summary = {}) {
        const values = {
            totalIssues: summary.totalIssues ?? 0,
            activeIssues: summary.activeIssues ?? 0,
            returnedIssues: summary.returnedIssues ?? 0,
            overdueIssues: summary.overdueIssues ?? 0,
            totalFine: "₹" + Number(summary.totalFine ?? 0).toLocaleString("en-IN")
        };

        Object.entries(summaryIds).forEach(([key, id]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = values[key];
        });

        // These two values are available in the API even though
        // the current HTML may not have separate summary cards.
        const books = document.getElementById("reportTotalBooks");
        const students = document.getElementById("reportTotalStudents");

        if (books) books.textContent = summary.totalBooks ?? 0;
        if (students) students.textContent = summary.totalStudents ?? 0;
    }

    function getColumns(type) {
        if (type === "books") {
            return [
                ["Book Title", row => row.title],
                ["Author", row => row.author],
                ["Category", row => row.category],
                ["Total Copies", row => row.totalCopies],
                ["Available Copies", row => row.availableCopies],
                ["Availability", row => row.available ? "Available" : "Unavailable"]
            ];
        }

        if (type === "students") {
            return [
                ["Student Name", row => row.student?.name],
                ["Student ID", row => row.student?.studentId],
                ["Email", row => row.student?.email],
                ["Total Issues", row => row.totalIssues],
                ["Active Issues", row => row.activeIssues],
                ["Returned", row => row.returnedIssues],
                ["Fine", row => row.totalFine]
            ];
        }

        return [
            ["Student", row => row.student?.name],
            ["Student ID", row => row.student?.studentId],
            ["Book", row => row.book?.title],
            ["Author", row => row.book?.author],
            ["Issue Date", row => formatDate(row.issueDate)],
            ["Due Date", row => formatDate(row.dueDate)],
            ["Return Date", row => formatDate(row.returnDate)],
            ["Status", row => row.status],
            ["Fine", row => "₹" + Number(row.fine || 0)]
        ];
    }

    function renderTable(records, type) {
        const columns = getColumns(type);

        if (!tableHead || !tableBody) return;

        tableHead.innerHTML = `
            <tr>
                ${columns.map(col => `<th>${escapeHTML(col[0])}</th>`).join("")}
            </tr>
        `;

        if (!records.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${columns.length}" style="text-align:center;padding:25px;">
                        No records found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = records.map(row => `
            <tr>
                ${columns.map(col => `
                    <td>${escapeHTML(col[1](row) ?? "-")}</td>
                `).join("")}
            </tr>
        `).join("");
    }

    async function loadReports() {
        currentType = typeInput?.value || "all";

        const params = new URLSearchParams();
        params.set("type", currentType);

        if (startInput?.value) params.set("startDate", startInput.value);
        if (endInput?.value) params.set("endDate", endInput.value);

        if (startInput?.value && endInput?.value &&
            startInput.value > endInput.value) {
            showMessage("Start date cannot be after end date.", true);
            return;
        }

        showMessage("Loading report...");

        if (generateBtn) generateBtn.disabled = true;
        if (refreshBtn) refreshBtn.disabled = true;

        try {
            const response = await fetch(`${API}/reports?${params.toString()}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load reports.");
            }

            currentRecords = Array.isArray(result.data) ? result.data : [];

            setSummary(result.summary);
            renderTable(currentRecords, currentType);

            const title = document.getElementById("reportTableTitle");
            if (title) {
                title.textContent =
                    currentType.charAt(0).toUpperCase() +
                    currentType.slice(1) + " Report";
            }

            showMessage(`${result.count ?? currentRecords.length} records loaded successfully.`);
        } catch (error) {
            console.error("Reports error:", error);
            showMessage(error.message || "Server connection failed.", true);

            currentRecords = [];
            renderTable([], currentType);
        } finally {
            if (generateBtn) generateBtn.disabled = false;
            if (refreshBtn) refreshBtn.disabled = false;
        }
    }

    function exportCSV() {
        if (!currentRecords.length) {
            showMessage("There are no records to export.", true);
            return;
        }

        const columns = getColumns(currentType);

        const rows = [
            columns.map(col => col[0]),
            ...currentRecords.map(row =>
                columns.map(col => String(col[1](row) ?? "").replace(/"/g, '""'))
            )
        ];

        const csv = rows.map(row =>
            row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
        ).join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `SmartLib-${currentType}-report.csv`;
        link.click();

        URL.revokeObjectURL(url);
        showMessage("CSV report downloaded successfully.");
    }

    function exportPDF() {
        if (!currentRecords.length) {
            showMessage("There are no records to print.", true);
            return;
        }

        window.print();
    }

    generateBtn?.addEventListener("click", loadReports);
    refreshBtn?.addEventListener("click", loadReports);
    exportCSVBtn?.addEventListener("click", exportCSV);
    exportPDFBtn?.addEventListener("click", exportPDF);

    loadReports();
});
