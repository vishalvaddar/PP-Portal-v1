const pool = require("../config/db");

const DashboardModel = {
  /**
   * Fetches high-level counts for all applicants for a given year.
   * @param {number} nmmsYear - The NMMS year (e.g., 2025).
   * @returns {Promise<object>} An object with all the dashboard counts.
   */
  async getOverallCounts(nmmsYear) {
    try {
      const queries = [
        { label: 'Total Students', sql: `SELECT COUNT(*) FROM pp.applicant_primary_info WHERE nmms_year = $1;` },
        { label: 'Shortlisted', sql: `SELECT COUNT(*) FROM pp.applicant_shortlist_info a WHERE EXISTS (SELECT 1 FROM pp.applicant_primary_info api WHERE api.applicant_id = a.applicant_id AND api.nmms_year = $1);` },
        { label: 'Evaluated', sql: `SELECT COUNT(*) FROM pp.applicant_secondary_info asi JOIN pp.applicant_primary_info api ON asi.applicant_id = api.applicant_id WHERE api.nmms_year = $1;` },
        { label: 'Pending Evaluation/Marks Entry', sql: `SELECT COUNT(*) FROM pp.applicant_primary_info a WHERE a.applicant_id NOT IN (SELECT asi.applicant_id FROM pp.applicant_secondary_info asi) AND a.applicant_id IN (SELECT s.applicant_id FROM pp.applicant_shortlist_info s) AND a.nmms_year = $1;` },
        { label: 'Interview Required', sql: `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1;` },
        { label: 'Pending Interviews Assignment', sql: `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND NOT EXISTS (SELECT 1 FROM pp.student_interview si WHERE si.applicant_id = er.applicant_id);` },
        { label: 'Pending Interview Result Upload', sql: `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND EXISTS (SELECT 1 FROM pp.student_interview si WHERE si.applicant_id = er.applicant_id AND si.interview_result IS NULL);` },
        { label: 'Home Verification Required', sql: `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND EXISTS (SELECT 1 FROM pp.student_interview si WHERE si.applicant_id = er.applicant_id AND si.home_verification_req_yn='Y');` },
        { label: 'Pending Home Verification Result Upload', sql: `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND EXISTS (SELECT 1 FROM pp.student_interview si WHERE si.applicant_id = er.applicant_id AND si.home_verification_req_yn = 'Y') AND NOT EXISTS (SELECT 1 FROM pp.home_verification hv WHERE hv.applicant_id = er.applicant_id AND hv.status IS NOT NULL);` },
      ];

      const results = {};
      for (const q of queries) {
        const result = await pool.query(q.sql, [nmmsYear]);
        results[q.label] = parseInt(result.rows[0].count, 10);
      }
      return results;
    } catch (err) {
      console.error('Error fetching overall counts:', err);
      throw err;
    }
  },

  /**
   * Fetches all distinct jurisdictions for a given year.
   * @param {number} nmmsYear - The NMMS year (e.g., 2025).
   * @returns {Promise<Array<object>>} An array of jurisdiction objects.
   */
  async getJurisdictions(nmmsYear) {
    try {
      const sql = `
        SELECT DISTINCT j.juris_name, j.juris_code
        FROM pp.jurisdiction j
        JOIN pp.applicant_primary_info a ON j.juris_code = a.nmms_block AND a.nmms_year = $1
        JOIN pp.applicant_exam ae ON a.applicant_id = ae.applicant_id
        JOIN pp.examination e ON ae.exam_id = e.exam_id;
      `;
      const result = await pool.query(sql, [nmmsYear]);
      return result.rows;
    } catch (err) {
      console.error('Error fetching jurisdictions:', err);
      throw err;
    }
  },

  /**
   * Fetches specific progress counts for a single jurisdiction block.
   * @param {string} blockCode - The jurisdiction's block code.
   * @param {number} nmmsYear - The NMMS year (e.g., 2025).
   * @returns {Promise<object>} An object with counts for the specified block.
   */
  async getJurisdictionCounts(blockCode, nmmsYear) {
    try {
      const queries = {
        totalShortlisted: `
          SELECT COUNT(*)
          FROM pp.applicant_primary_info a
          WHERE a.applicant_id IN (
              SELECT s.applicant_id
              FROM pp.applicant_shortlist_info s
          )
          AND a.nmms_year = $1
          AND a.nmms_block = $2;
        `,
        pendingEvaluation: `
          SELECT COUNT(*)
          FROM pp.applicant_primary_info a
          WHERE a.applicant_id NOT IN (
              SELECT asi.applicant_id
              FROM pp.applicant_secondary_info asi
          )
          AND a.nmms_block = $2
          AND a.applicant_id IN (
              SELECT s.applicant_id
              FROM pp.applicant_shortlist_info s
          )
          AND a.nmms_year = $1;
        `,
        totalInterviewRequired: `
          SELECT COUNT(*)
          FROM pp.exam_results er
          JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id
          WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND api.nmms_block = $2;
        `,
        completedInterview: `
          SELECT COUNT(DISTINCT si.applicant_id)
          FROM pp.student_interview si
          JOIN pp.exam_results er ON si.applicant_id = er.applicant_id
          JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id
          WHERE api.nmms_block = $2
            AND er.interview_required_yn = 'Y'
            AND er.pp_exam_cleared = 'Y'
            AND api.nmms_year = $1
            AND si.status ='Completed';
        `,
        totalHomeVerificationRequired: `
          SELECT COUNT(*)
          FROM pp.exam_results er
          JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id
          WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1
            AND EXISTS (
                SELECT 1
                FROM pp.student_interview si
                WHERE si.applicant_id = er.applicant_id
                AND si.home_verification_req_yn = 'Y'
            )
            AND api.nmms_block = $2;
        `,
        completedHomeVerification: `
          SELECT COUNT(*)
          FROM pp.exam_results er
          JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id
          WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND api.nmms_block = $2
            AND EXISTS (
                SELECT 1 FROM pp.student_interview si WHERE si.applicant_id = er.applicant_id AND si.home_verification_req_yn = 'Y'
            ) AND EXISTS (
                SELECT 1 FROM pp.home_verification hv WHERE hv.applicant_id = er.applicant_id AND hv.status IS NOT NULL
            );
        `
      };

      const results = {};
      for (const [key, sql] of Object.entries(queries)) {
        const result = await pool.query(sql, [nmmsYear, blockCode]);
        results[key] = parseInt(result.rows[0].count, 10);
      }
      return results;
    } catch (err) {
      console.error(`Error fetching counts for block ${blockCode}:`, err);
      throw err;
    }
  },

  /**
   * Fetches the overall progress percentage for the entire system for a given year.
   * This is a weighted progress based on all required and completed tasks.
   * @param {number} nmmsYear - The NMMS year (e.g., 2025).
   * @returns {Promise<object>} An object with the overall progress percentage.
   */
  async getOverallProgress(nmmsYear) {
    try {
      // Step 1: Get the total number of shortlisted students who require marks entry
      const totalShortlistedQuery = `SELECT COUNT(*) FROM pp.applicant_shortlist_info a JOIN pp.applicant_primary_info api ON a.applicant_id = api.applicant_id WHERE api.nmms_year = $1;`;
      const totalShortlistedResult = await pool.query(totalShortlistedQuery, [nmmsYear]);
      const totalShortlisted = parseInt(totalShortlistedResult.rows[0].count, 10);

      // Step 2: Get the total completed marks entries
      const completedMarksEntryQuery = `SELECT COUNT(*) FROM pp.applicant_primary_info api JOIN pp.applicant_shortlist_info asi ON api.applicant_id = asi.applicant_id JOIN pp.applicant_secondary_info ass ON api.applicant_id = ass.applicant_id WHERE api.nmms_year = $1;`;
      const completedMarksEntryResult = await pool.query(completedMarksEntryQuery, [nmmsYear]);
      const completedMarksEntry = parseInt(completedMarksEntryResult.rows[0].count, 10);

      // Step 3: Get the total number of required and completed interviews
      const totalInterviewRequiredQuery = `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1;`;
      const totalInterviewRequiredResult = await pool.query(totalInterviewRequiredQuery, [nmmsYear]);
      const totalInterviewRequired = parseInt(totalInterviewRequiredResult.rows[0].count, 10);

      const completedInterviewQuery = `SELECT COUNT(*) FROM pp.student_interview si JOIN pp.applicant_primary_info api ON si.applicant_id = api.applicant_id WHERE si.status = 'Completed' AND api.nmms_year = $1;`;
      const completedInterviewResult = await pool.query(completedInterviewQuery, [nmmsYear]);
      const completedInterview = parseInt(completedInterviewResult.rows[0].count, 10);

      // Step 4: Get the total number of required and completed home verifications
      const totalHomeVerificationRequiredQuery = `SELECT COUNT(*) FROM pp.student_interview si JOIN pp.applicant_primary_info api ON si.applicant_id = api.applicant_id WHERE si.home_verification_req_yn = 'Y' AND api.nmms_year = $1;`;
      const totalHomeVerificationRequiredResult = await pool.query(totalHomeVerificationRequiredQuery, [nmmsYear]);
      const totalHomeVerificationRequired = parseInt(totalHomeVerificationRequiredResult.rows[0].count, 10);

      const completedHomeVerificationQuery = `SELECT COUNT(*) FROM pp.home_verification hv JOIN pp.applicant_primary_info api ON hv.applicant_id = api.applicant_id WHERE hv.status IS NOT NULL AND api.nmms_year = $1;`;
      const completedHomeVerificationResult = await pool.query(completedHomeVerificationQuery, [nmmsYear]);
      const completedHomeVerification = parseInt(completedHomeVerificationResult.rows[0].count, 10);
      
      // Step 5: Calculate the final overall progress percentage
      const totalCompletedTasks = completedMarksEntry + completedInterview + completedHomeVerification;
      const totalRequiredTasks = totalShortlisted + totalInterviewRequired + totalHomeVerificationRequired;

      let overallProgress = 0;
      if (totalRequiredTasks > 0) {
        overallProgress = Math.round((totalCompletedTasks / totalRequiredTasks) * 100);
      }

      return { overallProgress };

    } catch (err) {
      console.error('Error fetching overall progress:', err);
      throw err;
    }
  }
};

module.exports = DashboardModel;