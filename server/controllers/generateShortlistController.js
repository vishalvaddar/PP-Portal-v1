const GenerateShortlistModel = require("../models/generateShortlistModel");
const pool = require("../config/db"); 

const generateShortlistController = {
  
  getStates: async (req, res) => {
    try {
      const states = await GenerateShortlistModel.getAllStates();
      res.json(states);
    } catch (error) {
      console.error("getStates - Error:", error);
      res.status(500).json({ message: "Error fetching states", error: error.message });
    }
  },

  getDivisions: async (req, res) => {
    const { stateName } = req.params; 
    try {
      const divisions = await GenerateShortlistModel.getDivisionsByState(stateName);
      res.json(divisions);
    } catch (error) {
      console.error("getDivisions - Error:", error);
      res.status(500).json({ message: "Error fetching divisions", error: error.message });
    }
  },

  getDistricts: async (req, res) => {
    const { divisionName } = req.params; 
    try {
      const districts = await GenerateShortlistModel.getDistrictsByDivision(divisionName);
      res.json(districts);
    } catch (error) {
      console.error("getDistricts - Error:", error);
      res.status(500).json({ message: "Error fetching districts", error: error.message });
    }
  },

  getBlocks: async (req, res) => {
    const { stateName, divisionName, districtName } = req.params; 
    try {
      const blocks = await GenerateShortlistModel.getBlocksByDistrict(stateName, divisionName, districtName);
      res.json(blocks);
    } catch (error) {
      console.error("getBlocks - Error:", error);
      res.status(500).json({ message: "Error fetching blocks", error: error.message });
    }
  }, 

  getCriteria: async (req, res) => {
    try {
      const criteria = await GenerateShortlistModel.getCriteria();
      res.json(criteria);
    } catch (error) {
      console.error("getCriteria - Error:", error);
      res.status(500).json({ message: "Error fetching criteria", error: error.message });
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

        // 1. Run Shortlisting using the new Model logic
        const result = await GenerateShortlistModel.createShortlistBatch(
            name.trim(), 
            description?.trim(), 
            criteriaId, 
            blocks, 
            state, 
            district, 
            year // This is the 2025/2026 value passed from frontend
        );

        // 2. Fetch Totals for the Success Message
        const blockNamesLower = blocks.map(b => b.toLowerCase().trim());
        
        // Count total potential applicants in these blocks for this specific year
        const totalPopRes = await pool.query(
            `SELECT COUNT(api.applicant_id) as count FROM pp.applicant_primary_info api
             WHERE api.nmms_year = $2 AND api.nmms_block IN (
                SELECT j.juris_code FROM pp.jurisdiction j 
                WHERE LOWER(TRIM(j.juris_name)) = ANY($1) AND LOWER(j.juris_type) = 'block'
             )`, [blockNamesLower, year]
        );

        const totalShortlistedInBlocks = await GenerateShortlistModel.getShortlistedCountForBlocksAndYear(blocks, year);

        res.status(200).json({
           message: `Shortlist created successfully!\nShortlisted ${result.shortlistedCount} students for academic year starting ${year}.`,
           shortlistBatchId: result.shortlistBatchId,
           shortlistedCountInBatch: result.shortlistedCount,
           totalApplicantsCount: totalPopRes.rows[0].count,
           totalShortlistedInBlocks: totalShortlistedInBlocks
        });

    } catch (error) {
        console.error("Shortlisting Failed:", error.message);
        const status = error.message.includes("already exist") ? 409 : 500;
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
         WHERE asi.shortlist_batch_id = $1
         AND asi.shortlisted_yn = 'Y'`,
        [batchId]
      );
      res.json({ count: result.rows[0].count });
    } catch (error) {
      console.error("getShortlistedStudentsByBatch - Error:", error);
      res.status(500).json({ error: "Failed to fetch shortlisted students" });
    }
  }
};

module.exports = generateShortlistController;