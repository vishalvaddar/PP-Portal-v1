const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const pool = require("./config/db");
const app = express();
const PORT = process.env.PORT || 5000;

// ───── Ensure Uploads Directory ─────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const interviewDataDir = path.join(__dirname, "Data", "Interview-data");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ───── Middleware ─────
app.use(cors({ origin: "*" }));

// ───── Logging Middleware ─────
const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

// ───── Static Files ─────
app.use(
  "/Data/Interview-data",
  express.static(path.join(__dirname, "Data", "Interview-data"))
);
app.use(
  "/Data/Home-verification-data",
  express.static(path.join(__dirname, "Data", "Home-verification-data"))
);
app.use(
  "/uploads/profile_photos",
  express.static(path.join(__dirname, "uploads", "profile_photos"))
);
app.use("/logs", express.static(path.join(__dirname, "logs")));
app.use(
  "/halltickets",
  express.static(path.join(__dirname, "public", "halltickets"))
);

// ───── Routes ─────
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

// ───── Use Routes ─────

app.use("/api/bulk-upload", bulkUploadRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Shortlisting
app.use("/api/shortlist/generate", generateShortlistRoutes);
app.use("/api/shortlist-info", shortlistInfoRoutes);

// Dashboards & Roles
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/student", studentRoutes);

// Exams & Evaluation
app.use("/api/exams", examRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/evaluation-dashboard", evaluationDashboardRoutes);
app.use("/api/tracking", trackingRoutes);

// Interviews & Results
app.use("/api/interview", interviewRoutes);
app.use("/api/resultandrank", resultandrankinkRoutes);

// Timetable
app.use("/api/timetable", timetableRoutes);

// ───── 404 Handler ─────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ───── Start Server ─────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});