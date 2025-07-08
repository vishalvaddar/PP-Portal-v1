const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ───────────────────────────────────────────────
// Middleware
// ───────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// ───────────────────────────────────────────────
// Static files
// ───────────────────────────────────────────────
app.use("/uploads/profile_photos", express.static(path.join(__dirname, "uploads", "profile_photos")));
app.use("/logs", express.static(path.join(__dirname, "logs")));

// ───────────────────────────────────────────────
// Route Imports
// ───────────────────────────────────────────────
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const studentRoutes = require('./routes/studentRoutes');

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

const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const userRoleRoutes = require("./routes/userRoleRoutes");

const examRoutes = require('./routes/examRoutes');
const examCentres = require('./routes/examRoutes');

// ───────────────────────────────────────────────
// API Routes
// ───────────────────────────────────────────────

// Authentication
app.use("/auth", authRoutes);

// Applicant Routes
app.use("/applicants/create", applicantCreateRoutes);
app.use("/applicants", applicantViewRoutes);
app.use("/applicants/update", applicantUpdateRoutes);
app.use("/applicants/delete", applicantDeleteRoutes);

// Core API
app.use("/api/batches", batchRoutes);
app.use("/api", userRoleRoutes);

app.use("/api/bulk-upload", bulkUploadRoutes);
app.use("/api/search", searchRoutes);
app.use("/api", jurisdictionRoutes);
app.use("/api/shortlist/generate", generateShortlistRoutes);
app.use("/api/shortlist/info", shortlistInfoRoutes);

// Jurisdiction metadata (suggested to be under /api for clarity)
app.use("/api/juris-names", jurisNamesRoutes);
app.use("/api/institutes", institutesRoutes);
app.use("/api/districts", districtRoutes);

// Other Interfaces
app.use("/admin-dashboard", adminDashboardRoutes);
app.use("/coordinator", coordinatorRoutes);
app.use("/student", studentRoutes);

//Exam api
app.use('/api/exams', examRoutes);
app.use('/halltickets', express.static(path.join(__dirname, 'public/halltickets')));
app.use("/api/exam-centres",examCentres)

// ───────────────────────────────────────────────
// Fallback for Unknown Routes
// ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ───────────────────────────────────────────────
// Server Listener
// ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
