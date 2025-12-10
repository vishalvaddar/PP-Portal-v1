const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');

// 💡 Middleware to retrieve the Multer instance
// This runs for all routes defined below, making req.uploadMiddleware available.
router.use((req, res, next) => {
    // Get the configured Multer instance from the Express application object
    req.uploadMiddleware = req.app.get('multerUpload');
    if (!req.uploadMiddleware) {
        console.error("Multer upload instance is missing! Check server.js.");
    }
    next();
});

// =============================================================
// 1. HOME VERIFICATION ROUTES (MULTER ADDED)
// =============================================================
router.get('/students-for-verification', InterviewController.getStudentsForVerification);

// 🔥 Multer added: Assumes the single file field name is 'verificationDocument'
router.post(
    '/submit-home-verification', 
    (req, res, next) => {
        // Use the retrieved Multer instance (req.uploadMiddleware)
        if (req.uploadMiddleware) {
            // Apply Multer's single file upload handler
            req.uploadMiddleware.single('verificationDocument')(req, res, next);
        } else {
            next(); // Proceed if Multer isn't configured (though this would lead to errors if files are sent)
        }
    },
    InterviewController.submitHomeVerification
); 
 
// =============================================================
// 2. PDF REPORT ROUTE (NO CHANGE)
// =============================================================
router.post('/download-assignment-report', InterviewController.downloadAssignmentReport);

// =============================================================
// 3. GEOGRAPHIC API ROUTES (NO CHANGE)
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
// 4. INTERVIEWER & ASSIGNMENT ROUTES (MULTER ADDED TO SUBMIT-INTERVIEW)
// =============================================================

router.get('/interviewers', InterviewController.getInterviewers);
router.get('/students/:interviewerName', InterviewController.getStudentsByInterviewer);
router.get('/unassigned-students', InterviewController.getUnassignedStudents); 
router.get('/unassigned-students-by-block', InterviewController.getUnassignedStudentsByBlock);
router.get('/reassignable-students', InterviewController.getReassignableStudents);
router.get('/reassignable-students-by-block', InterviewController.getReassignableStudentsByBlock);
router.post('/assign-students', InterviewController.assignStudents);
router.post('/reassign-students', InterviewController.reassignStudents);

// 🔥 Multer added: Assumes the single file field name is 'file' (or 'nmms_document', adjust as per frontend)
router.post(
    '/submit-interview', 
    (req, res, next) => {
        // Use the retrieved Multer instance
        if (req.uploadMiddleware) {
            // Apply Multer's single file upload handler
            // Assuming the field name for the interview document is 'file'
            req.uploadMiddleware.single('file')(req, res, (err) => {
                if (err) {
                    console.error("Multer Error on submit-interview:", err.message);
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