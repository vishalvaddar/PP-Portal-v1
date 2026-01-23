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

  async getDivisionsByState(stateName) {
    try {
      const result = await pool.query(
        `
        SELECT juris_code, juris_name
        FROM pp.jurisdiction AS division
        WHERE division.parent_juris IN (
          SELECT state.juris_code
          FROM pp.jurisdiction AS state
          WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1))
        )
        AND LOWER(division.juris_type) = 'division';
        `,
        [stateName]
      );
      return result.rows;
    } catch (error) {
      console.error("GenerateShortlistModel.getDivisionsByState - Error:", error);
      throw error;
    }
  },

  async getDistrictsByDivision(divisionName) {
    try {
      const result = await pool.query(
        `
        SELECT juris_code, juris_name
        FROM pp.jurisdiction AS district
        WHERE district.parent_juris IN (
          SELECT division.juris_code
          FROM pp.jurisdiction AS division
          WHERE LOWER(TRIM(division.juris_name)) = LOWER(TRIM($1))
        )
        AND LOWER(district.juris_type) = 'education district';
        `,
        [divisionName]
      );
      return result.rows;
    } catch (error) {
      console.error("GenerateShortlistModel.getDistrictsByDivision - Error:", error);
      throw error;
    }
  },

  
  async getBlocksByDistrict(stateName, divisionName, districtName) { 
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
            -- Subquery to find the specific District's juris_code
            SELECT district.juris_code
            FROM pp.jurisdiction AS district
            WHERE LOWER(TRIM(district.juris_name)) = LOWER(TRIM($3)) -- Match District Name
              AND LOWER(district.juris_type) = 'education district'
              -- Ensure the District belongs to the specified Division
              AND district.parent_juris IN ( 
                SELECT division.juris_code
                FROM pp.jurisdiction AS division
                WHERE LOWER(TRIM(division.juris_name)) = LOWER(TRIM($2)) -- Match Division Name
                  AND LOWER(division.juris_type) = 'division'
                  -- Ensure the Division belongs to the specified State (Optional but safer)
                  AND division.parent_juris IN (
                    SELECT state.juris_code
                    FROM pp.jurisdiction AS state
                    WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1)) -- Match State Name
                      AND LOWER(state.juris_type) = 'state'
                  )
              )
          );
        `,
        [stateName, divisionName, districtName]
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
    let shortlistBatchId = null;

    try {
      await pool.query("BEGIN");

      // 1. Check for existing non-frozen shortlists
      const blockNamesToSearch = selectedBlocks.map((b) => b.toLowerCase().trim());
      const checkExistingQuery = `
        SELECT sb.shortlist_batch_name, block.juris_name
        FROM pp.shortlist_batch_jurisdiction AS sbj
        JOIN pp.jurisdiction AS block ON sbj.juris_code = block.juris_code
        JOIN pp.shortlist_batch AS sb ON sbj.shortlist_batch_id = sb.shortlist_batch_id
        WHERE LOWER(TRIM(block.juris_name)) = ANY($1) AND sb.frozen_yn = 'N';
      `;
      const existing = await pool.query(checkExistingQuery, [blockNamesToSearch]);
      if (existing.rows.length > 0) {
        throw new Error("Shortlists already exist for these blocks. Please delete them first.");
      }

      // 2. Insert Batch
      const insertBatch = await pool.query(
        `INSERT INTO pp.shortlist_batch (shortlist_batch_name, description, criteria_id)
         VALUES ($1, $2, $3) RETURNING shortlist_batch_id;`,
        [shortlistName, description, criteriaId]
      );
      shortlistBatchId = insertBatch.rows[0].shortlist_batch_id;

      // 3. Link Jurisdictions
      await pool.query(
        `INSERT INTO pp.shortlist_batch_jurisdiction (shortlist_batch_id, juris_code)
         SELECT $1, juris_code FROM pp.jurisdiction
         WHERE LOWER(TRIM(juris_name)) = ANY($2) AND LOWER(juris_type) = 'block';`,
        [shortlistBatchId, blockNamesToSearch]
      );

      // 4. Get Criteria Logic
      const criteriaRes = await pool.query(`SELECT criteria FROM pp.shortlist_criteria WHERE criteria_id = $1`, [criteriaId]);
      const procCriteria = criteriaRes.rows[0].criteria.toLowerCase().replace(/\s+/g, ' ').trim();

      // 5. Query with Tie-Breaker (Ensures 4%, 6%, 8% are different)
      const commonSQL = `
        WITH ApplicantRanked AS (
          SELECT applicant_id, app_state, district, nmms_block AS block,
          (gmat_score * 0.7 + sat_score * 0.3) AS weighted_score,
          PERCENT_RANK() OVER (
            ORDER BY (gmat_score * 0.7 + sat_score * 0.3) DESC, applicant_id ASC
          ) AS percentile_rank
          FROM pp.applicant_primary_info WHERE nmms_year = $4
        )
        SELECT applicant_id FROM ApplicantRanked ar
        JOIN pp.jurisdiction sj ON ar.app_state = sj.juris_code
        JOIN pp.jurisdiction dj ON ar.district = dj.juris_code
        JOIN pp.jurisdiction bj ON ar.block = bj.juris_code
        WHERE LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
          AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
          AND percentile_rank <= `;

      let query = "";
      if (procCriteria.includes("top 4%")) query = commonSQL + "0.04;";
      else if (procCriteria.includes("top 6%")) query = commonSQL + "0.06;";
      else if (procCriteria.includes("top 8%")) query = commonSQL + "0.08;";

      if (query) {
        let applicantIds = [];
        for (const block of blockNamesToSearch) {
          const res = await pool.query(query, [state, district, block, year]);
          res.rows.forEach(r => applicantIds.push(r.applicant_id));
        }

        shortlistedCount = applicantIds.length;
        if (shortlistedCount > 0) {
          let vals = [], params = [], counter = 1;
          for (const id of applicantIds) {
            vals.push(`($${counter++}, 'Y', $${counter++})`);
            params.push(id, shortlistBatchId);
          }
          await pool.query(`INSERT INTO pp.applicant_shortlist_info (applicant_id, shortlisted_yn, shortlist_batch_id) VALUES ${vals.join(', ')}`, params);
        }
      } else {
        throw new Error(`Criteria "${procCriteria}" logic not implemented.`);
      }

      await pool.query("COMMIT");
      return { shortlistBatchId, shortlistedCount };
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  },


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