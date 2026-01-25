const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const fs = require("fs");
const multer = require("multer");

const pool = require("./config/db");
const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ────────────────────────────────
// PATHS & DIRECTORIES
// ────────────────────────────────
const PROJECT_ROOT_DIR = process.env.FILE_STORAGE_PATH;

const interviewDataDir = path.join(PROJECT_ROOT_DIR, "Interview-data");
const homeVerificationDataDir = path.join(PROJECT_ROOT_DIR, "Home-verification-data");

const uploadsDir = path.join(__dirname, "uploads");

// Ensure the PC folders exist
[interviewDataDir, homeVerificationDataDir, uploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ────────────────────────────────
// MIDDLEWARE
// ────────────────────────────────
const allowedOrigins =
  NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:3000"];


app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

// ───── Static Files ─────
// Serve the root Data directory for public access.
// Serve files from the external PC storage path
app.use("/Data", express.static(PROJECT_ROOT_DIR));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);
 
app.use(
  "/students",
  express.static(path.join(process.env.PROFILE_PHOTOS_ROOT))
);

app.use("/logs", express.static(path.join(__dirname, "logs")));

app.use(
  "/halltickets",
  express.static(path.join(__dirname, "public", "halltickets"))
);

// ────────────────────────────────
// DYNAMIC MULTER STORAGE
// ────────────────────────────────
// ────────────────────────────────
// DYNAMIC MULTER STORAGE
// ────────────────────────────────
const dynamicUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 1. Determine the base directory based on the field name
    // 'verificationDocument' goes to Home Verification, everything else (like 'file') goes to Interview
    let baseDir = file.fieldname === "verificationDocument"
        ? homeVerificationDataDir
        : interviewDataDir;

    // 2. Get the Year from the request body
    // FALLBACK: If nmmsYear is missing, we extract the current year to prevent 'cohort-undefined'
    const nmmsYear = req.body.nmmsYear || new Date().getFullYear().toString();
    
    // 3. Construct the Cohort folder path
    const cohortFolderName = `cohort-${nmmsYear}`;
    const finalTargetDirectory = path.join(baseDir, cohortFolderName);

    try {
      // 4. Create the folder recursively if it doesn't exist
      // This ensures that even if 'Interview-data' is missing, it creates the whole path
      if (!fs.existsSync(finalTargetDirectory)) {
        fs.mkdirSync(finalTargetDirectory, { recursive: true });
      }
      cb(null, finalTargetDirectory);
    } catch (err) {
      console.error("Error creating upload directory:", err);
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    // 5. Generate a clean, unique filename
    // Format: fieldname-applicantId-timestamp.extension
    const applicantId = req.body.applicantId || "unknown";
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    
    cb(null, `${file.fieldname}-${applicantId}-${uniqueSuffix}${ext}`);
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
app.use("/api/auth", authRoutes);
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
app.listen(PORT,  () => {
  console.log(
    `Server running in ${NODE_ENV.toUpperCase()} mode on http://localhost:${PORT}`
  );
});
