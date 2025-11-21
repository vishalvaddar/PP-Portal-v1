// ==========================================================
//  server/routes/coordinatorRoutes.js 
// ==========================================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================================
// 🔹 MULTER CONFIGURATION (CSV UPLOAD)
// ==========================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("[multer] Created uploads directory:", uploadDir);
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") return cb(new Error("Only CSV files allowed!"));
    cb(null, true);
  },
});

// ==========================================================
// 🔹 CONTROLLERS IMPORTS
// ==========================================================
const { getSubjects } = require("../controllers/coordinator/subjectController");
const { getStudentsController } = require("../controllers/coordinator/studentController");
const { fetchBatches } = require("../controllers/coordinator/batchController");
const { fetchCohorts } = require("../controllers/coordinator/cohortController");
const { fetchClassrooms } = require("../controllers/coordinator/classroomController");
const { getCoordinatorTeachers } = require("../controllers/coordinator/teacherController");
const authenticate = require("../middleware/authMiddleware");

const {
  getClassroomsByBatchId,
  getAllClassrooms,
  createClassroom,
  fetchTeachers,
  fetchPlatforms,
} = require("../controllers/coordinator/classroomController");

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

// ==========================================================
// 🔹 BASE ROUTE
// ==========================================================
router.get("/", (req, res) => {
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
// 🔹 CLASSROOM EXTRA ENDPOINTS (main branch additions)
// ==========================================================
router.get("/teachers", fetchTeachers);
router.get("/platforms", fetchPlatforms);

// ==========================================================
// 🔹 SUBJECTS
// ==========================================================
router.get("/subjects", getSubjects);

// ==========================================================
// 🔹 CLASSROOMS
// ==========================================================
router.get("/classrooms/:batchId", fetchClassrooms);          // coordinator_features
router.get("/classrooms", getAllClassrooms);                 // main
router.post("/classrooms", createClassroom);                 // main

// ==========================================================
// 🔹 ATTENDANCE ROUTES
// ==========================================================

// Preview CSV
router.post(
  "/attendance/csv/preview",
  upload.single("file"),
  previewCSVAttendance
);

// Commit CSV data to DB
router.post("/attendance/csv/commit", commitCSVAttendance);

// Bulk JSON attendance upload
if (submitBulkAttendance)
  router.post("/attendance/bulk", submitBulkAttendance);

// Legacy CSV upload endpoint
if (uploadCSVAttendance)
  router.post("/attendance/csv", upload.single("file"), uploadCSVAttendance);

// Fetch attendance (GET)
if (fetchAttendance)
  router.get("/attendance", fetchAttendance);

// Sample reference CSV
router.get("/attendance/csv/reference", downloadSampleCSV);

// ==========================================================
// 🔹 REPORTS
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
// 🔹 TIMETABLE ROUTES
// ==========================================================
if (getTimetable)
  router.get("/timetable", authenticate, getTimetable);

if (checkConflict)
  router.get("/timetable/check-conflict", authenticate, checkConflict);

if (createSlot)
  router.post("/timetable", authenticate, createSlot);

if (updateSlot)
  router.put("/timetable/:id", authenticate, updateSlot);

if (deleteSlot)
  router.delete("/timetable/:id", authenticate, deleteSlot);

// ==========================================================
module.exports = router;
