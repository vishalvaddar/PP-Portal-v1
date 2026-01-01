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
    const { criteriaId, name, description, year, locations } = req.body;
    const state = locations?.state?.trim();
    const district = locations?.district?.trim();
    const blocks = locations?.blocks;

    try {
        if (!state || !district || !criteriaId || !name || !year || !blocks?.length) {
            return res.status(400).json({ error: "Required fields missing." });
        }

        // 1. Run Shortlisting
        const result = await GenerateShortlistModel.createShortlistBatch(
            name.trim(), description?.trim(), criteriaId, blocks, state, district, year
        );

        // 2. Fix Population Count (Matched Model Logic)
        const blockNamesLower = blocks.map(b => b.toLowerCase().trim());
        const totalPopRes = await pool.query(
            `SELECT COUNT(api.applicant_id) FROM pp.applicant_primary_info api
             WHERE api.nmms_year = $2 AND api.nmms_block IN (
                SELECT j.juris_code FROM pp.jurisdiction j 
                WHERE LOWER(TRIM(j.juris_name)) = ANY($1) AND LOWER(j.juris_type) = 'block'
             )`, [blockNamesLower, year]
        );

        const totalShortlistedInBlocks = await GenerateShortlistModel.getShortlistedCountForBlocksAndYear(blocks, year);

        res.status(200).json({
            message: `Shortlist created successfully! ${result.shortlistedCount} students.`,
            shortlistBatchId: result.shortlistBatchId,
            shortlistedCountInBatch: result.shortlistedCount,
            totalApplicantsCount: totalPopRes.rows[0].count,
            totalShortlistedInBlocks: totalShortlistedInBlocks
        });

    } catch (error) {
        console.error("Shortlisting Failed:", error.message);
        const status = error.message.includes("exist") ? 409 : 500;
        res.status(status).json({ error: error.message });
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