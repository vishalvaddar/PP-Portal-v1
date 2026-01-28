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

const PROJECT_ROOT_DIR = path.join(__dirname, "..");
const dataDir = path.join(PROJECT_ROOT_DIR, "Data");
const interviewDataDir = path.join(dataDir, "Interview-data");
const homeVerificationDataDir = path.join(dataDir, "Home-verification-data");
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const actionLogger = require("./middleware/loggingMiddleware");
app.use(actionLogger({ logBody: true, logQuery: true }));

app.use(
  "/uploads/events/photos",
  express.static(EVENT_PHOTOS_DIR)
);

app.use(
  "/uploads/profile_photos",
  express.static(path.join(__dirname, "uploads", "profile_photos"))
);

app.use(
  "/uploads",
  express.static(uploadsDir)
);

app.use("/Data", express.static(dataDir));
app.use("/logs", express.static(path.join(__dirname, "logs")));
app.use("/halltickets", express.static(path.join(__dirname, "public", "halltickets")));

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
  console.log(`Event Photos serving from: ${EVENT_PHOTOS_DIR}`);
});