const pool = require("../config/db");

const DashboardModel = {
  // 1. High-level counts
  async getOverallCounts(nmmsYear) {
    try {
      const queries = [
        { label: 'Total Students', sql: `SELECT COUNT(*) FROM pp.applicant_primary_info WHERE nmms_year = $1;` },
        { label: 'Shortlisted', sql: `SELECT COUNT(*) FROM pp.applicant_shortlist_info a JOIN pp.applicant_primary_info api ON a.applicant_id = api.applicant_id WHERE api.nmms_year = $1;` },
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

  // 2. Distinct Jurisdictions
 async getJurisdictions(nmmsYear) {
    try {
      const sql = `
        SELECT DISTINCT j.juris_name, j.juris_code
        FROM pp.jurisdiction j
        -- Only join with students who are actually shortlisted for THIS year
        JOIN pp.applicant_primary_info a ON j.juris_code = a.nmms_block
        JOIN pp.applicant_shortlist_info asi ON a.applicant_id = asi.applicant_id
        WHERE a.nmms_year = $1;
      `;
      const result = await pool.query(sql, [nmmsYear]);
      return result.rows;
    } catch (err) {
      console.error('Error fetching jurisdictions:', err);
      throw err;
    }
  },

  // 3. Counts for specific block
  async getJurisdictionCounts(blockCode, nmmsYear) {
    try {
      const queries = {
        totalShortlisted: `SELECT COUNT(*) FROM pp.applicant_primary_info a JOIN pp.applicant_shortlist_info s ON a.applicant_id = s.applicant_id WHERE a.nmms_year = $1 AND a.nmms_block = $2;`,
        pendingEvaluation: `SELECT COUNT(*) FROM pp.applicant_primary_info a WHERE a.applicant_id NOT IN (SELECT applicant_id FROM pp.applicant_secondary_info) AND a.applicant_id IN (SELECT applicant_id FROM pp.applicant_shortlist_info) AND a.nmms_year = $1 AND a.nmms_block = $2;`,
        totalInterviewRequired: `SELECT COUNT(*) FROM pp.exam_results er JOIN pp.applicant_primary_info api ON er.applicant_id = api.applicant_id WHERE er.interview_required_yn = 'Y' AND api.nmms_year = $1 AND api.nmms_block = $2;`,
        completedInterview: `SELECT COUNT(DISTINCT si.applicant_id) FROM pp.student_interview si JOIN pp.applicant_primary_info api ON si.applicant_id = api.applicant_id WHERE api.nmms_block = $2 AND api.nmms_year = $1 AND si.status ='Completed';`,
        totalHomeVerificationRequired: `SELECT COUNT(*) FROM pp.student_interview si JOIN pp.applicant_primary_info api ON si.applicant_id = api.applicant_id WHERE si.home_verification_req_yn = 'Y' AND api.nmms_year = $1 AND api.nmms_block = $2;`,
        completedHomeVerification: `SELECT COUNT(*) FROM pp.home_verification hv JOIN pp.applicant_primary_info api ON hv.applicant_id = api.applicant_id WHERE api.nmms_year = $1 AND api.nmms_block = $2 AND hv.status IS NOT NULL;`
      };

      const results = {};
      for (const [key, sql] of Object.entries(queries)) {
        const result = await pool.query(sql, [nmmsYear, blockCode]);
        results[key] = parseInt(result.rows[0].count, 10);
      }
      return results;
    } catch (err) {
      throw err;
    }
  },

  // 4. Overall Progress
  async getOverallProgress(nmmsYear) {
    try {
      const q1 = `SELECT COUNT(*) FROM pp.applicant_shortlist_info a JOIN pp.applicant_primary_info api ON a.applicant_id = api.applicant_id WHERE api.nmms_year = $1;`;
      const q2 = `SELECT COUNT(*) FROM pp.applicant_secondary_info asi JOIN pp.applicant_primary_info api ON asi.applicant_id = api.applicant_id WHERE api.nmms_year = $1;`;
      
      const res1 = await pool.query(q1, [nmmsYear]);
      const res2 = await pool.query(q2, [nmmsYear]);
      
      const totalReq = parseInt(res1.rows[0].count, 10);
      const totalDone = parseInt(res2.rows[0].count, 10);

      let overallProgress = totalReq > 0 ? Math.round((totalDone / totalReq) * 100) : 0;
      return { overallProgress };
    } catch (err) {
      throw err;
    }
  }
};

module.exports = DashboardModel;