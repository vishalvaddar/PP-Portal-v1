/** * @fileoverview Express controllers for handling API requests for student and interview tracking.
 */ 
const path = require('path'); 
const fs = require('fs'); 
const trackingModel = require('../models/trackingModel');

const PC_STORAGE_ROOT = process.env.FILE_STORAGE_PATH; 
const INTERVIEW_DOC_DIR = 'Interview-data';
const HOME_VERIFICATION_DOC_DIR = 'home-verification-data';

// --- Utility Function ---
const constructFilePath = (docTypeFolder, doc_name, cohortFolder) => {
    return path.join(
        PC_STORAGE_ROOT,
        docTypeFolder, 
        String(cohortFolder), 
        doc_name
    );
};

const trackingController = {
    
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
        // Extract NMMS Year from query
        const nmmsYear = req.query.nmms_year || 2025; 
        
        const statuses = req.query.statuses ? req.query.statuses.split(',').filter(s => s.trim() !== '') : [];
        const resultsRaw = req.query.results ? req.query.results.split(',').filter(s => s.trim() !== '') : [];

        const homeVerificationSelected = resultsRaw.includes('HOME VERIFICATION REQUIRED');
        const results = resultsRaw.filter(r => r !== 'HOME VERIFICATION REQUIRED');

        try {
            const data = await trackingModel.getStudentsWithLatestStatus(
                page, 
                limit, 
                statuses, 
                results, 
                homeVerificationSelected,
                nmmsYear // Pass year to model
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
        const nmmsYear = req.query.nmms_year || 2025; // Extract Year

        if (isNaN(interviewerId)) {
            return res.status(400).json({ error: "Invalid Interviewer ID provided." });
        }

        try {
            const data = await trackingModel.getStudentsByInterviewer(interviewerId, page, limit, nmmsYear);

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

    async getStudentDetails(req, res) {
        const applicantId = parseInt(req.params.applicantId);
        const nmmsYear = req.query.nmms_year || 2025; // Extract Year
        const isFilteredView = req.query.filtered === 'true'; 

        if (isNaN(applicantId)) {
            return res.status(400).json({ error: "Invalid Applicant ID." });
        }

        try {
            let rounds;
            if (isFilteredView) {
                rounds = await trackingModel.getStudentdetailforFilter(applicantId, nmmsYear);
            } else { 
                rounds = await trackingModel.getStudentdetailforFilter(applicantId, nmmsYear);
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
        const nmmsYear = req.query.nmms_year || 2025; // Extract Year

        if (isNaN(applicantId)) {
            return res.status(400).json({ error: "Invalid Applicant ID." });
        }
        try {
            const rounds = await trackingModel.getAllInterviewRounds(applicantId, nmmsYear);
            res.json(rounds);
        } catch (error) {
            console.error(`Error fetching all interviews for ${applicantId}:`, error.message);
            res.status(500).json({ error: "Could not fetch all interview rounds." });
        }
    },

    async getAllHomeVerificationRounds(req, res) {
        const applicantId = parseInt(req.params.applicantId);
        // Note: home_verification table usually doesn't need nmms_year if applicant_id is unique, 
        // but it's here if your table logic requires it.
        if (isNaN(applicantId)) {
            return res.status(400).json({ error: "Invalid Applicant ID." });
        }
        try {
            const verifications = await trackingModel.getAllHomeVerificationRounds(applicantId);
            res.json(verifications); 
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
            return res.status(400).send('Invalid parameters.');
        }

        try {
            let docInfo;
            let dataFolder;

            if (docType === 'home') {
                docInfo = await trackingModel.getHomeVerificationDocument(applicantId);
                dataFolder = HOME_VERIFICATION_DOC_DIR;
            } else { 
                docInfo = await trackingModel.getInterviewDocument(applicantId);
                dataFolder = INTERVIEW_DOC_DIR;
            }

            if (!docInfo || !docInfo.doc_name) {
                return res.status(404).send(`Document metadata not found.`);
            }

            let { doc_name } = docInfo;
            const pathSegments = doc_name.split(/\\|\//).filter(s => s); 
            if (pathSegments.length > 0) doc_name = pathSegments.pop();

            const absoluteFilePath = constructFilePath(dataFolder, doc_name, cohortFolder);
            
            if (!fs.existsSync(absoluteFilePath)) {
                return res.status(404).send(`File not found on storage.`);
            }
            
            const publicUrlPath = path.posix.join('/Data', dataFolder, String(cohortFolder), doc_name);
            return res.redirect(publicUrlPath);

        } catch (err) {
            console.error('Error in downloadDocument:', err);
            res.status(500).send('Server Error.');
        }
    }
};

module.exports = trackingController;