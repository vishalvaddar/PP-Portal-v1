const pool = require("../config/db");

const GenerateShortlistModel = {
  async getAllStates() {
    try {
      const result = await pool.query(`
        SELECT juris_code, juris_name
        FROM pp.jurisdiction
        WHERE LOWER(juris_type) = 'state';
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getDistrictsByState(stateName) {
    try {
      const result = await pool.query(
        `
        SELECT juris_code, juris_name
        FROM pp.jurisdiction AS district
        WHERE district.parent_juris IN (
          SELECT state.juris_code
          FROM pp.jurisdiction AS state
          WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1))
        )
        AND LOWER(district.juris_type) = 'education district';
        `,
        [stateName]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getBlocksByDistrict(districtName) {
    try {
      const result = await pool.query(
        `
        SELECT
          j.juris_code,
          j.juris_name,
          CASE
            WHEN j.juris_code IN (
              SELECT sbj.juris_code
              FROM pp.shortlist_batch_jurisdiction AS sbj
              JOIN pp.shortlist_batch AS sb ON sbj.shortlist_batch_id = sb.shortlist_batch_id
              WHERE sb.frozen_yn = 'Y'
            )
            THEN TRUE ELSE FALSE
          END AS is_frozen_block
        FROM pp.jurisdiction AS j
        WHERE LOWER(j.juris_type) = 'block'
          AND j.parent_juris IN (
            SELECT juris_code
            FROM pp.jurisdiction
            WHERE LOWER(TRIM(juris_name)) = LOWER(TRIM($1))
              AND juris_type = 'EDUCATION DISTRICT'
          );
        `,
        [districtName]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getCriteria() {
    try {
      const result = await pool.query(`
        SELECT criteria_id, criteria FROM pp.shortlist_criteria;
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async createShortlistBatch(shortlistName, description, criteriaId, selectedBlocks, state, district, year) {
    let shortlistedCount = 0;
    let shortlistBatchId = null;

    try {
      await pool.query("BEGIN");

      // Check for existing shortlists
      if (selectedBlocks && selectedBlocks.length > 0) {
        const checkExistingQuery = `
          SELECT sb.shortlist_batch_name, block.juris_name
          FROM pp.shortlist_batch_jurisdiction AS sbj
          JOIN pp.jurisdiction AS block ON sbj.juris_code = block.juris_code
          JOIN pp.shortlist_batch AS sb ON sbj.shortlist_batch_id = sb.shortlist_batch_id
          WHERE LOWER(TRIM(block.juris_name)) = ANY($1)
            AND sb.frozen_yn = 'N';
        `;
        const existingShortlists = await pool.query(checkExistingQuery, [
          selectedBlocks.map((b) => b.toLowerCase().trim()),
        ]);

        if (existingShortlists.rows.length > 0) {
          let errorMessage = "Shortlists already exist for the following blocks:\n";
          existingShortlists.rows.forEach(row => {
            errorMessage += `- ${row.juris_name}: ${row.shortlist_batch_name}\n`;
          });
          errorMessage += "Please delete them first if not frozen.";
          throw new Error(errorMessage);
        }
      }

      // Insert into shortlist_batch
      const insertBatchResult = await pool.query(
        `
          INSERT INTO pp.shortlist_batch (shortlist_batch_name, description, criteria_id)
          VALUES ($1, $2, $3)
          RETURNING shortlist_batch_id;
        `,
        [shortlistName, description, criteriaId]
      );

      shortlistBatchId = insertBatchResult.rows[0].shortlist_batch_id;

      if (selectedBlocks && selectedBlocks.length > 0) {
        const insertJurisdictionQuery = `
          INSERT INTO pp.shortlist_batch_jurisdiction (shortlist_batch_id, juris_code)
          SELECT $1, juris_code
          FROM pp.jurisdiction
          WHERE LOWER(TRIM(juris_name)) = ANY($2);
        `;

        const blockNamesLowercased = selectedBlocks.map((block) => block.toLowerCase().trim());
        await pool.query(insertJurisdictionQuery, [shortlistBatchId, blockNamesLowercased]);

        // Get criteria name
        const criteriaResult = await pool.query(
          `SELECT criteria FROM pp.shortlist_criteria WHERE criteria_id = $1`,
          [criteriaId]
        );
        if (criteriaResult.rows.length === 0) {
          throw new Error(`Invalid criteriaId: ${criteriaId}`);
        }

        const criteriaName = criteriaResult.rows[0].criteria;
        let selectApplicantsQuery = "";

        if (criteriaName.toLowerCase().includes("top 4%")) {
          selectApplicantsQuery = `
            WITH ApplicantRanked AS (
              SELECT
                applicant_id,
                app_state,
                district,
                nmms_block AS block,
                (gmat_score * 0.7 + sat_score * 0.3) AS weighted_score,
                PERCENT_RANK() OVER (ORDER BY (gmat_score * 0.7 + sat_score * 0.3) DESC) AS percentile_rank
              FROM pp.applicant_primary_info
              WHERE nmms_year = $4
            )
            SELECT applicant_id FROM ApplicantRanked ar
            JOIN pp.jurisdiction sj ON ar.app_state = sj.juris_code
            JOIN pp.jurisdiction dj ON ar.district = dj.juris_code
            JOIN pp.jurisdiction bj ON ar.block = bj.juris_code
            WHERE LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
              AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
              AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
              AND percentile_rank <= 0.04;
          `;
        } else if (criteriaName.toLowerCase().includes("top 8%")) {
          selectApplicantsQuery = `
            WITH ApplicantRanked AS (
              SELECT
                applicant_id,
                app_state,
                district,
                nmms_block AS block,
                (gmat_score * 0.7 + sat_score * 0.3) AS weighted_score,
                PERCENT_RANK() OVER (ORDER BY (gmat_score * 0.7 + sat_score * 0.3) DESC) AS percentile_rank
              FROM pp.applicant_primary_info
              WHERE nmms_year = $4
            )
            SELECT applicant_id FROM ApplicantRanked ar
            JOIN pp.jurisdiction sj ON ar.app_state = sj.juris_code
            JOIN pp.jurisdiction dj ON ar.district = dj.juris_code
            JOIN pp.jurisdiction bj ON ar.block = bj.juris_code
            WHERE LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
              AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
              AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
              AND percentile_rank <= 0.08;
          `;
        }

        const insertShortlistInfoQuery = `
          INSERT INTO pp.applicant_shortlist_info (applicant_id, shortlisted_yn)
          VALUES ($1, 'Y')
        `;

        if (selectApplicantsQuery) {
          for (const block of blockNamesLowercased) {
            const applicantResult = await pool.query(selectApplicantsQuery, [state, district, block, year]);
            shortlistedCount += applicantResult.rows.length;

            for (const applicant of applicantResult.rows) {
              await pool.query(insertShortlistInfoQuery, [applicant.applicant_id]);
            }
          }
        }
      }

      await pool.query("COMMIT");
      return { shortlistBatchId, shortlistedCount };
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  },

  async getShortlistedCountForBlocksAndYear(blockNames, year) {
    try {
      const result = await pool.query(
        `
        SELECT COUNT(asi.applicant_id)
        FROM pp.applicant_shortlist_info asi
        WHERE asi.applicant_id IN (
          SELECT api.applicant_id
          FROM pp.applicant_primary_info api
          WHERE api.nmms_year = $2 AND api.nmms_block IN (
            SELECT j.juris_code
            FROM pp.jurisdiction j
            WHERE LOWER(TRIM(j.juris_name)) = ANY($1)
          )
        );
        `,
        [blockNames.map(name => name.toLowerCase().trim()), year]
      );
      return result.rows[0].count;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = GenerateShortlistModel;
