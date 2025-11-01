// trackingRoutes.js
const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// --- List and Filter Routes ---

// GET /interviewers - List of interviewers for filter
router.get('/interviewers', trackingController.getAllInterviewers);

// GET /students - Paginated student list with status/result filters
router.get('/students', trackingController.getStudents);

// GET /students/interviewer/:interviewerId - Paginated student list filtered by interviewer
router.get('/students/interviewer/:interviewerId', trackingController.getStudentsByInterviewer);


// --- Student Detail and Data Routes ---

// GET /students/:applicantId/details - Fetches ONLY the latest round (if ?filtered=true is used).
router.get('/students/:applicantId/details', trackingController.getStudentDetails);

// NEW ROUTE: GET /students/:applicantId/interviews/all - Fetches ALL interview rounds for detail view.
router.get('/students/:applicantId/interviews/all', trackingController.getAllInterviewRounds);

// NEW ROUTE: GET /students/:applicantId/home/all - Fetches ALL home verification records for detail view.
router.get('/students/:applicantId/home/all', trackingController.getAllHomeVerificationRounds);


// --- Document Download Route (Handles both Interview and Home Verification) ---

// GET /document/:applicantId/:cohortId?type=interview/home
router.get('/document/:applicantId/:cohortId', trackingController.downloadDocument);
// trackingRoutes.js (Add this line)


module.exports = router;