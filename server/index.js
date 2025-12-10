const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const fs = require("fs");
const multer = require("multer");

const pool = require("./config/db");
const app = express();
const PORT = process.env.PORT || 5000;

// ────────────────────────────────
// PATHS & DIRECTORIES
// ────────────────────────────────
const PROJECT_ROOT_DIR = path.join(__dirname, "..");
const dataDir = path.join(PROJECT_ROOT_DIR, "Data");
const interviewDataDir = path.join(dataDir, "Interview-data");
const homeVerificationDataDir = path.join(dataDir, "Home-verification-data");

const uploadsDir = path.join(__dirname, "uploads");

// Ensure directories exist
[uploadsDir, interviewDataDir, homeVerificationDataDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ────────────────────────────────
// MIDDLEWARE
// ────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

// ───── Static Files ─────
// Serve the root Data directory for public access.
app.use(
  "/Data", 
  express.static(dataDir)
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

// ────────────────────────────────
// DYNAMIC MULTER STORAGE
// ────────────────────────────────
const dynamicUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let baseDir =
      file.fieldname === "verificationDocument"
        ? homeVerificationDataDir
        : interviewDataDir;

    const nmmsYear = req.body.nmmsYear || new Date().getFullYear();
    const cohortFolderName = `cohort-${String(nmmsYear)}`;
    const finalTargetDirectory = path.join(baseDir, cohortFolderName);

    if (!fs.existsSync(finalTargetDirectory)) {
      fs.mkdirSync(finalTargetDirectory, { recursive: true });
    }

    cb(null, finalTargetDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: dynamicUploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

app.set("multerUpload", upload);

// ────────────────────────────────
// ROUTES IMPORT
// ────────────────────────────────
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
const eventRoutes = require("./routes/eventRoutes");
const customListRoutes = require("./routes/customListRoutes");

// ────────────────────────────────
// ROUTE MOUNTING
// ────────────────────────────────

// Bulk Upload
app.use("/api/bulk-upload", bulkUploadRoutes);

// Auth & System Config
app.use("/auth", authRoutes);
app.use("/api/system-config", systemConfigRoutes);

// Applicants
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
app.use("/api", eventRoutes);
app.use("/api/custom-list", customListRoutes);

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

// Interview
app.use("/api/interview", interviewRoutes);

// Results & Ranking
app.use("/api/results", resultandrankinkRoutes);

// Timetable
app.use("/api/timetable", timetableRoutes);

// ────────────────────────────────
// 404 HANDLER
// ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ────────────────────────────────
// START SERVER
// ────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
