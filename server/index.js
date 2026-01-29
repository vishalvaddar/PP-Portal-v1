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

const PROJECT_ROOT_DIR = process.env.FILE_STORAGE_PATH;
const interviewDataDir = path.join(PROJECT_ROOT_DIR, "Interview-data");
const homeVerificationDataDir = path.join(PROJECT_ROOT_DIR, "Home-verification-data");
const uploadsDir = path.join(__dirname, "uploads");

const EVENT_PHOTOS_DIR = process.env.EVENT_STORAGE_PATH || path.join(__dirname, "uploads", "events", "photos");

[
  uploadsDir, 
  interviewDataDir, 
  homeVerificationDataDir,
  path.join(uploadsDir, "profile_photos"),
  EVENT_PHOTOS_DIR
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));


const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

app.use(
  "/uploads/events/photos",
  express.static(EVENT_PHOTOS_DIR)
);

const PROFILE_PHOTOS_ROOT = process.env.PROFILE_PHOTOS_ROOT;

app.use(
  "/students",
  express.static(PROFILE_PHOTOS_ROOT)
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use("/Data", express.static(PROJECT_ROOT_DIR));
app.use("/logs", express.static(path.join(__dirname, "logs")));
app.use("/halltickets", express.static(path.join(__dirname, "public", "halltickets")));

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
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.set("multerUpload", upload);

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
const jurisNamesRoutes = require("./routes/jurisNameRoutes");
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
const selectionReportRoutes = require("./routes/selectionReportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/system-config", systemConfigRoutes);
app.use("/api/bulk-upload", bulkUploadRoutes);

app.use("/api/applicants", applicantRoutes);
app.use("/api/student", studentRoutes);
app.use("/api", studentSearchRoutes);

app.use("/api", jurisdictionRoutes);
app.use("/api/juris-names", jurisNamesRoutes);
app.use("/api/institutes", institutesRoutes);
app.use("/api/districts", districtRoutes);

app.use("/api", eventRoutes);
app.use("/api/custom-list", customListRoutes);
app.use("/api/selection-reports", selectionReportRoutes);

app.use("/api/batches", batchRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/tracking", trackingRoutes);

app.use("/api/shortlist/generate", generateShortlistRoutes);
app.use("/api/shortlist-info", shortlistInfoRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/evaluation-dashboard", evaluationDashboardRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/results", resultandrankinkRoutes);

app.use("/api", userRoleRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api", searchRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(
    `Server running in ${NODE_ENV.toUpperCase()} mode on http://localhost:${PORT}`
  );
  // console.log(`Event Photos serving from: ${EVENT_PHOTOS_DIR}`);
});