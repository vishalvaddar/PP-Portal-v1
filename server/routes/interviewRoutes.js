const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');
// Note: If your InterviewController file is not directly in '../controllers', adjust the path accordingly.

// -------------------------------------------------------------
// --- HOME VERIFICATION ROUTES ---
// -------------------------------------------------------------
router.get('/students-for-verification', InterviewController.getStudentsForVerification);
router.post('/submit-home-verification', InterviewController.submitHomeVerification); 

// -------------------------------------------------------------
// --- PDF REPORT ROUTE (Critical: Must be POST) --- 
// -------------------------------------------------------------
// This route is correctly defined to handle the POST request from the frontend.
// *** TEMPORARY FIX: Combining the POST routes to try and bypass external 404 errors ***
router.post('/download-assignment-report', InterviewController.downloadAssignmentReport);

// -------------------------------------------------------------
// --- GENERAL INTERVIEW & ASSIGNMENT ROUTES --- 
// -------------------------------------------------------------
router.get('/exam-centers', InterviewController.getExamCenters);
router.get('/states', InterviewController.getAllStates); 
router.get('/districts/:stateName', InterviewController.getDistrictsByState);
router.get('/blocks/:districtName', InterviewController.getBlocksByDistrict);
router.get('/unassigned-students', InterviewController.getUnassignedStudents);
router.get('/unassignedStudentsByBlock', InterviewController.getUnassignedStudentsByBlock);
router.get('/reassignableStudentsByBlock', InterviewController.getReassignableStudentsByBlock);
router.get('/interviewers', InterviewController.getInterviewers);
router.get('/students/:interviewerName', InterviewController.getStudentsByInterviewer);
router.post('/assign-students', InterviewController.assignStudents);
router.get('/reassignable-students', InterviewController.getReassignableStudents);
router.post('/reassign-students', InterviewController.reassignStudents);
router.post('/submit-interview', InterviewController.submitInterviewDetails);

module.exports = router;
