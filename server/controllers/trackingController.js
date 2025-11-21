/**
 * @fileoverview Express controllers for handling API requests for student and interview tracking.
 */
const path = require('path');
const fs = require('fs'); 
const trackingModel = require('../models/trackingModel');

// --- Configuration ---
const BASE_DATA_DIR = 'Data'; 
const INTERVIEW_DOC_DIR = 'Interview-data';
const HOME_VERIFICATION_DOC_DIR = 'home-verification-data';

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
        const results = req.query.results ? req.query.results.split(',').filter(s => s.trim() !== '') : [];

        try {
            const data = await trackingModel.getStudentsWithLatestStatus(page, limit, statuses, results);

            res.json({
                students: data.students,
                currentPage: page,
                totalPages: data.totalPages,
                totalStudents: data.totalCount
            });

        } catch (error) {
            console.error("Error fetching students by status/result:", error.message);
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
                rounds = await trackingModel.getStudentdetailforFilter(applicantId);
            } else { 
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

  // D:\latest_phase3\PP-Portal-v1\server\controllers\trackingController.js

async getAllHomeVerificationRounds(req, res) {
    const applicantId = parseInt(req.params.applicantId);
    if (isNaN(applicantId)) {
        return res.status(400).json({ error: "Invalid Applicant ID." });
    }
    try {
        const verifications = await trackingModel.getAllHomeVerificationRounds(applicantId);
        
        // ✅ MODIFICATION: Filter out 'time' and 'mode' from each object
        const filteredVerifications = verifications.map(verification => {
            // Destructure 'time' and 'mode' to discard them, and collect the rest of the fields into 'rest'
            const { time, mode, ...rest } = verification; 
            return rest; // Return the object without 'time' and 'mode'
        });

        // Send the filtered array
        res.json(filteredVerifications); 

    } catch (error) {
        console.error(`Error fetching all home verifications for ${applicantId}:`, error.message);
        res.status(500).json({ error: "Could not fetch home verification records." });
    }
},


  
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
        let urlFolderSegment; // Variable to hold the URL path segment (e.g., Interview-data)

        if (docType === 'home') {
            docInfo = await trackingModel.getHomeVerificationDocument(applicantId);
            dataFolder = HOME_VERIFICATION_DOC_DIR; 
            // 🔥 Use the exact URL segment (must match physical folder casing for reliability)
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
        // We use the local folder constant (dataFolder) for this check.
        const absoluteFilePath = constructFilePath(dataFolder, doc_name, cohortFolder);
        if (!fs.existsSync(absoluteFilePath)) {
            console.error(`[ERROR] File metadata exists, but file not found on disk at: ${absoluteFilePath}`);
            return res.status(404).send(`File not found on the server in the expected folder.`);
        }
        
        // --- 2. Construct the Public Redirect URL (CRITICAL FIX) ---
        // This generates the absolute path from the server's root (e.g., /Data/Folder/Cohort/File.pdf)
        const publicUrlPath = path.posix.join(
            '/', // Start from root
            BASE_DATA_DIR, 
            urlFolderSegment, // Use the correct folder segment for the URL
            String(cohortFolder), 
            doc_name
        );
        
        return res.redirect(publicUrlPath);

    } catch (err) {
        console.error('Error in downloadDocument controller:', err);
        if (!res.headersSent) {
            res.status(500).send('Server Error retrieving document.');
        }
    }
    try {
        // Add debug logging
        console.log('Request params:', {
            applicantId,
            cohortFolder,
            docType,
            absoluteFilePath,
            publicUrlPath
        });
        
        // Verify file exists before redirect
        if (!fs.existsSync(absoluteFilePath)) {
            console.error(`File not found: ${absoluteFilePath}`);
            return res.status(404).send('File not found');
        }
        
        // Log the redirect path
        console.log('Redirecting to:', publicUrlPath);
        
        return res.redirect(publicUrlPath);
    } catch (err) {
        // ...existing error handling...
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