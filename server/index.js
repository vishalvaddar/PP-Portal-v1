const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const fs = require("fs");
const multer = require("multer"); // 1. Import Multer

const pool = require("./config/db");
const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 CRITICAL CORRECTION: Define the base project directory (one level up from server/)
const PROJECT_ROOT_DIR = path.join(__dirname, '..');

// ───── Directory Definitions and Creation ─────
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(PROJECT_ROOT_DIR, "Data"); // Target the root Data folder (e.g., C:\...\PP-Portal-v1-main\Data)
const interviewDataDir = path.join(dataDir, "Interview-data"); 
const homeVerificationDataDir = path.join(dataDir, "Home-verification-data");

// Create directories (Ensuring base folders exist)
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(interviewDataDir)) {
    fs.mkdirSync(interviewDataDir, { recursive: true });
}
if (!fs.existsSync(homeVerificationDataDir)) {
    fs.mkdirSync(homeVerificationDataDir, { recursive: true });
}


// ───── Multer Configuration (The file handling middleware) ─────

// 🔥 CORRECTION: Multer dynamic storage to include cohort-year subfolders
const dynamicUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    // 1. Determine the correct static base directory
    let baseDir = interviewDataDir;
    if (file.fieldname === 'verificationDocument') {
        baseDir = homeVerificationDataDir;
    } else {
        // Assuming the primary field is for interview documents
        baseDir = interviewDataDir;
    }
    
    // 2. Determine the dynamic cohort path
    const nmmsYear = req.body.nmmsYear || new Date().getFullYear();
    const cohortFolderName = `cohort-${String(nmmsYear)}`;
    const finalTargetDirectory = path.join(baseDir, cohortFolderName);
    
    // 3. Create the final cohort folder if it doesn't exist
    if (!fs.existsSync(finalTargetDirectory)) {
        fs.mkdirSync(finalTargetDirectory, { recursive: true });
    }

    cb(null, finalTargetDirectory); // Set the final dynamic path
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize Multer instance with storage and limits (using 10 MB limit, as corrected previously)
const upload = multer({ 
    storage: dynamicUploadStorage, 
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

app.set('multerUpload', upload);

// ───── Middleware ─────
app.use(cors({ origin: "*" }));

// ───── Logging Middleware ─────
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

// IMPORTANT: Multer handles file uploads (multipart/form-data).
// These middlewares handle JSON and URL-encoded forms for all non-file routes.
// Keep these here to ensure Multer's custom logic runs first on file routes.
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
app.use("/api/interview", interviewRoutes); // Multer instance is accessible via req.app.get('multerUpload')
app.use("/api/resultandrank", resultandrankinkRoutes);

// Timetable
app.use("/api/timetable", timetableRoutes);

// ───── 404 Handler ─────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ───── Start Server ─────
// 💡 Confirmation of the target path
console.log("Multer files are now saving to the absolute path:", dataDir);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});