const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

const { getSubjects } = require("../controllers/coordinator/subjectController");
const { getStudentsController } = require("../controllers/coordinator/studentController");
const { fetchBatches } = require("../controllers/coordinator/batchController");
const { fetchCohorts } = require("../controllers/coordinator/cohortController");

const {
  getClassroomsByBatchId,
  getAllClassrooms,
  createClassroom,
  fetchTeachers,
  fetchPlatforms,
  fetchClassrooms
} = require("../controllers/coordinator/classroomController");

const { getCoordinatorTeachers } = require("../controllers/coordinator/teacherController");
const authenticate = require("../middleware/authMiddleware");

const attendanceController = require("../controllers/coordinator/attendanceController");
const reportsController = require("../controllers/coordinator/reportsController");
const timetableController = require("../controllers/coordinator/timetableController");

const {
  fetchAttendance,
  submitBulkAttendance,
  uploadCSVAttendance,
  downloadSampleCSV,
  previewCSVAttendance,
  commitCSVAttendance,
} = attendanceController;

const {
  requireAuth,
  getAttendanceReport,
  getAbsenteesReport,
  getTeacherLoad,
  getTeacherPerformance,
} = reportsController;

const {
  getTimetable,
  checkConflict,
  createSlot,
  updateSlot,
  deleteSlot,
} = timetableController;

router.get("/", (req, res) => {
  res.send("Coordinator Home");
});

router.get("/students", getStudentsController);
router.get("/cohorts", authenticate, fetchCohorts);
router.get("/batches", authenticate, fetchBatches);

router.get("/teachers", fetchTeachers);
router.get("/platforms", fetchPlatforms);

router.get("/subjects", getSubjects);

router.get("/classrooms/:batchId", fetchClassrooms);
router.get("/classrooms", getAllClassrooms);
router.post("/classrooms", createClassroom);

router.post("/attendance/csv/preview", upload.single("file"), previewCSVAttendance);
router.post("/attendance/csv/commit", commitCSVAttendance);
router.post("/attendance/bulk", submitBulkAttendance);
router.post("/attendance/csv", upload.single("file"), uploadCSVAttendance);
router.get("/attendance", fetchAttendance);
router.get("/attendance/csv/reference", downloadSampleCSV);

router.get("/reports/attendance", requireAuth, getAttendanceReport);
router.get("/reports/absentees", requireAuth, getAbsenteesReport);
router.get("/reports/teacher-load", requireAuth, getTeacherLoad);
router.get("/reports/teacher-performance", requireAuth, getTeacherPerformance);
router.get("/reports/coordinator-teachers", requireAuth, getCoordinatorTeachers);

router.get("/timetable", authenticate, getTimetable);
router.get("/timetable/check-conflict", authenticate, checkConflict);
router.post("/timetable", authenticate, createSlot);
router.put("/timetable/:id", authenticate, updateSlot);
router.delete("/timetable/:id", authenticate, deleteSlot);

module.exports = router;
