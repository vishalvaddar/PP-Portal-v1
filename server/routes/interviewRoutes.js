const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');

// 💡 Middleware to retrieve the Multer instance from the main app
router.use((req, res, next) => {
    req.uploadMiddleware = req.app.get('multerUpload');
    if (!req.uploadMiddleware) {
        console.error("Multer upload instance is missing! Check server.js configuration.");
    }
    next();
});

// =============================================================
// 1. HOME VERIFICATION ROUTES
// =============================================================

// GET: Fetch students needing home verification
router.get('/students-for-verification', InterviewController.getStudentsForVerification);

// POST: Submit home verification data with a document
router.post(
    '/submit-home-verification', 
    (req, res, next) => {
        if (req.uploadMiddleware) {
            // 'verificationDocument' must match the key used in Frontend FormData.append()
            req.uploadMiddleware.single('verificationDocument')(req, res, (err) => {
                if (err) {
                    console.error("Multer Error (Home Verification):", err.message);
                    return res.status(400).json({ message: `File upload failed: ${err.message}` });
                }
                next();
            });
        } else {
            next();
        }
    },
    InterviewController.submitHomeVerification
); 

// =============================================================
// 2. REPORT & GEOGRAPHIC API ROUTES
// =============================================================

// PDF Generation
router.post('/download-assignment-report', InterviewController.downloadAssignmentReport);

// Exam Centers & Jurisdictions
router.get('/exam-centers', InterviewController.getExamCenters);
router.get('/states', InterviewController.getAllStates); 
router.get('/divisions', InterviewController.getDivisionsByState);
router.get('/districts', InterviewController.getDistrictsByDivision);
router.get('/blocks', InterviewController.getBlocksByDistrict); 

// =============================================================
// 3. INTERVIEWER & STUDENT ASSIGNMENT ROUTES
// =============================================================

router.get('/interviewers', InterviewController.getInterviewers);
router.get('/students/:interviewerName', InterviewController.getStudentsByInterviewer);

// Assignment Filtering
router.get('/unassigned-students', InterviewController.getUnassignedStudents); 
router.get('/unassigned-students-by-block', InterviewController.getUnassignedStudentsByBlock);
router.get('/reassignable-students', InterviewController.getReassignableStudents);
router.get('/reassignable-students-by-block', InterviewController.getReassignableStudentsByBlock);

// Assignment Actions
router.post('/assign-students', InterviewController.assignStudents);
router.post('/reassign-students', InterviewController.reassignStudents);

// =============================================================
// 4. INTERVIEW RESULTS SUBMISSION
// =============================================================

// POST: Submit detailed interview results with a report file
router.post(
    '/submit-interview', 
    (req, res, next) => {
        if (req.uploadMiddleware) {
            // 'file' must match the key used in Frontend FormData.append()
            req.uploadMiddleware.single('file')(req, res, (err) => {
                if (err) {
                    console.error("Multer Error (Interview Submission):", err.message);
                    return res.status(400).json({ message: `File upload failed: ${err.message}` });
                }
                next();
            });
        } else {
            next();
        }
    },
    InterviewController.submitInterviewDetails
);

module.exports = router;