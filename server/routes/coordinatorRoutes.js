// server/routes/coordinatorRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// Controllers
const { getSubjects } = require("../controllers/coordinator/subjectController");
const { getStudentsController } = require("../controllers/coordinator/studentController");
const { fetchBatches, createBatchController } = require("../controllers/coordinator/batchController");
const { fetchCohorts } = require("../controllers/coordinator/cohortController");
const authenticate = require("../middleware/authMiddleware");
const { getClassroomsByBatchId, getAllClassrooms, createClassroom, fetchTeachers, fetchPlatforms, } = require("../controllers/coordinator/classroomController");

const { fetchAttendance, submitBulkAttendance, uploadCSVAttendance, downloadSampleCSV,} = require("../controllers/coordinator/attendanceController");

// Base Route
router.get("/", (req, res) => {
  res.send("Coordinator Home");
});

// 🔹 Students (use query params instead of duplicate params)
// Example: /students?cohortNumber=1&batchId=2
router.get("/students", getStudentsController);

// Cohorts
router.get("/cohorts", authenticate, fetchCohorts);

// Batches
router.get("/batches", authenticate , fetchBatches);
router.get("/teachers", fetchTeachers);
router.get("/platforms", fetchPlatforms);

// Subjects
router.get("/subjects", getSubjects);
// Classrooms
router.get("/classrooms/:batchId", getClassroomsByBatchId);
router.get("/classrooms", getAllClassrooms);
router.post("/classrooms", createClassroom);
// Attendance
// Example URL: /attendance?cohort=1&batch=2&classroom=3&date=2025-09-07&startTime=10:00&endTime=11:00&subject=5
router.get("/attendance", fetchAttendance);

router.post("/attendance/bulk", submitBulkAttendance); // bulk upload JSON
router.post(
  "/attendance/csv",
  upload.single("file"), // multer middleware
  uploadCSVAttendance    // bulk upload CSV
);

// Sample CSV download
//router.get("/attendance/sample-csv", downloadSampleCSV);



module.exports = router;
