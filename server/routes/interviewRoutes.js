const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');

// Route to get all available exam centers
router.get('/exam-centers', InterviewController.getExamCenters);

// Route to get a list of all states
router.get('/states', InterviewController.getAllStates);

// Route to get districts by state name
router.get('/districts/:stateName', InterviewController.getDistrictsByState);

// Route to get blocks by district name
router.get('/blocks/:districtName', InterviewController.getBlocksByDistrict);

// Route to get students who are eligible for an interview but have not been assigned yet by exam center.
router.get('/unassigned-students', InterviewController.getUnassignedStudents);

// Route to get students who are eligible for an interview but have not been assigned yet by block.
router.get('/unassignedStudentsByBlock', InterviewController.getUnassignedStudentsByBlock);

// Route to get students who are eligible for re-assignment by block.
router.get('/reassignableStudentsByBlock', InterviewController.getReassignableStudentsByBlock);

// Route to get a list of all interviewers
router.get('/interviewers', InterviewController.getInterviewers);

// Route to get students by a specific interviewer
router.get('/students/:interviewerName', InterviewController.getStudentsByInterviewer);

// Route to assign students to an interviewer
router.post('/assign-students', InterviewController.assignStudents);

// Route to get students who are eligible for re-assignment by exam center.
router.get('/reassignable-students', InterviewController.getReassignableStudents);

// Route to reassign students to a new interviewer
router.post('/reassign-students', InterviewController.reassignStudents);

// Route to submit the results of a student's interview
router.post('/submit-interview', InterviewController.submitInterviewDetails);

module.exports = router;
