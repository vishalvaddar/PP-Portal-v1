// models/shortlistInfoModel.js
const pool = require("../config/db");

const ShortlistInfoModel = {
  async getAllShortlistNames() {
    try {
      const result = await pool.query(`
        SELECT shortlist_batch_name
        FROM pp.shortlist_batch;
      `);
      return result.rows.map(row => row.shortlist_batch_name);
    } catch (error) {
      console.error("Error fetching all shortlist names:", error);
      throw error;
    }
  },

  async getNonFrozenShortlistNames() {
    try {
      const result = await pool.query(`
        SELECT shortlist_batch_name, shortlist_batch_id
        FROM pp.shortlist_batch
        WHERE frozen_yn = 'N';
      `);
      return result.rows.map(row => ({
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
      const batchIdResult = await pool.query(
        `
        SELECT shortlist_batch_id, description, criteria_id, shortlist_batch_name, frozen_yn
        FROM pp.shortlist_batch
        WHERE shortlist_batch_name = $1;
        `,
        [shortlistName]
      );

      if (batchIdResult.rows.length === 0) {
        return null; // Shortlist not found
      }

      const batchInfo = batchIdResult.rows[0];
      const shortlistBatchId = batchInfo.shortlist_batch_id;
      const criteriaId = batchInfo.criteria_id;
      const currentYear = new Date().getFullYear(); // Which is 2025 based on the context

      const criteriaResult = await pool.query(
        `
        SELECT criteria
        FROM pp.shortlisting_criteria
        WHERE criteria_id = $1;
        `,
        [criteriaId]
      );
      const criteria = criteriaResult.rows[0]?.criteria;

      const blocksResult = await pool.query(
        `
        SELECT j.juris_name
        FROM pp.jurisdiction j
        JOIN pp.shortlist_batch_jurisdiction sbj ON j.juris_code = sbj.juris_code
        WHERE sbj.shortlist_batch_id = $1;
        `,
        [shortlistBatchId]
      );
      const blocks = blocksResult.rows.map(row => row.juris_name);

      const totalStudentsResult = await pool.query(
        `
        SELECT COUNT(api.applicant_id) AS total_students
        FROM pp.applicant_primary_info api
        WHERE api.nmms_year = $1
          AND api.nmms_block IN (
            SELECT juris_code
            FROM pp.shortlist_batch_jurisdiction
            WHERE shortlist_batch_id = $2
          );
        `,
        [currentYear, shortlistBatchId]
      );
      const totalStudents = totalStudentsResult.rows[0]?.total_students || 0;

      const shortlistedStudentsResult = await pool.query(
        `
        SELECT COUNT(si.applicant_id)
        FROM pp.shortlist_info si
        WHERE si.applicant_id IN (
          SELECT api.applicant_id
          FROM pp.applicant_primary_info api
          WHERE api.nmms_year = $1
            AND api.nmms_block IN (
              SELECT sbj.juris_code
              FROM pp.shortlist_batch_jurisdiction sbj
              WHERE sbj.shortlist_batch_id = $2
            )
        );
        `,
        [currentYear, shortlistBatchId]
      );
      const shortlistedStudents = shortlistedStudentsResult.rows[0]?.["count"] || 0;

      return {
        name: batchInfo.shortlist_batch_name,
        description: batchInfo.description,
        criteria: criteria,
        blocks: blocks,
        totalStudents: totalStudents,
        shortlistedCount: shortlistedStudents,
        id: shortlistBatchId,
        isFrozen: batchInfo.frozen_yn === 'Y',
      };
    } catch (error) {
      console.error("Error fetching detailed shortlist info:", error);
      throw error;
    }
  },

  async getTotalApplicantCount() {
    try {
      const currentYear = new Date().getFullYear(); // Which is 2025 based on the context
      const result = await pool.query(
        `
        SELECT COUNT(applicant_id) AS total_applicants
        FROM pp.applicant_primary_info
        WHERE nmms_year = $1;
        `,
        [currentYear]
      );
      return result.rows[0]?.total_applicants || 0;
    } catch (error) {
      console.error("Error fetching total applicant count:", error);
      throw error;
    }
  },

  async getTotalShortlistedCount() {
    try {
      const currentYear = new Date().getFullYear(); // Which is 2025 based on the context
      const result = await pool.query(
        `
        SELECT COUNT(api.applicant_id) AS total_shortlisted
        FROM pp.applicant_primary_info api
        WHERE api.nmms_year = $1
          AND applicant_id IN (
            SELECT applicant_id
            FROM pp.shortlist_info
          );
        `,
        [currentYear]
      );
      return result.rows[0]?.total_shortlisted || 0;
    } catch (error) {
      console.error("Error fetching total shortlisted count:", error);
      throw error;
    }
  },

  async freezeShortlist(shortlistBatchId) {
    try {
      const result = await pool.query(
        `
        UPDATE pp.shortlist_batch
        SET frozen_yn = 'Y'
        WHERE shortlist_batch_id = $1;
        `,
        [shortlistBatchId]
      );
      return result.rowCount > 0; // Returns true if the update was successful
    } catch (error) {
      console.error(`Error freezing shortlist with ID ${shortlistBatchId}:`, error);
      throw error;
    }
  },

  async deleteShortlist(shortlistBatchId) {
    try {
      const currentYear = new Date().getFullYear(); // Assuming the year is still 2025

      await pool.query(
        `
        DELETE FROM pp.shortlist_info
        WHERE applicant_id IN (
          SELECT applicant_id
          FROM pp.applicant_primary_info
          WHERE nmms_year = $1
            AND nmms_block IN (
              SELECT juris_code
              FROM pp.shortlist_batch_jurisdiction
              WHERE shortlist_batch_id = $2
            )
        );
        `,
        [currentYear, shortlistBatchId]
      );

      await pool.query(
        `
        DELETE FROM pp.shortlist_batch_jurisdiction
        WHERE shortlist_batch_id = $1;
        `,
        [shortlistBatchId]
      );

      const result = await pool.query(
        `
        DELETE FROM pp.shortlist_batch
        WHERE shortlist_batch_id = $1;
        `,
        [shortlistBatchId]
      );

      return result.rowCount > 0; // Returns true if the deletion was successful
    } catch (error) {
      console.error(`Error deleting shortlist with ID ${shortlistBatchId}:`, error);
      throw error;
    }
  },

  async getShortlistedApplicantsForShow(shortlistBatchId) {
    try {
      const currentYear = new Date().getFullYear();
      const result = await pool.query(
        `
        SELECT
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
            SELECT sbj.juris_code
            FROM pp.shortlist_batch_jurisdiction sbj
            WHERE sbj.shortlist_batch_id = $2
          )
          AND api.applicant_id IN (
            SELECT si.applicant_id
            FROM pp.shortlist_info si
          )
        ORDER BY weighted_score ASC;
        `,
        [currentYear, shortlistBatchId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching shortlisted applicants for show for batch ID ${shortlistBatchId}:`, error);
      throw error;
    }
  },

  async getShortlistedApplicantsForDownload(shortlistBatchId) {
    try {
      const currentYear = new Date().getFullYear();
      const result = await pool.query(
        `
        SELECT
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
            SELECT sbj.juris_code
            FROM pp.shortlist_batch_jurisdiction sbj
            WHERE sbj.shortlist_batch_id = $2
          )
          AND api.applicant_id IN (
            SELECT si.applicant_id
            FROM pp.shortlist_info si
          )
        ORDER BY weighted_score ASC;
        `,
        [currentYear, shortlistBatchId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching all applicant data for download for batch ID ${shortlistBatchId}:`, error);
      throw error;
    }
  },
};

module.exports = ShortlistInfoModel;