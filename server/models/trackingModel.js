/**
 * @fileoverview Database model for student and interview tracking.
 * This file contains all SQL query functions to interact with the PostgreSQL database.
 */
const pool = require("../config/db"); 
 
const TrackingModel = { 
    /**
     * Fetches all available interviewers.
     */
    async getAllInterviewers() {
        const query = `
            SELECT interviewer_id, interviewer_name
            FROM pp.interviewer
            ORDER BY interviewer_name ASC;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error fetching all interviewers:", error);
            throw new Error("Failed to retrieve interviewers.");
        }
    },

    /**
     * Fetches paginated students based on separate status and result filters.
     */
async getStudentsWithLatestStatus(page, limit, statuses, results, homeVerificationSelected) {
    const offset = (page - 1) * limit;

    let baseQuery = `
        WITH RankedInterviews AS (
            SELECT
                a.applicant_id, 
                a.student_name, 
                s.interview_round, 
                s.status, 
                s.interview_result, 
                -- CRITICAL FIX: Look for 'Y' across ALL rounds for this student
                MAX(s.home_verification_req_yn) OVER (PARTITION BY a.applicant_id) as persistent_verification_req, 
                ROW_NUMBER() OVER (PARTITION BY a.applicant_id ORDER BY s.interview_round DESC) as rn
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
        ),
        LatestInterviews AS (
            -- We only take the most recent record, but it now "carries" the flag from earlier rounds
            SELECT * FROM RankedInterviews WHERE rn = 1
        )
    `;

    let filterConditions = '';
    const filterParams = [];
    let paramIndex = 1;
    const conditions = [];

    // 1. Status Category (SCHEDULED, COMPLETED, etc.)
    if (statuses && statuses.length > 0) {
        conditions.push(`UPPER(TRIM(status)) IN (${statuses.map(() => `$${paramIndex++}`).join(', ')})`);
        filterParams.push(...statuses.map(s => s.toUpperCase().trim()));
    }

    // 2. Result Category (SELECTED, REJECTED, HOME VERIFICATION)
    if ((results && results.length > 0) || homeVerificationSelected) {
        const resultSubConditions = [];
        
        // Standard Text Results
        if (results && results.length > 0) {
            resultSubConditions.push(`UPPER(TRIM(interview_result)) IN (${results.map(() => `$${paramIndex++}`).join(', ')})`);
            filterParams.push(...results.map(r => r.toUpperCase().trim()));
        }

        // Home Verification Flag (Checked against our persistent flag)
        if (homeVerificationSelected) {
            resultSubConditions.push(`UPPER(TRIM(persistent_verification_req)) = 'Y'`);
        }

        // Join multiple results with OR inside parentheses
        if (resultSubConditions.length > 0) {
            conditions.push(`(${resultSubConditions.join(' OR ')})`);
        }
    }

    // Combine Status and Results with AND
    if (conditions.length > 0) {
        filterConditions = ` WHERE ${conditions.join(' AND ')} `;
    }

    const dataQuery = `${baseQuery}
        SELECT applicant_id, student_name, interview_round, status, 
               interview_result AS result, persistent_verification_req as home_verification_req_yn
        FROM LatestInterviews
        ${filterConditions}
        ORDER BY student_name ASC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const countQuery = `${baseQuery}
        SELECT COUNT(*) AS total_count
        FROM LatestInterviews
        ${filterConditions};
    `;

    try {
        const dataResult = await pool.query(dataQuery, [...filterParams, limit, offset]);
        const countResult = await pool.query(countQuery, filterParams);
        const totalCount = parseInt(countResult.rows[0].total_count, 10);

        return {
            students: dataResult.rows,
            totalPages: Math.ceil(totalCount / limit),
            totalCount: totalCount
        };
    } catch (error) {
        console.error("Error in Model Logic:", error);
        throw error;
    }
},

    async getStudentsByInterviewer(interviewerId, page, limit) {
        const offset = (page - 1) * limit;

        const dataQuery = `
            SELECT
                a.applicant_id, a.student_name, s.interview_round, s.status, s.interview_result AS interview_result
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            WHERE s.interviewer_id = $1
            ORDER BY a.student_name ASC, s.interview_round DESC
            LIMIT $2 OFFSET $3;
        `;

        const countQuery = `
            SELECT COUNT(s.applicant_id)
            FROM pp.student_interview s
            WHERE s.interviewer_id = $1;
        `;

        try {
            const dataResult = await pool.query(dataQuery, [interviewerId, limit, offset]);
            const countResult = await pool.query(countQuery, [interviewerId]);

            return {
                students: dataResult.rows,
                totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
                currentPage: page,
                totalCount: parseInt(countResult.rows[0].count, 10)
            };
        } catch (error) {
            console.error("Error fetching students by interviewer:", error);
            throw new Error("Failed to retrieve assigned students.");
        }
    },

    /**
     * Fetches ALL interview rounds for a specific student. (Date formatting applied)
     */
    async getAllInterviewRounds(applicantId) {
        if (!applicantId) {
            console.error("Validation Error in getAllInterviewRounds: applicantId is invalid or missing.");
            return [];
        }
        const query = `
            SELECT
                a.student_name, s.applicant_id, s.interview_round,
                TO_CHAR(s.interview_date, 'YYYY-MM-DD') AS interview_date, -- DATE FORMATTING
                s.interview_time, s.interview_mode, s.status, s.life_goals_and_zeal,
                s.commitment_to_learning, s.integrity, s.communication_skills,
                s.interview_result AS interview_result, s.home_verification_req_yn,
                s.doc_name, s.doc_type, i.interviewer_name AS interviewer
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            LEFT JOIN pp.interviewer i ON i.interviewer_id = s.interviewer_id
            WHERE s.applicant_id = $1
            ORDER BY s.interview_round ASC;
        `;
        try {
            const result = await pool.query(query, [applicantId]);
            return result.rows;
        } catch (error) {
            console.error("Error fetching all interview rounds:", error);
            throw new Error("Failed to retrieve interview round details.");
        }
    },
    
    /**
     * Fetches ALL home verification rounds for a specific student. (Date formatting applied)
     */
    async getAllHomeVerificationRounds(applicantId) {
        if (!applicantId) {
            console.error("Validation Error in getAllHomeVerificationRounds: applicantId is invalid or missing.");
            return [];
        }
        const query = `
            SELECT
                h.verification_id, 
                TO_CHAR(h.date_of_verification, 'YYYY-MM-DD') AS date_of_verification, -- DATE FORMATTING
                h.status AS home_verification_status, h.verified_by, h.verification_type AS home_verification_type,
                h.doc_name AS home_verification_doc_name, h.doc_type AS home_verification_doc_type, h.remarks
            FROM pp.home_verification h
            WHERE h.applicant_id = $1
            ORDER BY h.date_of_verification ASC;
        `;
        try {
            const result = await pool.query(query, [applicantId]);
            return result.rows;
        } catch (error) {
            console.error("Error fetching all home verification rounds:", error);
            throw new Error("Failed to retrieve home verification details.");
        }
    },

    /**
     * Fetches the latest round details for a student. (Date formatting applied)
     */
    async getStudentdetailforFilter(applicantId) {
        if (!applicantId) {
            console.error("Validation Error in getStudentdetailforFilter: applicantId is invalid or missing.", applicantId);
            return [];
        }
        const query = `
            SELECT
                a.student_name, s.interview_round,
                TO_CHAR(s.interview_date, 'YYYY-MM-DD') AS interview_date, -- DATE FORMATTING
                s.interview_time, s.interview_mode, s.status, s.life_goals_and_zeal,
                s.commitment_to_learning, s.integrity, s.communication_skills,
                s.interview_result AS interview_result, s.home_verification_req_yn,
                i.interviewer_name AS interviewer
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            LEFT JOIN pp.interviewer i ON i.interviewer_id = s.interviewer_id
            WHERE a.applicant_id = $1
            AND s.interview_round = (
                SELECT MAX(interview_round)
                FROM pp.student_interview
                WHERE applicant_id = a.applicant_id
            )
            ORDER BY s.interview_round DESC;
        `;

        try {
            const result = await pool.query(query, [applicantId]);
            return result.rows;
        } catch (error) {
            console.error("Error fetching student details for filter:", error);
            throw new Error("Failed to retrieve filtered student details.");
        }
    },

    async getInterviewDocument(applicantId) { 
        if (!applicantId) {
            console.error("Validation Error in getInterviewDocument: applicantId is invalid or missing.");
            return null;
        }
        
        const query = `
            SELECT
                doc_name, doc_type, interview_round
            FROM pp.student_interview
            WHERE applicant_id = $1
            AND doc_name IS NOT NULL
            ORDER BY interview_round DESC
            LIMIT 1;
        `;
        try {
            const result = await pool.query(query, [applicantId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error("Error fetching latest interview document:", error);
            return null;
        }
    },
    
    async getHomeVerificationDocument(applicantId) { 
        if (!applicantId) {
            console.error("Validation Error in getHomeVerificationDocument: applicantId is invalid or missing.");
            return null;
        }

        const query = `
            SELECT
                doc_name, doc_type
            FROM pp.home_verification
            WHERE applicant_id = $1
            AND doc_name IS NOT NULL
            ORDER BY date_of_verification DESC, verification_id DESC
            LIMIT 1;
        `;
        try {
            const result = await pool.query(query, [applicantId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error("Error fetching latest home verification document:", error);
            return null;
        }
    }
};

module.exports = TrackingModel;