const pool = require("../config/db");

const shortlistInfoModel = {
  async getAllShortlistNames() {
    try {
      const { rows } = await pool.query(`
        SELECT shortlist_batch_name
        FROM pp.shortlist_batch;
      `);
      return rows.map(row => row.shortlist_batch_name);
    } catch (error) {
      console.error("Error fetching all shortlist names:", error);
      throw error;
    }
  },

  async getNonFrozenShortlistNames() {
    try {
      const { rows } = await pool.query(`
        SELECT shortlist_batch_name, shortlist_batch_id
        FROM pp.shortlist_batch
        WHERE frozen_yn = 'N';
      `);
      return rows.map(row => ({
        name: row.shortlist_batch_name,
        id: row.shortlist_batch_id,
      }));
    } catch (error) {
      console.error("Error fetching non-frozen shortlist names:", error);
      throw error;
    }
  },

  async getShortlistInfo(shortlistName) {
    try {
      const { rows } = await pool.query(
        `SELECT shortlist_batch_id, description, criteria_id, shortlist_batch_name, frozen_yn
         FROM pp.shortlist_batch
         WHERE shortlist_batch_name = $1;`,
        [shortlistName]
      );

      if (rows.length === 0) return null;

      const {
        shortlist_batch_id: id,
        description,
        criteria_id,
        shortlist_batch_name: name,
        frozen_yn
      } = rows[0];

      const year = new Date().getFullYear();

      const criteriaRes = await pool.query(
        `SELECT criteria FROM pp.shortlist_criteria WHERE criteria_id = $1;`,
        [criteria_id]
      );

      const blocksRes = await pool.query(
        `SELECT j.juris_name
         FROM pp.jurisdiction j
         JOIN pp.shortlist_batch_jurisdiction sbj ON j.juris_code = sbj.juris_code
         WHERE sbj.shortlist_batch_id = $1;`,
        [id]
      );

      const totalStudentsRes = await pool.query(
        `SELECT COUNT(*) AS total_students
         FROM pp.applicant_primary_info
         WHERE nmms_year = $1
         AND nmms_block IN (
           SELECT juris_code
           FROM pp.shortlist_batch_jurisdiction
           WHERE shortlist_batch_id = $2
         );`,
        [year, id]
      );

      const shortlistedRes = await pool.query(
        `SELECT COUNT(*) AS shortlisted_count
         FROM pp.applicant_shortlist_info
         WHERE applicant_id IN (
           SELECT applicant_id
           FROM pp.applicant_primary_info
           WHERE nmms_year = $1
             AND nmms_block IN (
               SELECT juris_code
               FROM pp.shortlist_batch_jurisdiction
               WHERE shortlist_batch_id = $2
             )
         );`,
        [year, id]
      );

      return {
        id,
        name,
        description,
        criteria: criteriaRes.rows[0]?.criteria || "N/A",
        blocks: blocksRes.rows.map(row => row.juris_name),
        totalStudents: parseInt(totalStudentsRes.rows[0]?.total_students || "0", 10),
        shortlistedCount: parseInt(shortlistedRes.rows[0]?.shortlisted_count || "0", 10),
        isFrozen: frozen_yn === 'Y'
      };
    } catch (error) {
      console.error(`Error fetching detailed shortlist info for ${shortlistName}:`, error);
      throw error;
    }
  },

  async getTotalApplicantCount() {
    try {
      const year = new Date().getFullYear();
      const { rows } = await pool.query(
        `SELECT COUNT(*) AS total_applicants
         FROM pp.applicant_primary_info
         WHERE nmms_year = $1;`,
        [year]
      );
      return parseInt(rows[0]?.total_applicants || "0", 10);
    } catch (error) {
      console.error("Error fetching total applicant count:", error);
      throw error;
    }
  },

  async getTotalShortlistedCount() {
    try {
      const year = new Date().getFullYear();
      const { rows } = await pool.query(
        `SELECT COUNT(*) AS total_shortlisted
         FROM pp.applicant_shortlist_info asi
         JOIN pp.applicant_primary_info api ON asi.applicant_id = api.applicant_id
         WHERE api.nmms_year = $1
           AND asi.shortlisted_yn = 'Y';`,
        [year]
      );
      return parseInt(rows[0]?.total_shortlisted || "0", 10);
    } catch (error) {
      console.error("Error fetching total shortlisted count:", error);
      throw error;
    }
  },


  async freezeShortlist(shortlistBatchId) {
    try {
      const { rowCount } = await pool.query(
        `UPDATE pp.shortlist_batch
         SET frozen_yn = 'Y'
         WHERE shortlist_batch_id = $1;`,
        [shortlistBatchId]
      );
      return rowCount > 0;
    } catch (error) {
      console.error(`Error freezing shortlist ID ${shortlistBatchId}:`, error);
      throw error;
    }
  },

  async deleteShortlist(shortlistBatchId) {
    try {
      const year = new Date().getFullYear();

      await pool.query(
        `DELETE FROM pp.applicant_shortlist_info
         WHERE applicant_id IN (
           SELECT applicant_id
           FROM pp.applicant_primary_info
           WHERE nmms_year = $1
             AND nmms_block IN (
               SELECT juris_code
               FROM pp.shortlist_batch_jurisdiction
               WHERE shortlist_batch_id = $2
             )
         );`,
        [year, shortlistBatchId]
      );

      await pool.query(
        `DELETE FROM pp.shortlist_batch_jurisdiction
         WHERE shortlist_batch_id = $1;`,
        [shortlistBatchId]
      );

      const { rowCount } = await pool.query(
        `DELETE FROM pp.shortlist_batch
         WHERE shortlist_batch_id = $1;`,
        [shortlistBatchId]
      );

      return rowCount > 0;
    } catch (error) {
      console.error(`Error deleting shortlist ID ${shortlistBatchId}:`, error);
      throw error;
    }
  },

  async getShortlistedApplicantsForShow(shortlistBatchId) {
    try {
      const year = new Date().getFullYear();
      const { rows } = await pool.query(
        `SELECT
          api.applicant_id,
          api.nmms_reg_number,
          api.nmms_block,
          api.student_name,
          api.gmat_score,
          api.sat_score,
          api.medium,
          (api.gmat_score * 0.70 + api.sat_score * 0.30) AS weighted_score
         FROM pp.applicant_primary_info api
         WHERE api.nmms_year = $1
           AND api.nmms_block IN (
             SELECT juris_code
             FROM pp.shortlist_batch_jurisdiction
             WHERE shortlist_batch_id = $2
           )
           AND api.applicant_id IN (
             SELECT applicant_id FROM pp.applicant_shortlist_info
           )
         ORDER BY weighted_score ASC;`,
        [year, shortlistBatchId]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching shortlist display data for batch ${shortlistBatchId}:`, error);
      throw error;
    }
  },

  async getShortlistedApplicantsForDownload(shortlistBatchId) {
    try {
      const year = new Date().getFullYear();
      const { rows } = await pool.query(
        `SELECT
          api.applicant_id,
          api.nmms_year,
          api.nmms_reg_number,
          api.student_name,
          api.mother_name,
          api.gmat_score,
          api.sat_score,
          api.gender,
          api.medium,
          api.aadhaar,
          api.dob,
          api.home_address,
          api.contact_no1,
          api.contact_no2,
          (api.gmat_score * 0.70 + api.sat_score * 0.30) AS weighted_score
         FROM pp.applicant_primary_info api
         WHERE api.nmms_year = $1
           AND api.nmms_block IN (
             SELECT juris_code
             FROM pp.shortlist_batch_jurisdiction
             WHERE shortlist_batch_id = $2
           )
           AND api.applicant_id IN (
             SELECT applicant_id FROM pp.applicant_shortlist_info
           )
         ORDER BY weighted_score ASC;`,
        [year, shortlistBatchId]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching shortlist download data for batch ${shortlistBatchId}:`, error);
      throw error;
    }
  }
};

module.exports = shortlistInfoModel;
