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
      console.error("GenerateShortlistModel.getAllStates - Error:", error);
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
      console.error("GenerateShortlistModel.getDistrictsByState - Error:", error);
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
      console.error("GenerateShortlistModel.getBlocksByDistrict - Error:", error);
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
      console.error("GenerateShortlistModel.getCriteria - Error:", error);
      throw error;
    }
  },


  async createShortlistBatch(shortlistName, description, criteriaId, selectedBlocks, state, district, year) {
    let shortlistedCount = 0;
    let shortlistBatchId = null; // This will still hold the batch ID, even if not inserted into applicant_shortlist_info directly

    try {
      await pool.query("BEGIN"); // Start transaction for atomicity

      // 1. Check for existing shortlists for the selected blocks that are not frozen.
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

      // 2. Insert the new shortlist batch record.
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
        // 3. Link the new shortlist batch to the selected blocks in shortlist_batch_jurisdiction.
        const insertJurisdictionQuery = `
          INSERT INTO pp.shortlist_batch_jurisdiction (shortlist_batch_id, juris_code)
          SELECT $1, juris_code
          FROM pp.jurisdiction
          WHERE LOWER(TRIM(juris_name)) = ANY($2) AND LOWER(juris_type) = 'block';
        `;

        const blockNamesLowercased = selectedBlocks.map((block) => block.toLowerCase().trim());
        await pool.query(insertJurisdictionQuery, [shortlistBatchId, blockNamesLowercased]);

        // 4. Retrieve the criteria name string from the database using criteriaId.
        const criteriaResult = await pool.query(
          `SELECT criteria FROM pp.shortlist_criteria WHERE criteria_id = $1`,
          [criteriaId]
        );
        if (criteriaResult.rows.length === 0) {
          throw new Error(`Invalid criteriaId: ${criteriaId}`);
        }

        const rawCriteriaName = criteriaResult.rows[0].criteria;
        // Normalize the criteria name for robust matching: lowercase, replace multiple/non-standard spaces with single space, then trim.
        const processedCriteriaName = rawCriteriaName
            .toLowerCase()
            .replace(/\s+/g, ' ') // Replace one or more whitespace characters (any type) with a single standard space
            .trim();             // Trim leading/trailing whitespace

       

        let selectApplicantsQuery = "";

        // 5. Conditionally build the SQL query based on the processed criteria name.
        if (processedCriteriaName.includes("top 4%")) {
            console.log("DEBUG: Entered 'Top 4%' criteria selection block.");
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
        } else if (processedCriteriaName.includes("top 8%")) { // Correctly 'else if'
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
        // Add more 'else if' conditions for other criteria here if you have them.

        // 6. Execute the selected query and insert/update shortlisted applicants.
        // Keeping this INSERT query exactly as you provided, without shortlist_batch_id or ON CONFLICT
        const insertShortlistInfoQuery = `
          INSERT INTO pp.applicant_shortlist_info (applicant_id, shortlisted_yn)
          VALUES ($1, 'Y');
        `;

        if (selectApplicantsQuery) { // Proceed only if a valid query was determined
          for (const block of blockNamesLowercased) {
            const applicantResult = await pool.query(selectApplicantsQuery, [state, district, block, year]);
            shortlistedCount += applicantResult.rows.length;

            for (const applicant of applicantResult.rows) {
              // Passing only applicant_id, as per your strict request for the INSERT statement
              await pool.query(insertShortlistInfoQuery, [applicant.applicant_id]);
            }
          }
        } else {
            // This error is crucial for debugging when no criteria matches
            throw new Error(`No shortlisting logic found for criteria: ${rawCriteriaName}. Please define a query for this criteria.`);
        }
      }

      await pool.query("COMMIT"); // Commit the transaction if all operations succeed
      return { shortlistBatchId, shortlistedCount };
    } catch (error) {
      await pool.query("ROLLBACK"); // Rollback the transaction on any error
      throw error; // Re-throw the error for the controller to handle
    }
  },

  /**
   * Gets the total count of shortlisted applicants within specified blocks for a given year.
   * This counts applicants who are marked 'Y' in applicant_shortlist_info AND
   * belong to the specified blocks and year in applicant_primary_info.
   * @param {string[]} blockNames - An array of block names.
   * @param {number} year - The academic year.
   * @returns {number} The count of shortlisted applicants.
   * @throws {Error} If there's a database error.
   */
  async getShortlistedCountForBlocksAndYear(blockNames, year) {
    try {
      const result = await pool.query(
        `
        SELECT COUNT(asi.applicant_id)
        FROM pp.applicant_shortlist_info asi
        WHERE asi.shortlisted_yn = 'Y' -- Only count explicitly shortlisted
          AND asi.applicant_id IN (
            SELECT api.applicant_id
            FROM pp.applicant_primary_info api
            WHERE api.nmms_year = $2
              AND api.nmms_block IN (
                SELECT j.juris_code
                FROM pp.jurisdiction j
                WHERE LOWER(TRIM(j.juris_name)) = ANY($1) AND LOWER(j.juris_type) = 'block'
              )
          );
        `,
        [blockNames.map(name => name.toLowerCase().trim()), year]
      );
      return result.rows[0].count;
    } catch (error) {
      console.error("GenerateShortlistModel.getShortlistedCountForBlocksAndYear - Error:", error);
      throw error;
    }
  }
};

module.exports = GenerateShortlistModel;