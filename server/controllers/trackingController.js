/**
 * @fileoverview Express controllers for handling API requests for student and interview tracking.
 */ 
const path = require('path'); 
const fs = require('fs'); 
const trackingModel = require('../models/trackingModel'); // Assuming correct path

// --- Configuration ---
const BASE_DATA_DIR = 'Data'; 
const INTERVIEW_DOC_DIR = 'Interview-data';
const HOME_VERIFICATION_DOC_DIR = 'home-verification-data'; // Use this constant for file path construction

// --- Utility Function: Path Construction ---
const constructFilePath = (docTypeFolder, doc_name, cohortFolder) => {
    // __dirname is inside /server/controllers. We assume the 'Data' folder is in the project root.
    const PROJECT_ROOT = path.join(__dirname, '..', '..');

    const filePath = path.join(
        PROJECT_ROOT,
        BASE_DATA_DIR, 
        docTypeFolder, 
        String(cohortFolder), 
        doc_name
    );
    return filePath;
};


const trackingController = {
    // --- LIST AND FILTER FUNCTIONS (Standard Logic) ---
    
    async getAllInterviewers(req, res) {
        try {
            const interviewers = await trackingModel.getAllInterviewers();
            res.json(interviewers);
        } catch (error) {
            console.error("Error in getAllInterviewers:", error.message);
            res.status(500).json({ error: "Could not fetch interviewers." });
        }
    },

async getStudents(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    
    const statuses = req.query.statuses ? req.query.statuses.split(',').filter(s => s.trim() !== '') : [];
    const resultsRaw = req.query.results ? req.query.results.split(',').filter(s => s.trim() !== '') : [];

    // Identify if the special home verification filter is active
    const homeVerificationSelected = resultsRaw.includes('HOME VERIFICATION REQUIRED');
    
    // Clean the results array so it only contains DB-stored values (like SELECTED, REJECTED)
    const results = resultsRaw.filter(r => r !== 'HOME VERIFICATION REQUIRED');

    try {
        const data = await trackingModel.getStudentsWithLatestStatus(
            page, 
            limit, 
            statuses, 
            results, 
            homeVerificationSelected // Explicitly pass this instruction
        );

        res.json({
            students: data.students,
            currentPage: page,
            totalPages: data.totalPages,
            totalStudents: data.totalCount
        });

    } catch (error) {
        console.error("Error fetching students:", error.message);
        res.status(500).json({ error: "Could not fetch student tracking data." });
    }
},

    async getStudentsByInterviewer(req, res) {
        const interviewerId = parseInt(req.params.interviewerId);
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        if (isNaN(interviewerId)) {
            return res.status(400).json({ error: "Invalid Interviewer ID provided." });
        }

        try {
            const data = await trackingModel.getStudentsByInterviewer(interviewerId, page, limit);

            res.json({
                students: data.students,
                currentPage: page,
                totalPages: data.totalPages,
                totalStudents: data.totalCount
            });

        } catch (error) {
            console.error(`Error fetching students for interviewer ${interviewerId}:`, error.message);
            res.status(500).json({ error: "Could not fetch students assigned to interviewer." });
        }
    },

    // --- DETAIL VIEW FUNCTIONS (Unchanged) ---

    async getStudentDetails(req, res) {
        const applicantId = parseInt(req.params.applicantId);
        const isFilteredView = req.query.filtered === 'true'; 

        if (isNaN(applicantId)) {
            return res.status(400).json({ error: "Invalid Applicant ID." });
        }

        try {
            let rounds;
            if (isFilteredView) {
                // Assuming getStudentdetailforFilter fetches the latest single round
                rounds = await trackingModel.getStudentdetailforFilter(applicantId);
            } else { 
                // Currently duplicates logic, assuming the intent is to get all rounds if not filtered, 
                // but the FE uses dedicated /all routes now, so this is fine for legacy use.
                rounds = await trackingModel.getStudentdetailforFilter(applicantId);
            }
            
            if (rounds.length === 0) {
                return res.status(404).json({ error: "Student or interview data not found." });
            }
            res.json(rounds); 

        } catch (error) {
            console.error("Error fetching student details:", error.message);
            res.status(500).json({ error: "Could not fetch student interview details." });
        }
    },

    async getAllInterviewRounds(req, res) {
        const applicantId = parseInt(req.params.applicantId);
        if (isNaN(applicantId)) {
            return res.status(400).json({ error: "Invalid Applicant ID." });
        }
        try {
            const rounds = await trackingModel.getAllInterviewRounds(applicantId);
            res.json(rounds);
        } catch (error) {
            console.error(`Error fetching all interviews for ${applicantId}:`, error.message);
            res.status(500).json({ error: "Could not fetch all interview rounds." });
        }
    },

    async getAllHomeVerificationRounds(req, res) {
        const applicantId = parseInt(req.params.applicantId);
        if (isNaN(applicantId)) {
            return res.status(400).json({ error: "Invalid Applicant ID." });
        }
        try {
            const verifications = await trackingModel.getAllHomeVerificationRounds(applicantId);
            
            // Filter out any unused properties if necessary, though the model query should handle this.
            const filteredVerifications = verifications.map(verification => {
                 // Removed explicit destructuring for 'time'/'mode' as model shouldn't return them for HV, but left existing clean-up logic if needed.
                 return verification;
            });

            res.json(filteredVerifications); 

        } catch (error) {
            console.error(`Error fetching all home verifications for ${applicantId}:`, error.message);
            res.status(500).json({ error: "Could not fetch home verification records." });
        }
    },

    // --- DOCUMENT DOWNLOAD FUNCTION (Cleaned and Confirmed) ---
    async downloadDocument(req, res) {
        const applicantId = parseInt(req.params.applicantId);
        let cohortFolder = req.params.cohortId; 
        const docType = req.query.type; 

        if (isNaN(applicantId) || !cohortFolder || !['interview', 'home'].includes(docType)) {
            return res.status(400).send('Invalid Applicant ID, Cohort ID, or Type parameter.');
        }

        try {
            let docInfo;
            let dataFolder;
            let urlFolderSegment; 

            if (docType === 'home') {
                docInfo = await trackingModel.getHomeVerificationDocument(applicantId);
                dataFolder = HOME_VERIFICATION_DOC_DIR; 
                urlFolderSegment = HOME_VERIFICATION_DOC_DIR; 
            } else { // 'interview'
                docInfo = await trackingModel.getInterviewDocument(applicantId);
                dataFolder = INTERVIEW_DOC_DIR; 
                urlFolderSegment = INTERVIEW_DOC_DIR;
            }

            if (!docInfo || !docInfo.doc_name) {
                return res.status(404).send(`Document metadata not found in database for ${docType}.`);
            }

            let { doc_name } = docInfo;

            // Filename sanitation to get only the base name (no path segments)
            const pathSegments = doc_name.split(/\\|\//).filter(s => s); 
            if (pathSegments.length > 1) {
                doc_name = pathSegments.pop();
            }

            // --- 1. Verify File Existence on Disk ---
            const absoluteFilePath = constructFilePath(dataFolder, doc_name, cohortFolder);
            
            // Add debug logging
            console.log('Document Request Info:', {
                applicantId,
                cohortFolder,
                docType,
                absoluteFilePath: absoluteFilePath,
            });

            if (!fs.existsSync(absoluteFilePath)) {
                console.error(`[ERROR] File metadata exists, but file not found on disk at: ${absoluteFilePath}`);
                return res.status(404).send(`File not found on the server in the expected folder.`);
            }
            
            // --- 2. Construct the Public Redirect URL ---
            const publicUrlPath = path.posix.join(
                '/', 
                BASE_DATA_DIR, 
                urlFolderSegment, // Uses 'home-verification-data' for home files
                String(cohortFolder), 
                doc_name
            );
            
            console.log('Redirecting client to file path:', publicUrlPath);
            return res.redirect(publicUrlPath);

        } catch (err) {
            console.error('Error in downloadDocument controller:', err);
            if (!res.headersSent) {
                res.status(500).send('Server Error retrieving document.');
            }
        }
    }
};

module.exports = {
    getAllInterviewers: trackingController.getAllInterviewers,
    getStudents: trackingController.getStudents,
    getStudentsByInterviewer: trackingController.getStudentsByInterviewer,
    
    // Detail Fetch Exports
    getStudentDetails: trackingController.getStudentDetails, 
    getAllInterviewRounds: trackingController.getAllInterviewRounds,
    getAllHomeVerificationRounds: trackingController.getAllHomeVerificationRounds,

    downloadDocument: trackingController.downloadDocument,
};