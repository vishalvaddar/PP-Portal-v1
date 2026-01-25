// // const express = require("express");
// // const router = express.Router();
// // const multer = require("multer");
// // const path = require("path");
// // const fs = require("fs");

// // /* ===========================================================
// //    FILE UPLOAD STORAGE (CSV)
// //    =========================================================== */
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     const uploadDir = path.join(__dirname, "../uploads");
// //     if (!fs.existsSync(uploadDir)) {
// //       fs.mkdirSync(uploadDir, { recursive: true });
// //     }
// //     cb(null, uploadDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
// //     cb(null, safeName);
// //   },
// // });

// // const upload = multer({
// //   storage,
// //   fileFilter: (req, file, cb) => {
// //     const ext = path.extname(file.originalname).toLowerCase();
// //     if (ext !== ".csv") return cb(new Error("Only CSV files allowed!"));
// //     cb(null, true);
// //   },
// // });

// // /* ===========================================================
// //    IMPORT CONTROLLERS
// //    =========================================================== */
// // const authenticate = require("../middleware/authMiddleware");

// // // Students
// // const {
// //   getStudentsController,
// //   updateStudentController,
// //   markInactiveController,
// //   getInactiveHistoryController,
// // } = require("../controllers/coordinator/studentController");

// // // Cohorts & Batches
// // const { fetchCohorts } = require("../controllers/coordinator/cohortController");
// // const { fetchBatches } = require("../controllers/coordinator/batchController");

// // // Subjects
// // const { getSubjects } = require("../controllers/coordinator/subjectController");

// // // Classrooms
// // const {
// //   fetchClassrooms,
// //   getAllClassrooms,
// //   createClassroom,
// //   fetchTeachers,
// //   fetchPlatforms,
// // } = require("../controllers/coordinator/classroomController");

// // // Teacher report
// // const { getCoordinatorTeachers } = require("../controllers/coordinator/teacherController");

// // // Attendance (SESSION-BASED)
// // const {
// //   previewCSVAttendance,
// //   commitCSVAttendance,
// //   undoLastAttendanceCommit,
// //   fetchAttendance,
// //   submitBulkAttendance,
// //   downloadSampleCSV,
// //   checkOverlap,
// //   getOrFindSession,        // ✅ ADDED PROPER IMPORT
// // } = require("../controllers/coordinator/attendanceController");

// // // Reports
// // const {
// //   requireAuth,
// //   getAttendanceReport,
// //   getAbsenteesReport,
// //   getTeacherLoad,
// //   getTeacherPerformance,
// // } = require("../controllers/coordinator/reportsController");

// // // Timetable
// // const {
// //   getTimetable,
// //   checkConflict,
// //   createSlot,
// //   updateSlot,
// //   deleteSlot,
// // } = require("../controllers/coordinator/timetableController");

// // /* ===========================================================
// //    ROUTES START
// //    =========================================================== */

// // // ------------------------------
// // // HOME
// // // ------------------------------
// // router.get("/", (req, res) => {
// //   res.send("Coordinator Home");
// // });

// // // ------------------------------
// // // STUDENT ROUTES
// // // ------------------------------
// // router.get("/students", authenticate, getStudentsController);
// // router.put("/students/:id", authenticate, updateStudentController);
// // router.put("/students/:id/inactive", authenticate, markInactiveController);
// // router.get("/students/:id/inactive-history", authenticate, getInactiveHistoryController);

// // // ------------------------------
// // // COHORTS & BATCHES
// // // ------------------------------
// // router.get("/cohorts", authenticate, fetchCohorts);
// // router.get("/batches", authenticate, fetchBatches);

// // // ------------------------------
// // // CLASSROOMS
// // // ------------------------------
// // router.get("/classrooms/:batchId", authenticate, fetchClassrooms);
// // router.get("/classrooms", authenticate, getAllClassrooms);
// // router.post("/classrooms", authenticate, createClassroom);
// // router.get("/teachers", authenticate, fetchTeachers);
// // router.get("/platforms", authenticate, fetchPlatforms);

// // // ------------------------------
// // // SUBJECTS
// // // ------------------------------
// // router.get("/subjects", authenticate, getSubjects);

// // /* ===========================================================
// //    ATTENDANCE (SESSION-BASED)
// //    =========================================================== */

// // // 1️⃣ GET OR FIND SESSION ID
// // router.get("/attendance/session", authenticate, getOrFindSession);

// // // 2️⃣ PREVIEW CSV (NO DB WRITE)
// // router.post(
// //   "/attendance/csv/preview",
// //   authenticate,
// //   upload.single("file"),
// //   previewCSVAttendance
// // );

// // // 3️⃣ COMMIT CSV (CREATES SESSION IF NEEDED)
// // router.post("/attendance/csv/commit", authenticate, commitCSVAttendance);

// // // 4️⃣ UNDO LAST COMMIT
// // router.post("/attendance/undo", authenticate, undoLastAttendanceCommit);

// // // 5️⃣ CHECK TIME OVERLAP BEFORE CREATING SESSION
// // router.get("/attendance/check-overlap", authenticate, checkOverlap);

// // // 6️⃣ BULK JSON UPLOAD (MANUAL ENTRY)
// // router.post("/attendance/bulk", authenticate, submitBulkAttendance);

// // // 7️⃣ FETCH ATTENDANCE (SUPPORTS session_id)
// // router.get("/attendance", authenticate, fetchAttendance);

// // // 8️⃣ DOWNLOAD SAMPLE CSV
// // router.get("/attendance/csv/reference", authenticate, downloadSampleCSV);

// // /* ===========================================================
// //    REPORTS
// //    =========================================================== */
// // router.get("/reports/attendance", requireAuth, getAttendanceReport);
// // router.get("/reports/absentees", requireAuth, getAbsenteesReport);
// // router.get("/reports/teacher-load", requireAuth, getTeacherLoad);
// // router.get("/reports/teacher-performance", requireAuth, getTeacherPerformance);
// // router.get("/reports/coordinator-teachers", requireAuth, getCoordinatorTeachers);

// // /* ===========================================================
// //    TIMETABLE
// //    =========================================================== */
// // router.get("/timetable", authenticate, getTimetable);
// // router.get("/timetable/check-conflict", authenticate, checkConflict);
// // router.post("/timetable", authenticate, createSlot);
// // router.put("/timetable/:id", authenticate, updateSlot);
// // router.delete("/timetable/:id", authenticate, deleteSlot);

// // const { getBatchWeeklyAverage } = require("../controllers/coordinator/attendanceAnalyticsController");

// // router.get(
// //   "/attendance/batch-weekly-avg",
// //   authenticate,
// //   getBatchWeeklyAverage
// // );

// // /* ===========================================================
// //    EXPORT ROUTER
// //    =========================================================== */
// // module.exports = router;




// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// /* ===========================================================
//    FILE UPLOAD STORAGE (CSV)
//    =========================================================== */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, "../uploads");
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
//     cb(null, safeName);
//   },
// });

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (ext !== ".csv") return cb(new Error("Only CSV files allowed!"));
//     cb(null, true);
//   },
// });

// /* ===========================================================
//    IMPORT CONTROLLERS
//    =========================================================== */
// const authenticate = require("../middleware/authMiddleware");

// // Institutes (Search for 2 Lakh+ records)
// const { searchInstitutes } = require("../controllers/coordinator/instituteController");

// // Students
// const {
//   getStudentsController,
//   updateStudentController,
//   markInactiveController,
//   getInactiveHistoryController,
// } = require("../controllers/coordinator/studentController");

// // Cohorts & Batches
// const { fetchCohorts } = require("../controllers/coordinator/cohortController");
// const { fetchBatches } = require("../controllers/coordinator/batchController");

// // Subjects
// const { getSubjects } = require("../controllers/coordinator/subjectController");

// // Classrooms
// const {
//   fetchClassrooms,
//   getAllClassrooms,
//   createClassroom,
//   fetchTeachers,
//   fetchPlatforms,
// } = require("../controllers/coordinator/classroomController");

// // Teacher report
// const { getCoordinatorTeachers } = require("../controllers/coordinator/teacherController");

// // Attendance (SESSION-BASED)
// const {
//   previewCSVAttendance,
//   commitCSVAttendance,
//   undoLastAttendanceCommit,
//   fetchAttendance,
//   submitBulkAttendance,
//   downloadSampleCSV,
//   checkOverlap,
//   getOrFindSession,
// } = require("../controllers/coordinator/attendanceController");

// // Reports
// const {
//   requireAuth,
//   getAttendanceReport,
//   getAbsenteesReport,
//   getTeacherLoad,
//   getTeacherPerformance,
// } = require("../controllers/coordinator/reportsController");

// // Timetable
// const {
//   getTimetable,
//   checkConflict,
//   createSlot,
//   updateSlot,
//   deleteSlot,
// } = require("../controllers/coordinator/timetableController");

// /* ===========================================================
//    ROUTES START
//    =========================================================== */

// // ------------------------------
// // HOME
// // ------------------------------
// router.get("/", (req, res) => {
//   res.send("Coordinator Home");
// });

// // ------------------------------
// // INSTITUTE ROUTES (Search Logic)
// // ------------------------------
// // Added this to fix the 404 error and handle the searchable dropdown
// router.get("/institutes/search", authenticate, searchInstitutes);

// // ------------------------------
// // STUDENT ROUTES
// // ------------------------------
// router.get("/students", authenticate, getStudentsController);
// router.put("/students/:id", authenticate, updateStudentController);
// router.put("/students/:id/inactive", authenticate, markInactiveController);
// router.get("/students/:id/inactive-history", authenticate, getInactiveHistoryController);

// // ------------------------------
// // COHORTS & BATCHES
// // ------------------------------
// router.get("/cohorts", authenticate, fetchCohorts);
// router.get("/batches", authenticate, fetchBatches);

// // ------------------------------
// // CLASSROOMS
// // ------------------------------
// router.get("/classrooms/:batchId", authenticate, fetchClassrooms);
// router.get("/classrooms", authenticate, getAllClassrooms);
// router.post("/classrooms", authenticate, createClassroom);
// router.get("/teachers", authenticate, fetchTeachers);
// router.get("/platforms", authenticate, fetchPlatforms);

// // ------------------------------
// // SUBJECTS
// // ------------------------------
// router.get("/subjects", authenticate, getSubjects);

// /* ===========================================================
//    ATTENDANCE (SESSION-BASED)
//    =========================================================== */
// router.get("/attendance/session", authenticate, getOrFindSession);
// router.post("/attendance/csv/preview", authenticate, upload.single("file"), previewCSVAttendance);
// router.post("/attendance/csv/commit", authenticate, commitCSVAttendance);
// router.post("/attendance/undo", authenticate, undoLastAttendanceCommit);
// router.get("/attendance/check-overlap", authenticate, checkOverlap);
// router.post("/attendance/bulk", authenticate, submitBulkAttendance);
// router.get("/attendance", authenticate, fetchAttendance);
// router.get("/attendance/csv/reference", authenticate, downloadSampleCSV);

// /* ===========================================================
//    REPORTS
//    =========================================================== */
// router.get("/reports/attendance", requireAuth, getAttendanceReport);
// router.get("/reports/absentees", requireAuth, getAbsenteesReport);
// router.get("/reports/teacher-load", requireAuth, getTeacherLoad);
// router.get("/reports/teacher-performance", requireAuth, getTeacherPerformance);
// router.get("/reports/coordinator-teachers", requireAuth, getCoordinatorTeachers);

// /* ===========================================================
//    TIMETABLE
//    =========================================================== */
// router.get("/timetable", authenticate, getTimetable);
// router.get("/timetable/check-conflict", authenticate, checkConflict);
// router.post("/timetable", authenticate, createSlot);
// router.put("/timetable/:id", authenticate, updateSlot);
// router.delete("/timetable/:id", authenticate, deleteSlot);

// const { getBatchWeeklyAverage } = require("../controllers/coordinator/attendanceAnalyticsController");
// router.get("/attendance/batch-weekly-avg", authenticate, getBatchWeeklyAverage);

// module.exports = router;




const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ===========================================================
   FILE UPLOAD STORAGE (CSV)
   =========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
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

/* ===========================================================
   IMPORT CONTROLLERS
   =========================================================== */
const authenticate = require("../middleware/authMiddleware");

// Institutes (Search for 2 Lakh+ records)
const { searchInstitutes } = require("../controllers/coordinator/instituteController");

// Students
const {
  getStudentsController,
  updateStudentController,
  markInactiveController,
  getInactiveHistoryController,
} = require("../controllers/coordinator/studentController");

// Cohorts & Batches
const { fetchCohorts } = require("../controllers/coordinator/cohortController");
const { fetchBatches } = require("../controllers/coordinator/batchController");

// Subjects
const { getSubjects } = require("../controllers/coordinator/subjectController");

// Classrooms
const {
  fetchClassrooms,
  getAllClassrooms,
  createClassroom,
  fetchTeachers,
  fetchPlatforms,
} = require("../controllers/coordinator/classroomController");

// Teacher report
const { getCoordinatorTeachers } = require("../controllers/coordinator/teacherController");

// Attendance (SESSION-BASED)
const {
  previewCSVAttendance,
  commitCSVAttendance,
  undoLastAttendanceCommit,
  fetchAttendance,
  submitBulkAttendance,
  downloadSampleCSV,
  checkOverlap,
  getOrFindSession,
} = require("../controllers/coordinator/attendanceController");

// Reports (UPDATED: Added new details functions)
const {
  requireAuth,
  getAttendanceReport,
  getAbsenteesReport,
  getTeacherLoad,
  getTeacherPerformance,
  getBatchClassDetails,     // <--- ADDED
  getTeacherClassDetails,
  getGlobalAttendanceStats,       // <--- ADDED for Rainbow Gauges
  getTeacherSubjectMonthlyStats,   // <--- ADDED
} = require("../controllers/coordinator/reportsController");

// Timetable
const {
  getTimetable,
  checkConflict,
  createSlot,
  updateSlot,
  deleteSlot,
} = require("../controllers/coordinator/timetableController");

/* ===========================================================
   ROUTES START
   =========================================================== */

// ------------------------------
// HOME
// ------------------------------
router.get("/", (req, res) => {
  res.send("Coordinator Home");
});

// ------------------------------
// INSTITUTE ROUTES
// ------------------------------
router.get("/institutes/search", authenticate, searchInstitutes);

// ------------------------------
// STUDENT ROUTES
// ------------------------------
router.get("/students", authenticate, getStudentsController);
router.put("/students/:id", authenticate, updateStudentController);
router.put("/students/:id/inactive", authenticate, markInactiveController);
router.get("/students/:id/inactive-history", authenticate, getInactiveHistoryController);

// ------------------------------
// COHORTS & BATCHES
// ------------------------------
router.get("/cohorts", authenticate, fetchCohorts);
router.get("/batches", authenticate, fetchBatches);

// ------------------------------
// CLASSROOMS
// ------------------------------
router.get("/classrooms/:batchId", authenticate, fetchClassrooms);
router.get("/classrooms", authenticate, getAllClassrooms);
router.post("/classrooms", authenticate, createClassroom);
router.get("/teachers", authenticate, fetchTeachers);
router.get("/platforms", authenticate, fetchPlatforms);

// ------------------------------
// SUBJECTS
// ------------------------------
router.get("/subjects", authenticate, getSubjects);

/* ===========================================================
   ATTENDANCE (SESSION-BASED)
   =========================================================== */
router.get("/attendance/session", authenticate, getOrFindSession);
router.post("/attendance/csv/preview", authenticate, upload.single("file"), previewCSVAttendance);
router.post("/attendance/csv/commit", authenticate, commitCSVAttendance);
router.post("/attendance/undo", authenticate, undoLastAttendanceCommit);
router.get("/attendance/check-overlap", authenticate, checkOverlap);
router.post("/attendance/bulk", authenticate, submitBulkAttendance);
router.get("/attendance", authenticate, fetchAttendance);
router.get("/attendance/csv/reference", authenticate, downloadSampleCSV);

/* ===========================================================
   REPORTS
   =========================================================== */
router.get("/reports/attendance", requireAuth, getAttendanceReport);
router.get("/reports/absentees", requireAuth, getAbsenteesReport);
router.get("/reports/teacher-load", requireAuth, getTeacherLoad);
router.get("/reports/teacher-performance", requireAuth, getTeacherPerformance);
router.get("/reports/coordinator-teachers", requireAuth, getCoordinatorTeachers);

// --- NEW CLASS REPORTS ---
router.get("/reports/batch-class-details", requireAuth, getBatchClassDetails);    // <--- ADDED
router.get("/reports/teacher-class-details", requireAuth, getTeacherClassDetails); // <--- ADDED

/* ===========================================================
   TIMETABLE
   =========================================================== */
router.get("/timetable", authenticate, getTimetable);
router.get("/timetable/check-conflict", authenticate, checkConflict);
router.post("/timetable", authenticate, createSlot);
router.put("/timetable/:id", authenticate, updateSlot);
router.delete("/timetable/:id", authenticate, deleteSlot);

const { getBatchWeeklyAverage } = require("../controllers/coordinator/attendanceAnalyticsController");
router.get("/attendance/batch-weekly-avg", authenticate, getBatchWeeklyAverage);

// Dashboard Dashboard Analytics
router.get("/reports/global-attendance", requireAuth, getGlobalAttendanceStats); // Rainbow UI
router.get("/reports/teacher-subject-stats", requireAuth, getTeacherSubjectMonthlyStats); // Bar Graph

module.exports = router;