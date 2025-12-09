const GenerateShortlistModel = require("../models/generateShortlistModel");
const pool = require("../config/db"); 

const generateShortlistController = {
  
  getStates: async (req, res) => {
    try {
      const states = await GenerateShortlistModel.getAllStates();
      res.json(states);
    } catch (error) {
      console.error("getStates - Error:", error);
      res.status(500).json({ message: "Error fetching states", error: error.message, details: error.stack });
    }
  },

  getDivisions: async (req, res) => {
    // Expects the stateName from the URL parameters (e.g., /api/divisions/Bihar)
    const { stateName } = req.params; 
    try {
      const divisions = await GenerateShortlistModel.getDivisionsByState(stateName);
      res.json(divisions);
    } catch (error) {
      console.error("getDivisions - Error:", error);
      res.status(500).json({ message: "Error fetching divisions", error: error.message, details: error.stack });
    }
  },

  getDistricts: async (req, res) => {
    // Expects the divisionName from the URL parameters (e.g., /api/districts/PatnaDivision)
    const { divisionName } = req.params; 
    try {
      // Calling the new model function: getDistrictsByDivision
      const districts = await GenerateShortlistModel.getDistrictsByDivision(divisionName);
      res.json(districts);
    } catch (error) {
      console.error("getDistricts - Error:", error);
      res.status(500).json({ message: "Error fetching districts", error: error.message, details: error.stack });
    }
  },

  getBlocks: async (req, res) => {
    // Expects all three names from the URL parameters 
    // (e.g., /api/blocks/Bihar/PatnaDivision/PatnaDistrict)
    const { stateName, divisionName, districtName } = req.params; 
    try {
      // Passing all three parameters to the updated model function
      const blocks = await GenerateShortlistModel.getBlocksByDistrict(stateName, divisionName, districtName);
      res.json(blocks);
    } catch (error) {
      console.error("getBlocks - Error:", error);
      res.status(500).json({ message: "Error fetching blocks", error: error.message, details: error.stack });
    }
  },

  getCriteria: async (req, res) => {
    try {
      const criteria = await GenerateShortlistModel.getCriteria();
      res.json(criteria);
    } catch (error) {
      console.error("getCriteria - Error:", error);
      res.status(500).json({ message: "Error fetching criteria", error: error.message, details: error.stack });
    }
  },

 
startShortlisting: async (req, res) => {
    // 1. Destructure and trim inputs immediately for safety
    const { 
        criteriaId, 
        name, 
        description, 
        year, 
        locations 
    } = req.body;
    
    // Ensure locations exists before destructuring
    const state = locations?.state?.trim();
    const district = locations?.district?.trim();
    const blocks = locations?.blocks; // blocks will be an array
    
    // Trim other required string inputs
    const trimmedName = name ? name.trim() : null;
    const trimmedDescription = description ? description.trim() : null;

    try {
        // 2. Validation Check (using trimmed values)
        if (!state || !district || !criteriaId || !trimmedName || !trimmedDescription || !year || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
            return res.status(400).json({ 
                error: "State, district, criteria, name, description, year, and at least one block are required." 
            });
        }

        // 3. Call the Model function
        const result = await GenerateShortlistModel.createShortlistBatch(
            trimmedName,
            trimmedDescription,
            criteriaId,
            blocks, // Model handles trimming blocks internally
            state,
            district,
            year
        );

        const shortlistBatchId = result.shortlistBatchId;

        // 4. Fetch additional counts for response
        
        // **CORRECTED QUERY: Count of all eligible applicants within the selected BLOCKS and YEAR**
        // This calculates the base population for the shortlisting scope.
        const totalApplicantsQuery = `
          SELECT COUNT(api.applicant_id) AS count 
          FROM pp.applicant_primary_info api
          WHERE api.nmms_year = $2
            AND api.nmms_block IN (
              SELECT j.juris_code
              FROM pp.jurisdiction j
              WHERE LOWER(TRIM(j.juris_name)) = ANY($1) AND LOWER(j.juris_type) = 'block'
            );
        `.trim();
        
        const blockNamesForQuery = blocks.map(b => b.toLowerCase().trim());
        const totalApplicantsResult = await pool.query(totalApplicantsQuery, [blockNamesForQuery, year]);
        const totalApplicantsCount = totalApplicantsResult.rows[0].count;
        // **END CORRECTION**

        // Count of students shortlisted under this *specific batch*
        const shortlistedStudentsQuery = `
          SELECT COUNT(applicant_id) as count
          FROM pp.applicant_shortlist_info
          WHERE shortlist_batch_id = $1 AND shortlisted_yn = 'Y';
        `.trim();
        const shortlistedStudentsResult = await pool.query(shortlistedStudentsQuery, [shortlistBatchId]);
        const shortlistedStudentsCount = shortlistedStudentsResult.rows[0].count;

        // Count of shortlisted students in the selected blocks across ALL batches (using the existing model function)
        const shortlistedCountForBlocksAndYear = await GenerateShortlistModel.getShortlistedCountForBlocksAndYear(blocks, year);

        // 5. Successful Response
        res.status(200).json({
            // FIX APPLIED: Using the correct variable for the total shortlisted count in the message string.
            message: "Shortlisting process completed successfully. (Total Shortlisted: " + result.shortlistedCount + ")",
            
            shortlistBatchId: shortlistBatchId,
            shortlistedCountInBatch: result.shortlistedCount, // Matches the count returned by createShortlistBatch
            
            // **VARIABLES INCLUDED IN RESPONSE**
            totalApplicantsCount: totalApplicantsCount, // The total population in the selected blocks/year
            
            shortlistedStudentsCountInBatch: shortlistedStudentsCount,
            totalShortlistedInBlocks: shortlistedCountForBlocksAndYear 
        });

    } catch (error) {
        // 6. Centralized Error Handling
        if (error.message.startsWith("Shortlists already exist")) {
            console.warn("startShortlisting - Conflict Error:", error.message);
            return res.status(409).json({ error: error.message });
        }
        if (error.message.startsWith("Invalid criteriaId")) {
            return res.status(404).json({ error: error.message });
        }

        console.error("startShortlisting - General Error:", error);
        res.status(500).json({ 
            message: "Internal server error during shortlisting process.", 
            error: error.message 
        });
    }
},

  getTotalApplicantsByYear: async (req, res) => {
    const { year } = req.params;
    try {
      const result = await pool.query(
        'SELECT COUNT(applicant_id) as count FROM pp.applicant_primary_info WHERE nmms_year = $1',
        [year]
      );
      res.json({ count: result.rows[0].count });
    } catch (error) {
      console.error("getTotalApplicantsByYear - Error:", error);
      res.status(500).json({ error: "Failed to fetch total applicants by year" });
    }
  },

  getShortlistedStudentsByBatch: async (req, res) => {
    const { batchId } = req.params;
    try {
      const result = await pool.query(
        `SELECT COUNT(asi.applicant_id) as count
         FROM pp.applicant_shortlist_info asi
         WHERE asi.shortlist_info_id IN (
           SELECT asi.shortlist_info_id
           FROM pp.applicant_shortlist_info asi
           JOIN pp.applicant_primary_info api ON asi.applicant_id = api.applicant_id
           JOIN pp.shortlist_batch_jurisdiction sbj ON api.nmms_block = sbj.juris_code
           WHERE sbj.shortlist_batch_id = $1
         )
         AND shortlisted_yn = 'Y'`,
        [batchId]
      );
      res.json({ count: result.rows[0].count });
    } catch (error) {
      console.error("getShortlistedStudentsByBatch - Error:", error);
      res.status(500).json({ error: "Failed to fetch shortlisted students by batch" });
    }
  }
};

module.exports = generateShortlistController;