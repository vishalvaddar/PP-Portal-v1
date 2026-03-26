const express = require("express");
const router = express.Router();
const classroomController = require("../controllers/classroomController");

// Helper/Dropdown Data Routes
router.get("/subjects", classroomController.getSubjects);
router.get("/platforms", classroomController.getTeachingPlatforms);
router.get("/teachers/:subjectId", classroomController.getTeachersBySubject);
router.get("/batches/:cohortNumber", classroomController.getBatchesByCohort);

// Main Classroom CRUD
router.get("/", classroomController.getClassrooms);
router.post("/", classroomController.createClassroom);
router.put("/:id", classroomController.updateClassroom);
router.delete("/:id", classroomController.deleteClassroom);

module.exports = router;