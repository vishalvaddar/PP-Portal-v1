const pool = require("../config/db");

const GenerateShortlistModel = {
  getAllStates: async () => {
    console.log("Model: getAllStates - Entered");
    try {
      const result = await pool.query(`
                        SELECT juris_code, juris_name
                        FROM pp.jurisdiction
                        WHERE LOWER(juris_type) = 'state';
                    `);
      console.log("Model: getAllStates - Success", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Model: getAllStates - Error:", error);
      throw error;
    }
  },

  getDistrictsByState: async (stateName) => {
    console.log("Model: getDistrictsByState - Entered", { stateName });
    try {
      const result = await pool.query(
        `
                        SELECT juris_code, juris_name
                        FROM pp.jurisdiction AS district
                        WHERE district.parent_juris IN (
                            SELECT state.juris_code
                            FROM pp.jurisdiction AS state
                            WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1))
                        );
                        `,
        [stateName]
      );
      console.log("Model: getDistrictsByState - Success", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Model: getDistrictsByState - Error:", error);
      throw error;
    }
  },

  getBlocksByDistrict: async (districtName) => {
    console.log("Model: getBlocksByDistrict - Entered", { districtName });
    try {
      const result = await pool.query(
        `
                        SELECT juris_code, juris_name
                        FROM pp.jurisdiction AS block
                        WHERE block.parent_juris IN (
                            SELECT district.juris_code
                            FROM pp.jurisdiction AS district
                            WHERE LOWER(TRIM(district.juris_name)) = LOWER(TRIM($1))
                        );
                        `,
        [districtName]
      );
      console.log("Model: getBlocksByDistrict - Fetched blocks from DB:", result.rows, "for district:", districtName);
      return result.rows;
    } catch (error) {
      console.error("Model: getBlocksByDistrict - Error:", error);
      throw error;
    }
  },

  getCriteria: async () => {
    console.log("Model: getCriteria - Entered");
    try {
      const result = await pool.query(`
                        SELECT * FROM pp.shortlisting_criteria;
                    `);
      console.log("Model: getCriteria - Success", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Model: getCriteria - Error:", error);
      throw error;
    }
  },

  createShortlistBatch: async (
    shortlistName,
    description,
    criteriaId,
    selectedBlocks,
    state,
    district
  ) => {
    console.log("Model: createShortlistBatch - Entered", { shortlistName, description, criteriaId, selectedBlocks, state, district });
    let shortlistedCount = 0;
    let shortlistedApplicantIds = []; // Declare it here
    try {
      await pool.query("BEGIN"); // Start transaction
      console.log("Model: createShortlistBatch - Transaction BEGIN");

      // 1. Insert into shortlist_batch and get the ID
      const insertBatchResult = await pool.query(
        `
                        INSERT INTO pp.shortlist_batch (shortlist_batch_name, description, criteria_id)
                        VALUES ($1, $2, $3)
                        RETURNING shortlist_batch_id;
                    `,
        [shortlistName, description, criteriaId]
      );

      const shortlistBatchId = insertBatchResult.rows[0].shortlist_batch_id;
      console.log("Model: createShortlistBatch - Inserted into shortlist_batch, ID:", shortlistBatchId);

      // 2. Insert into shortlist_batch_jurisdiction for each selected block
      if (selectedBlocks && selectedBlocks.length > 0) {
        const insertJurisdictionQuery = `
                        INSERT INTO pp.shortlist_batch_jurisdiction (shortlist_batch_id, juris_code)
                        SELECT $1, juris_code
                        FROM pp.jurisdiction
                        WHERE LOWER(TRIM(juris_name)) = ANY($2);
                    `;

        const blockNamesLowercased = selectedBlocks.map((block) => block.toLowerCase().trim());
        console.log("Model: createShortlistBatch - Inserting into shortlist_batch_jurisdiction", { shortlistBatchId, blockNamesLowercased });
        await pool.query(insertJurisdictionQuery, [
          shortlistBatchId,
          blockNamesLowercased,
        ]);
        console.log("Model: createShortlistBatch - Inserted into shortlist_batch_jurisdiction");

        // 3. Select and insert shortlisted applicants
        let selectApplicantsQuery = "";
        let criteriaName = ""; // Added to store criteria name
        if (criteriaId === 1) {
          criteriaName = "70% GMAT + 30% SAT Score (Top 4%)";
          selectApplicantsQuery = `
                        WITH ApplicantRanked AS (
                            SELECT
                                applicant_id,
                                nmms_year,
                                nmms_reg_number,
                                student_name,
                                father_name,
                                mother_name,
                                app_state,
                                district,
                                nmms_block AS block,
                                gmat_score,
                                sat_score,
                                (gmat_score * 0.7 + sat_score * 0.3) AS weighted_score,
                                PERCENT_RANK() OVER (ORDER BY (gmat_score * 0.7 + sat_score * 0.3) DESC) AS percentile_rank,
                                gender,
                                aadhaar,
                                dob,
                                home_address,
                                family_income_total,
                                contact_no1,
                                contact_no2,
                                current_institute,
                                previous_institute
                            FROM pp.applicant_primary_info
                        )
                        SELECT
                            applicant_id
                        FROM ApplicantRanked
                        WHERE percentile_rank <= 0.04
                            AND LOWER(TRIM(app_state)) = LOWER(TRIM($1))
                            AND LOWER(TRIM(district)) = LOWER(TRIM($2))
                            AND LOWER(TRIM(block)) = LOWER(TRIM($3));
                    `;
        } else if (criteriaId === 2) {
          criteriaName = "70% GMAT + 30% SAT Score (Top 8%)";
          selectApplicantsQuery = `
                        WITH ApplicantRanked AS (
                            SELECT
                                applicant_id,
                                nmms_year,
                                nmms_reg_number,
                                student_name,
                                father_name,
                                mother_name,
                                app_state,
                                district,
                                nmms_block AS block,
                                gmat_score,
                                sat_score,
                                (gmat_score * 0.7 + sat_score * 0.3) AS weighted_score,
                                PERCENT_RANK() OVER (ORDER BY (gmat_score * 0.7 + sat_score * 0.3) DESC) AS percentile_rank,
                                gender,
                                aadhaar,
                                dob,
                                home_address,
                                family_income_total,
                                contact_no1,
                                contact_no2,
                                current_institute,
                                previous_institute
                            FROM pp.applicant_primary_info
                        )
                        SELECT
                            applicant_id
                        FROM ApplicantRanked
                        WHERE percentile_rank <= 0.08
                            AND LOWER(TRIM(app_state)) = LOWER(TRIM($1))
                            AND LOWER(TRIM(district)) = LOWER(TRIM($2))
                            AND LOWER(TRIM(block)) = LOWER(TRIM($3));
                    `;
        } else {
          // Fetch criteria name from the database
          const criteriaResult = await pool.query(
            `SELECT criteria FROM pp.shortlisting_criteria WHERE criteria_id = $1`,
            [criteriaId]
          );
          if (criteriaResult.rows.length > 0) {
            criteriaName = criteriaResult.rows[0].criteria;
          } else {
            console.error(`Model: createShortlistBatch - Unsupported criteriaId: ${criteriaId}`);
            throw new Error(`Unsupported criteriaId: ${criteriaId}`);
          }

          // Default query (you might need to adjust this based on your actual criteria)
          selectApplicantsQuery = `
                        WITH ApplicantRanked AS (
                            SELECT
                                applicant_id,
                                nmms_year,
                                nmms_reg_number,
                                student_name,
                                father_name,
                                mother_name,
                                app_state,
                                district,
                                nmms_block AS block,
                                gmat_score,
                                sat_score,
                                (gmat_score * 0.7 + sat_score * 0.3) AS weighted_score,
                                PERCENT_RANK() OVER (ORDER BY (gmat_score * 0.7 + sat_score * 0.3) DESC) AS percentile_rank,
                                gender,
                                aadhaar,
                                dob,
                                home_address,
                                family_income_total,
                                contact_no1,
                                contact_no2,
                                current_institute,
                                previous_institute
                            FROM pp.applicant_primary_info
                        )
                        SELECT
                            applicant_id
                        FROM ApplicantRanked
                        WHERE percentile_rank <= 0.04
                            AND LOWER(TRIM(app_state)) = LOWER(TRIM($1))
                            AND LOWER(TRIM(district)) = LOWER(TRIM($2))
                            AND LOWER(TRIM(block)) = LOWER(TRIM($3));
                    `; // changed percentile_rank
        }

        const insertShortlistInfoQuery = `
                        INSERT INTO pp.shortlist_info (applicant_id, shortlisted_yn, shortlist_batch_id)
                        VALUES ($1, 'Y', $2);
                    `;
        shortlistedCount = 0;
        for (const block of blockNamesLowercased) {
          const applicantResult = await pool.query(selectApplicantsQuery, [state, district, block]);
          console.log(`Model: createShortlistBatch - Selected ${applicantResult.rows.length} applicants for block ${block} using criteria: ${criteriaName}`);
          shortlistedCount += applicantResult.rows.length;

          for (const applicant of applicantResult.rows) {
            await pool.query(insertShortlistInfoQuery, [applicant.applicant_id, shortlistBatchId]);
            console.log(`Model: createShortlistBatch - Inserted applicant ${applicant.applicant_id} into shortlist_info for block ${block}`);
            shortlistedApplicantIds.push(applicant.applicant_id);
          }
        }
      } else {
        console.log("Model: createShortlistBatch - No blocks selected, skipping shortlist_batch_jurisdiction and applicant selection.");
      }

      await pool.query("COMMIT");
      console.log("Model: createShortlistBatch - Transaction COMMIT");
      return { shortlistBatchId, shortlistedCount, shortlistedApplicantIds };
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Model: createShortlistBatch - Error:", error);
      throw error;
    }
  },
};

module.exports = GenerateShortlistModel;
