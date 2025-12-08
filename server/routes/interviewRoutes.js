const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');

// =============================================================
// 1. HOME VERIFICATION ROUTES (NO CHANGE)
// =============================================================
router.get('/students-for-verification', InterviewController.getStudentsForVerification);
router.post('/submit-home-verification', InterviewController.submitHomeVerification); 
 
// =============================================================
// 2. PDF REPORT ROUTE (NO CHANGE)
// =============================================================
router.post('/download-assignment-report', InterviewController.downloadAssignmentReport);

// =============================================================
// 3. GEOGRAPHIC API ROUTES (Correctly mapped to the 4-level hierarchy: State -> Division -> District -> Block)
// =============================================================

// Exam Centers (NO CHANGE)
router.get('/exam-centers', InterviewController.getExamCenters);
// States (NO CHANGE)
router.get('/states', InterviewController.getAllStates); 

// Divisions (New: Matches /divisions?stateName=...)
router.get('/divisions', InterviewController.getDivisionsByState);

// Districts (Modified: Matches /districts?divisionName=...)
router.get('/districts', InterviewController.getDistrictsByDivision);

// Blocks (Modified: Matches /blocks?stateName=...&divisionName=...&districtName=...)
router.get('/blocks', InterviewController.getBlocksByDistrict); 

// =============================================================
// 4. INTERVIEWER & ASSIGNMENT ROUTES (NO CHANGE, as your fixes were already applied)
// =============================================================

router.get('/interviewers', InterviewController.getInterviewers);
router.get('/students/:interviewerName', InterviewController.getStudentsByInterviewer);
router.get('/unassigned-students', InterviewController.getUnassignedStudents); 
router.get('/unassigned-students-by-block', InterviewController.getUnassignedStudentsByBlock);
router.get('/reassignable-students', InterviewController.getReassignableStudents);
router.get('/reassignable-students-by-block', InterviewController.getReassignableStudentsByBlock);
router.post('/assign-students', InterviewController.assignStudents);
router.post('/reassign-students', InterviewController.reassignStudents);
router.post('/submit-interview', InterviewController.submitInterviewDetails);

module.exports = router;