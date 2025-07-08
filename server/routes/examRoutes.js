const express = require("express");
const router = express.Router();
const {
    // Exam Centre routes
    fetchExamCentres,
    createExamCentre,
    removeExamCentre,
    
    // Location routes
    fetchStates,
    fetchDistrictsByState,
    fetchBlocksByDistrict,
    fetchUsedBlocks,
    
    // Exam routes
    fetchAllExams,
    createExamAndAssignApplicants,
    generateStudentList,
    deleteExam,
    downloadAllHallTickets,
    freezeExam
} = require('../controllers/examControllers');

// Exam Centre Routes
router.get("/exam-centres", fetchExamCentres);
router.post("/exam-centres", createExamCentre);
router.delete("/exam-centres/:id", removeExamCentre);

// Location Routes
router.get("/states", fetchStates);
router.get("/districts-by-state/:stateId", fetchDistrictsByState);
router.get("/blocks-by-district/:districtId", fetchBlocksByDistrict);
router.get("/used-blocks", fetchUsedBlocks);

// Exam Routes
router.get("/", fetchAllExams);
router.post("/create", createExamAndAssignApplicants);
router.get("/:examId/student-list", generateStudentList);
router.delete("/:examId", deleteExam);
router.get("/:examId/download-all-hall-tickets", downloadAllHallTickets);
router.put("/:examId/freeze", freezeExam);

module.exports = router;