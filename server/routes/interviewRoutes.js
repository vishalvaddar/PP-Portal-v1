// routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');

router.get('/exam-centers', InterviewController.getExamCenters);
router.get('/unassigned-students', InterviewController.getUnassignedStudents);
router.get('/interviewers', InterviewController.getInterviewers);
router.post('/assign-students', InterviewController.assignStudents);
router.get('/reassignable-students', InterviewController.getReassignableStudents);
router.post('/reassign-students', InterviewController.reassignStudents);
router.get('/students/:interviewerName', InterviewController.getStudentsByInterviewer);

// This route has been updated to remove the URL parameter for applicantId.
router.post('/submit-interview', InterviewController.submitInterviewDetails);

module.exports = router;
