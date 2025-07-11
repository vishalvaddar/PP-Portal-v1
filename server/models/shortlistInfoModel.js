
const pool = require("../config/db");

const shortlistInfoModel = {
  async getAllShortlistNames() {
    try {
      const { rows } = await pool.query(`
        SELECT shortlist_batch_name
        FROM pp.shortlist_batch
        WHERE EXTRACT(YEAR FROM created_on) = EXTRACT(YEAR FROM CURRENT_DATE); -- Corrected line
      `);
      return rows.map(row => row.shortlist_batch_name);
    } catch (error) {
      console.error("Error fetching all shortlist names in model:", error);
      throw error;
    }
  },

  async getNonFrozenShortlistNames() {
    try {
      const { rows } = await pool.query(`
        SELECT shortlist_batch_name, shortlist_batch_id
        FROM pp.shortlist_batch
        WHERE frozen_yn = 'N' and EXTRACT(YEAR FROM created_on) = EXTRACT(YEAR FROM CURRENT_DATE); -- Corrected line
      `);
      return rows.map(row => ({
        name: row.shortlist_batch_name,
        id: row.shortlist_batch_id,
      }));
    } catch (error) {
      console.error("Error fetching non-frozen shortlist names in model:", error);
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

      // Use the current year for NMMS data queries. Consider passing 'year' as a parameter
      // if shortlists can span multiple NMMS years and you need historical data.
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

      // IMPORTANT: Added `AND asi.shortlisted_yn = 'Y'` for accuracy if applicant_shortlist_info can contain non-shortlisted entries
      const shortlistedRes = await pool.query(
        `SELECT COUNT(*) AS shortlisted_count
          FROM pp.applicant_shortlist_info asi
          WHERE asi.shortlisted_yn = 'Y'
            AND asi.applicant_id IN (
              SELECT api.applicant_id
              FROM pp.applicant_primary_info api
              WHERE api.nmms_year = $1
                AND api.nmms_block IN (
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
      console.error(`Error fetching detailed shortlist info for ${shortlistName} in model:`, error);
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
      console.error("Error fetching total applicant count in model:", error);
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
      console.error("Error fetching total shortlisted count in model:", error);
      throw error;
    }
  },

  async freezeShortlist(shortlistBatchId) {
    try {
      const { rowCount } = await pool.query(
        `UPDATE pp.shortlist_batch
          SET frozen_yn = 'Y'
          WHERE shortlist_batch_id = $1 AND EXTRACT(YEAR FROM created_on) = EXTRACT(YEAR FROM CURRENT_DATE); -- Corrected line
`,
        [shortlistBatchId]
      );
      return rowCount > 0;
    } catch (error) {
      console.error(`Error freezing shortlist ID ${shortlistBatchId} in model:`, error);
      throw error;
    }
  },

  async deleteShortlist(shortlistBatchId) {
    try {
      // Assuming 'shortlist_batch_created_year' from shortlist_batch table matches 'nmms_year' in applicant_primary_info for consistent deletion
      // You might need to fetch the year from shortlist_batch first if that's not guaranteed.
      // For now, retaining the current year assumption for deletion logic to match existing pattern.
      const year = new Date().getFullYear();

      // Delete from applicant_shortlist_info first (due to foreign key dependencies)
      // This deletes entries for applicants who were part of this batch's blocks
      await pool.query(
        `DELETE FROM pp.applicant_shortlist_info
          WHERE applicant_id IN (
            SELECT api.applicant_id
            FROM pp.applicant_primary_info api
            JOIN pp.shortlist_batch_jurisdiction sbj ON api.nmms_block = sbj.juris_code
            WHERE api.nmms_year = $1
              AND sbj.shortlist_batch_id = $2
          );`,
        [year, shortlistBatchId]
      );
      // console.log(`Deleted applicant_shortlist_info for batch ${shortlistBatchId}`); // Optional: for debugging

      // Then delete from shortlist_batch_jurisdiction
      await pool.query(
        `DELETE FROM pp.shortlist_batch_jurisdiction
          WHERE shortlist_batch_id = $1;`,
        [shortlistBatchId]
      );
      // console.log(`Deleted shortlist_batch_jurisdiction for batch ${shortlistBatchId}`); // Optional: for debugging

      // Finally delete from shortlist_batch
      const { rowCount } = await pool.query(
        `DELETE FROM pp.shortlist_batch
          WHERE shortlist_batch_id = $1;`,
        [shortlistBatchId]
      );
      // console.log(`Deleted shortlist_batch for batch ${shortlistBatchId}, rows affected: ${rowCount}`); // Optional: for debugging

      return rowCount > 0;
    } catch (error) {
      console.error(`Error deleting shortlist ID ${shortlistBatchId} in model:`, error);
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
              SELECT applicant_id FROM pp.applicant_shortlist_info WHERE shortlisted_yn = 'Y'
            )
          ORDER BY api.student_name ASC;
        `,
        [year, shortlistBatchId]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching shortlist display data for batch ${shortlistBatchId} in model:`, error);
      throw error;
    }
  },

  async getShortlistedApplicantsForDownload(shortlistBatchId) {
    try {
      const year = new Date().getFullYear();
      const { rows } = await pool.query(
        `SELECT
          api.nmms_reg_number AS "NMMS Registration No",
          api.student_name AS "Student Name",
          api.contact_no1 AS "Contact No 1",
          api.contact_no2 AS "Contact No 2",
          cur_inst.institute_name AS "Current School Name",
          prev_inst.institute_name AS "Previous School Name"
        FROM pp.applicant_primary_info api
        LEFT JOIN pp.institute cur_inst
          ON api.current_institute_dise_code = cur_inst.dise_code
        LEFT JOIN pp.institute prev_inst
          ON api.previous_institute_dise_code = prev_inst.dise_code
        WHERE api.nmms_year = $1
          AND api.nmms_block IN (
            SELECT juris_code
            FROM pp.shortlist_batch_jurisdiction
            WHERE shortlist_batch_id = $2
          )
          AND api.applicant_id IN (
            SELECT applicant_id
            FROM pp.applicant_shortlist_info
            WHERE shortlisted_yn = 'Y'
          )
        ORDER BY "Student Name" ASC;
        `,
        [year, shortlistBatchId]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching shortlist download data for batch ${shortlistBatchId} in model:`, error);
      throw error;
    }
  }
};

module.exports = shortlistInfoModel;
