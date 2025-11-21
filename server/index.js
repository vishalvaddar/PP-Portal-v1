const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const fileUpload = require("express-fileupload");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// DIRECTORY CREATION
// ─────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "Data");
const interviewDataDir = path.join(dataDir, "Interview-data"); 
const homeVerificationDataDir = path.join(dataDir, "Home-verification-data");

[uploadsDir, interviewDataDir, homeVerificationDataDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());

// Logging
const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

// ─────────────────────────────────────────────
// STATIC FILE SERVING
// ─────────────────────────────────────────────

// Main Data folder
app.use("/Data", express.static(path.join(__dirname, "Data")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/logs", express.static(path.join(__dirname, "logs")));
app.use("/halltickets", express.static(path.join(__dirname, "public", "halltickets")));

// ─────────────────────────────────────────────
// ROUTES IMPORTS
// ─────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const studentRoutes = require("./routes/studentRoutes");

const applicantRoutes = require("./routes/applicantRoutes");

const bulkUploadRoutes = require("./routes/bulkUploadRoutes");
const searchRoutes = require("./routes/searchRoutes");
const jurisdictionRoutes = require("./routes/jurisdictionRoutes");
const districtRoutes = require("./routes/districtRoutes");
const institutesRoutes = require("./routes/institutesRoutes");
const jurisNamesRoutes = require("./routes/jurisNames");
const generateShortlistRoutes = require("./routes/generateShortlistRoutes");
const shortlistInfoRoutes = require("./routes/shortlistInfoRoutes");
const batchRoutes = require("./routes/batchRoutes");
const userRoleRoutes = require("./routes/userRoleRoutes");
const examRoutes = require("./routes/examRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const evaluationDashboardRoutes = require("./routes/evaluationDashboardRoutes");
const trackingRoutes = require("./routes/trackingRoutes");

const studentSearchRoutes = require("./routes/studentSearchRoutes");
const timetableRoutes = require("./routes/timeTableRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const resultandrankinkRoutes = require("./routes/resultandrankinkRoutes");
const systemConfigRoutes = require("./routes/systemConfigRoutes");

// ─────────────────────────────────────────────
// ROUTES (ALL CLEANED)
// ─────────────────────────────────────────────

// File Uploads
app.use("/api/bulk-upload", bulkUploadRoutes);

app.use("/auth", authRoutes);
app.use("/api/system-config", systemConfigRoutes);

// Applicant Management
app.use("/api/applicants", applicantRoutes);

// Data & Utilities
app.use("/api/batches", batchRoutes);
app.use("/api", userRoleRoutes);
app.use("/api", searchRoutes);
app.use("/api", jurisdictionRoutes);
app.use("/api/juris-names", jurisNamesRoutes);
app.use("/api/institutes", institutesRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api", studentSearchRoutes);
app.use("/api/shortlist/generate", generateShortlistRoutes);
app.use("/api/shortlist-info", shortlistInfoRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/evaluation-dashboard", evaluationDashboardRoutes);
app.use("/api/tracking", trackingRoutes);

// Interviews & Results
app.use("/api/interview", interviewRoutes);
app.use("/api/resultandrank", resultandrankinkRoutes);
app.use("/api/timetable", timetableRoutes);

// ─────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
