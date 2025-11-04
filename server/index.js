const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const pool = require("./config/db"); // Ensure DB connection is working
const app = express();
const PORT = process.env.PORT || 5000;

// ───── Directory Definitions and Creation ─────
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "Data");
const interviewDataDir = path.join(dataDir, "Interview-data"); 
const homeVerificationDataDir = path.join(dataDir, "Home-verification-data");

// Create directories
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(interviewDataDir)) {
    fs.mkdirSync(interviewDataDir, { recursive: true });
}
if (!fs.existsSync(homeVerificationDataDir)) {
    fs.mkdirSync(homeVerificationDataDir, { recursive: true });
}


// ───── Middleware ─────
app.use(cors({ origin: "*" }));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ───── Logging Middleware ─────
const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

// ───── Static File Serving (CRITICAL FIX: Consolidate and Simplify) ─────
// 🔥 FIX: This single line replaces all the redundant and conflicting specific static mappings.
app.use('/Data', express.static(path.join(__dirname, '..', 'Data')));

app.use(
    "/uploads/profile_photos",
    express.static(path.join(__dirname, "uploads", "profile_photos"))
);
app.use("/logs", express.static(path.join(__dirname, "logs")));
app.use("/halltickets", express.static(path.join(__dirname, "public", "halltickets")));

// ───── Routes ─────
const authRoutes = require("./routes/authRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const studentRoutes = require("./routes/studentRoutes");

const applicantCreateRoutes = require("./routes/applicantCreateRoutes");
const applicantViewRoutes = require("./routes/applicantViewRoutes");
const applicantUpdateRoutes = require("./routes/applicantUpdateRoutes");
const applicantDeleteRoutes = require("./routes/applicantDeleteRoutes");

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
const trackingRoutes = require('./routes/trackingRoutes'); 

const studentSearchRoutes = require("./routes/studentSearchRoutes");
const timetableRoutes = require("./routes/timeTableRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const resultandrankinkRoutes = require("./routes/resultandrankinkRoutes");
const systemConfigRoutes = require("./routes/systemConfigRoutes");

// ───── Use Routes ─────
app.use("/auth", authRoutes);
app.use("/api/system-config", systemConfigRoutes);
app.use("/api/applicants", applicantCreateRoutes);
app.use("/api/applicants", applicantViewRoutes);
app.use("/api/applicants/update", applicantUpdateRoutes);
app.use("/api/applicants/delete", applicantDeleteRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api", userRoleRoutes);
app.use("/api/upload", bulkUploadRoutes);
app.use("/api/bulk-upload", bulkUploadRoutes);
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
app.use('/api/tracking', trackingRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resultandrank", resultandrankinkRoutes);
app.use("/api/timetable", timetableRoutes);

// ───── 404 Handler ─────
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ───── Start Server ─────
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});