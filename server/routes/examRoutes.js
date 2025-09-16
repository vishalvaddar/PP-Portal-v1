const express = require("express");
const pool = require("../config/db");
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
    fetchAllExamsnotassigned,
    createExamAndAssignApplicants,
    generateStudentList,
    deleteExam,
    downloadAllHallTickets,
    freezeExam,

    createExamOnly,
    assignApplicantsToExam
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
router.get("/notassigned", fetchAllExamsnotassigned);
router.get("/assigned", fetchAllExams);
// router.post("/create", createExamAndAssignApplicants);
router.get("/:examId/student-list", generateStudentList);
router.delete("/:examId", deleteExam);
router.get("/:examId/download-all-hall-tickets", downloadAllHallTickets);
router.put("/:examId/freeze", freezeExam);

//changed data
router.post("/create", createExamOnly); // Only create the exam, no applicant assignment
router.post("/:examId/assign-students", assignApplicantsToExam); // Assign applicants to an existing exam




// GET /api/exams/count?centreId=1&date=2025-07-30
router.get("/count", async (req, res) => {
  const { centreId, date } = req.query;

  try {
    const result = await db.query(
      `SELECT COUNT(*) FROM pp.exam WHERE pp_exam_centre_id = $1 AND exam_date = $2`,
      [centreId, date]
    );

    const count = parseInt(result.rows[0].count, 10);
    res.json({ count });
  } catch (err) {
    console.error("Error fetching exam count", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;