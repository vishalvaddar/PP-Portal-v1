/**
 * @fileoverview Database model for student and interview tracking.
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
     * Fetches paginated students based on separate status, result, and NMMS year filters.
     */
    async getStudentsWithLatestStatus(page, limit, statuses, results, homeVerificationSelected, nmmsYear) {
        const offset = (page - 1) * limit;

        // Base param index starts at 1
        let paramIndex = 1;
        const baseParams = [nmmsYear]; 
        const yearPlaceholder = `$${paramIndex++}`; // $1 will always be nmmsYear

        let baseQuery = `
            WITH RankedInterviews AS (
                SELECT
                    a.applicant_id, 
                    a.student_name, 
                    s.interview_round, 
                    s.status, 
                    s.interview_result, 
                    MAX(s.home_verification_req_yn) OVER (PARTITION BY a.applicant_id) as persistent_verification_req, 
                    ROW_NUMBER() OVER (PARTITION BY a.applicant_id ORDER BY s.interview_round DESC) as rn
                FROM pp.student_interview s
                JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
                WHERE a.nmms_year = ${yearPlaceholder}
            ),
            LatestInterviews AS (
                SELECT * FROM RankedInterviews WHERE rn = 1
            )
        `;

        let filterConditions = '';
        const filterParams = [];
        const conditions = [];

        // 1. Status Category
        if (statuses && statuses.length > 0) {
            conditions.push(`UPPER(TRIM(status)) IN (${statuses.map(() => `$${paramIndex++}`).join(', ')})`);
            filterParams.push(...statuses.map(s => s.toUpperCase().trim()));
        }

        // 2. Result Category
        if ((results && results.length > 0) || homeVerificationSelected) {
            const resultSubConditions = [];
            if (results && results.length > 0) {
                resultSubConditions.push(`UPPER(TRIM(interview_result)) IN (${results.map(() => `$${paramIndex++}`).join(', ')})`);
                filterParams.push(...results.map(r => r.toUpperCase().trim()));
            }
            if (homeVerificationSelected) {
                resultSubConditions.push(`UPPER(TRIM(persistent_verification_req)) = 'Y'`);
            }
            if (resultSubConditions.length > 0) {
                conditions.push(`(${resultSubConditions.join(' OR ')})`);
            }
        }

        if (conditions.length > 0) {
            filterConditions = ` WHERE ${conditions.join(' AND ')} `;
        }

        // Full array of parameters: [nmmsYear, ...statuses, ...results]
        const finalParams = [...baseParams, ...filterParams];

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
            const dataResult = await pool.query(dataQuery, [...finalParams, limit, offset]);
            const countResult = await pool.query(countQuery, finalParams);
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

    async getStudentsByInterviewer(interviewerId, page, limit, nmmsYear) {
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT
                a.applicant_id, a.student_name, s.interview_round, s.status, s.interview_result AS interview_result
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            WHERE s.interviewer_id = $1 AND a.nmms_year = $4
            ORDER BY a.student_name ASC, s.interview_round DESC
            LIMIT $2 OFFSET $3;
        `;

        const countQuery = `
            SELECT COUNT(s.applicant_id)
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            WHERE s.interviewer_id = $1 AND a.nmms_year = $2;
        `;

        try {
            const dataResult = await pool.query(dataQuery, [interviewerId, limit, offset, nmmsYear]);
            const countResult = await pool.query(countQuery, [interviewerId, nmmsYear]);
            const count = parseInt(countResult.rows[0].count, 10);

            return {
                students: dataResult.rows,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalCount: count
            };
        } catch (error) {
            console.error("Error fetching students by interviewer:", error);
            throw new Error("Failed to retrieve assigned students.");
        }
    },

    async getAllInterviewRounds(applicantId, nmmsYear) {
        if (!applicantId) return [];
        const query = `
            SELECT
                a.student_name, s.applicant_id, s.interview_round,
                TO_CHAR(s.interview_date, 'YYYY-MM-DD') AS interview_date,
                s.interview_time, s.interview_mode, s.status, s.life_goals_and_zeal,
                s.commitment_to_learning, s.integrity, s.communication_skills,
                s.interview_result AS interview_result, s.home_verification_req_yn,
                s.doc_name, s.doc_type, i.interviewer_name AS interviewer
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            LEFT JOIN pp.interviewer i ON i.interviewer_id = s.interviewer_id
            WHERE s.applicant_id = $1 AND a.nmms_year = $2
            ORDER BY s.interview_round ASC;
        `;
        try {
            const result = await pool.query(query, [applicantId, nmmsYear]);
            return result.rows;
        } catch (error) {
            console.error("Error fetching all interview rounds:", error);
            throw new Error("Failed to retrieve interview round details.");
        }
    },

    async getStudentdetailforFilter(applicantId, nmmsYear) {
        if (!applicantId) return [];
        const query = `
            SELECT
                a.student_name, s.interview_round,
                TO_CHAR(s.interview_date, 'YYYY-MM-DD') AS interview_date,
                s.interview_time, s.interview_mode, s.status, s.life_goals_and_zeal,
                s.commitment_to_learning, s.integrity, s.communication_skills,
                s.interview_result AS interview_result, s.home_verification_req_yn,
                i.interviewer_name AS interviewer
            FROM pp.student_interview s
            JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
            LEFT JOIN pp.interviewer i ON i.interviewer_id = s.interviewer_id
            WHERE a.applicant_id = $1 AND a.nmms_year = $2
            AND s.interview_round = (
                SELECT MAX(interview_round)
                FROM pp.student_interview
                WHERE applicant_id = a.applicant_id
            )
            ORDER BY s.interview_round DESC;
        `;
        try {
            const result = await pool.query(query, [applicantId, nmmsYear]);
            return result.rows;
        } catch (error) {
            console.error("Error fetching student details for filter:", error);
            throw new Error("Failed to retrieve filtered student details.");
        }
    },

    // Documents functions (usually don't need nmms_year as applicant_id is unique, 
    // but kept as-is per your request if specific round logic is needed)
    async getInterviewDocument(applicantId) { 
        const query = `
            SELECT doc_name, doc_type, interview_round
            FROM pp.student_interview
            WHERE applicant_id = $1 AND doc_name IS NOT NULL
            ORDER BY interview_round DESC LIMIT 1;
        `;
        const result = await pool.query(query, [applicantId]);
        return result.rows[0] || null;
    },
    
    async getHomeVerificationDocument(applicantId) { 
        const query = `
            SELECT doc_name, doc_type
            FROM pp.home_verification
            WHERE applicant_id = $1 AND doc_name IS NOT NULL
            ORDER BY date_of_verification DESC, verification_id DESC LIMIT 1;
        `;
        const result = await pool.query(query, [applicantId]);
        return result.rows[0] || null;
    }
};

module.exports = TrackingModel;