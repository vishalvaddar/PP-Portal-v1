// // server/routes/coordinatorRoutes.js
// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const upload = multer({ dest: "uploads/" }); // for CSV file uploads

// // Controllers (✅ fixed paths to go up two levels from routes → controllers)
// const { getSubjects } = require("../controllers/coordinator/subjectController");
// const { getStudentsController } = require("../controllers/coordinator/studentController");
// const { fetchBatches } = require("../controllers/coordinator/batchController");
// const { fetchCohorts } = require("../controllers/coordinator/cohortController");
// const authenticate = require("../middleware/authMiddleware");
// const { fetchClassrooms } = require("../controllers/coordinator/classroomController");

// // Attendance Controllers
// const {
//   fetchAttendance,
//   submitBulkAttendance,
//   uploadCSVAttendance,
//   downloadSampleCSV,
// } = require("../controllers/coordinator/attendanceController");

// // Reports Controllers
// const {
//   requireAuth,
//   getAttendanceReport,
//   getAbsenteesReport,
//   getTeacherLoad,
//   getTeacherPerformance,
// } = require("../controllers/coordinator/reportsController");

// // Base Route
// router.get("/", (req, res) => {
//   res.send("Coordinator Home");
// });

// // 🔹 Students (use query params instead of duplicate params)
// // Example: /students?cohortNumber=1&batchId=2
// router.get("/students", getStudentsController);

// // Cohorts
// router.get("/cohorts", authenticate, fetchCohorts);

// // Batches
// router.get("/batches", authenticate, fetchBatches);

// // Subjects
// router.get("/subjects", getSubjects);

// // Classrooms
// router.get("/classrooms/:batchId", fetchClassrooms);

// // Attendance
// // Example URL: /attendance?cohort=1&batch=2&classroom=3&date=2025-09-07&startTime=10:00&endTime=11:00&subject=5
// router.get("/attendance", fetchAttendance);
// router.post("/attendance/bulk", submitBulkAttendance); // bulk upload JSON
// router.post("/attendance/csv", upload.single("file"), uploadCSVAttendance); // bulk upload CSV

// // 🧾 Reports Routes
// router.get("/reports/attendance", requireAuth, getAttendanceReport);
// router.get("/reports/absentees", requireAuth, getAbsenteesReport);
// router.get("/reports/teacher-load", requireAuth, getTeacherLoad);
// router.get("/reports/teacher-performance", requireAuth, getTeacherPerformance);

// // Optional: Sample CSV download
// // router.get("/attendance/sample-csv", downloadSampleCSV);

// module.exports = router;

// ==========================================================
//  server/routes/coordinatorRoutes.js (FINAL VERSION)
// ==========================================================
// ==========================================================
//  server/routes/coordinatorRoutes.js  ✅ FINAL VERIFIED VERSION
// ==========================================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================================
// 🔹 MULTER CONFIGURATION for CSV Uploads
// ==========================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("[multer] 📂 Created uploads directory:", uploadDir);
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    console.log(`[multer] 🟢 Saving file as: ${safeName}`);
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
      console.error("[multer] ❌ Invalid file type:", file.originalname);
      return cb(new Error("Only CSV files are allowed!"));
    }
    console.log("[multer] ✅ File accepted:", file.originalname);
    cb(null, true);
  },
});

// ==========================================================
// 🔹 CONTROLLER IMPORTS
// ==========================================================
const { getSubjects } = require("../controllers/coordinator/subjectController");
const { getStudentsController } = require("../controllers/coordinator/studentController");
const { fetchBatches } = require("../controllers/coordinator/batchController");
const { fetchCohorts } = require("../controllers/coordinator/cohortController");
const { fetchClassrooms } = require("../controllers/coordinator/classroomController");
const { getCoordinatorTeachers } = require("../controllers/coordinator/teacherController");
const authenticate = require("../middleware/authMiddleware");

// ==========================================================
// 🔹 ATTENDANCE CONTROLLERS
// ==========================================================
const attendanceController = require("../controllers/coordinator/attendanceController");

const {
  fetchAttendance,
  submitBulkAttendance,
  uploadCSVAttendance,
  downloadSampleCSV,
  previewCSVAttendance,
  commitCSVAttendance,
} = attendanceController || {};

console.log("------------------------------------------------------");
console.log("[CoordinatorRoutes] ✅ AttendanceController import check:");
console.log({
  fetchAttendance: typeof fetchAttendance,
  submitBulkAttendance: typeof submitBulkAttendance,
  uploadCSVAttendance: typeof uploadCSVAttendance,
  previewCSVAttendance: typeof previewCSVAttendance,
  commitCSVAttendance: typeof commitCSVAttendance,
});
console.log("------------------------------------------------------");

// If any are undefined → log warning for debugging
Object.entries(attendanceController || {}).forEach(([key, val]) => {
  if (typeof val === "undefined") {
    console.warn(`[⚠️ AttendanceController] Function "${key}" is undefined`);
  }
});

// ==========================================================
// 🔹 REPORTS CONTROLLERS
// ==========================================================
const reportsController = require("../controllers/coordinator/reportsController");

const {
  requireAuth,
  getAttendanceReport,
  getAbsenteesReport,
  getTeacherLoad,
  getTeacherPerformance,
} = reportsController || {};

console.log("[CoordinatorRoutes] ✅ ReportsController loaded successfully.");

// ==========================================================
// 🔹 BASE ROUTE
// ==========================================================
router.get("/", (req, res) => {
  console.log("[CoordinatorRoutes] ✅ Coordinator home route accessed.");
  res.send("Coordinator Home");
});

// ==========================================================
// 🔹 STUDENTS
// ==========================================================
router.get("/students", getStudentsController);

// ==========================================================
// 🔹 COHORTS
// ==========================================================
router.get("/cohorts", authenticate, fetchCohorts);

// ==========================================================
// 🔹 BATCHES
// ==========================================================
router.get("/batches", authenticate, fetchBatches);

// ==========================================================
// 🔹 SUBJECTS
// ==========================================================
router.get("/subjects", getSubjects);

// ==========================================================
// 🔹 CLASSROOMS
// ==========================================================
router.get("/classrooms/:batchId", fetchClassrooms);

// ==========================================================
// 🔹 ATTENDANCE ROUTES
// ==========================================================
router.post(
  "/attendance/csv/preview",
  (req, res, next) => {
    console.log("======================================================");
    console.log("[Route] 🟢 /attendance/csv/preview called");
    console.log("======================================================");
    next();
  },
  upload.single("file"),
  previewCSVAttendance
);

router.post(
  "/attendance/csv/commit",
  (req, res, next) => {
    console.log("======================================================");
    console.log("[Route] 🟢 /attendance/csv/commit called");
    console.log("======================================================");
    next();
  },
  commitCSVAttendance
);

// ✅ Optional legacy routes (safe)
if (submitBulkAttendance) router.post("/attendance/bulk", submitBulkAttendance);
if (uploadCSVAttendance) router.post("/attendance/csv", upload.single("file"), uploadCSVAttendance);
if (fetchAttendance) router.get("/attendance", fetchAttendance);

router.get("/attendance/csv/reference", downloadSampleCSV);

// ==========================================================
// 🔹 REPORTS ROUTES
// ==========================================================
if (requireAuth && getAttendanceReport)
  router.get("/reports/attendance", requireAuth, getAttendanceReport);

if (requireAuth && getAbsenteesReport)
  router.get("/reports/absentees", requireAuth, getAbsenteesReport);

if (requireAuth && getTeacherLoad)
  router.get("/reports/teacher-load", requireAuth, getTeacherLoad);

if (requireAuth && getTeacherPerformance)
  router.get("/reports/teacher-performance", requireAuth, getTeacherPerformance);

if (requireAuth && getCoordinatorTeachers)
  router.get("/reports/coordinator-teachers", requireAuth, getCoordinatorTeachers);

// ==========================================================
// 🔹 SAMPLE CSV DOWNLOAD (Optional)
// ==========================================================
// if (downloadSampleCSV) router.get("/attendance/sample-csv", downloadSampleCSV);

// ==========================================================
// 🔹 TIMETABLE CONTROLLER
// ==========================================================
const timetableController = require("../controllers/coordinator/timetableController");

const {
  getTimetable,
  checkConflict,
  createSlot,
  updateSlot,
  deleteSlot,
} = timetableController || {};

console.log("[CoordinatorRoutes] 📘 Timetable Controller loaded:", {
  getTimetable: typeof getTimetable,
  checkConflict: typeof checkConflict,
  createSlot: typeof createSlot,
  updateSlot: typeof updateSlot,
  deleteSlot: typeof deleteSlot,
});

// ==========================================================
// 🔹 TIMETABLE ROUTES
// ==========================================================

// Fetch timetable for a batch
if (getTimetable)
  router.get("/timetable", authenticate, getTimetable);

// Check conflict before adding/updating
if (checkConflict)
  router.get("/timetable/check-conflict", authenticate, checkConflict);

// Create new timetable slot
if (createSlot)
  router.post("/timetable", authenticate, createSlot);

// Update timetable slot
if (updateSlot)
  router.put("/timetable/:id", authenticate, updateSlot);

// Delete timetable slot
if (deleteSlot)
  router.delete("/timetable/:id", authenticate, deleteSlot);

module.exports = router;
