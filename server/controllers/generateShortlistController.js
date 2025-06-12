// Controller (generateShortlistController.js)
const GenerateShortlistModel = require("../models/generateShortlistModel");
const pool = require("../config/db"); // Import your database connection

const generateShortlistController = {
  getStates: async (req, res) => {
    console.log("Controller: getStates - Entered");
    try {
      const states = await GenerateShortlistModel.getAllStates();
      console.log("Controller: getStates - Success", states);
      res.json(states);
    } catch (error) {
      console.error("Controller: getStates - Error:", error);
      res.status(500).json({ message: "Error fetching states", error: error.message, details: error.stack });
    }
  },

  getDistricts: async (req, res) => {
    const { stateName } = req.params;
    console.log("Controller: getDistricts - Entered", { stateName });
    try {
      const districts = await GenerateShortlistModel.getDistrictsByState(stateName);
      console.log("Controller: getDistricts - Success", districts);
      res.json(districts);
    } catch (error) {
      console.error("Controller: getDistricts - Error:", error);
      res.status(500).json({ message: "Error fetching districts", error: error.message, details: error.stack });
    }
  },

  getBlocks: async (req, res) => {
    const { districtName } = req.params;
    console.log("Controller: getBlocks - Entered", { districtName });
    try {
      const blocks = await GenerateShortlistModel.getBlocksByDistrict(districtName);
      console.log("Controller: getBlocks - Success", blocks);
      res.json(blocks);
    } catch (error) {
      console.error("Controller: getBlocks - Error:", error);
      res.status(500).json({ message: "Error fetching blocks", error: error.message, details: error.stack });
    }
  },

  getCriteria: async (req, res) => {
    console.log("Controller: getCriteria - Entered");
    try {
      const criteria = await GenerateShortlistModel.getCriteria();
      console.log("Controller: getCriteria - Success", criteria);
      res.json(criteria);
    } catch (error) {
      console.error("Controller: getCriteria - Error:", error);
      res.status(500).json({ message: "Error fetching criteria", error: error.message, details: error.stack });
    }
  },

  startShortlisting: async (req, res) => {
    console.log("Controller: startShortlisting - Entered", req.body);
    try {
      const { criteriaId, locations, name, description, year } = req.body;
      const { state, district, blocks } = locations;

      if (!state || !district || !criteriaId || !name || !description || !year || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
        console.warn("Controller: startShortlisting - Missing required fields");
        return res.status(400).json({ error: "State, district, criteria, name, description, year, and at least one block are required." });
      }

      try {
        const result = await GenerateShortlistModel.createShortlistBatch(
          name,
          description,
          criteriaId,
          blocks,
          state,
          district,
          year // Still pass the year for applicant filtering
        );

        console.log("Controller: startShortlisting - Success", result);

        // Fetch counts after successful shortlisting
        const totalApplicantsResult = await pool.query('SELECT COUNT(applicant_id) as count FROM pp.applicant_primary_info WHERE nmms_year = $1', [year]);
        const totalApplicantsCount = totalApplicantsResult.rows[0].count;



        // Construct the query to get shortlisted count for the selected blocks and year
        const shortlistedStudentsResult = await pool.query(
          `SELECT COUNT(si.applicant_id) FROM pp.shortlist_info si
           WHERE si.applicant_id IN (
             SELECT api.applicant_id FROM pp.applicant_primary_info api
             WHERE api.nmms_year = $1 AND api.nmms_block IN (
               SELECT j.juris_code FROM pp.jurisdiction j
               WHERE LOWER(TRIM(j.juris_name)) = ANY($2)
             )
           )`,
          [year, blocks.map(block => block.toLowerCase().trim())] // Pass year and blocks
        );
        const shortlistedStudentsCount = shortlistedStudentsResult.rows[0].count;
        console.log("shortlistedStudentsCount",shortlistedStudentsCount)
        // Get shortlisted count for the selected blocks and year
        const shortlistedCountForBlocksAndYear = await GenerateShortlistModel.getShortlistedCountForBlocksAndYear(blocks, year);
        console.log("Controller: startShortlisting - Shortlisted count for blocks and year:", shortlistedCountForBlocksAndYear);

        res.status(200).json({
          message: "Shortlisting process started successfully.",
          shortlistBatchId: result.shortlistBatchId,
          shortlistedCount: result.shortlistedCount,
          totalApplicantsCount: totalApplicantsCount,
          shortlistedStudentsCount: shortlistedStudentsCount,
          shortlistedCountForBlocksAndYear: shortlistedCountForBlocksAndYear, // Include the new count
        });
      } catch (modelError) {
        if (modelError.message.startsWith("Shortlists already exist")) {
          return res.status(409).json({ error: modelError.message });
        }
        console.error("Controller: startShortlisting - Model Error:", modelError);
        return res.status(500).json({ message: "Error during shortlist creation", error: modelError.message, details: modelError.stack });
      }
    } catch (error) {
      console.error("Controller: startShortlisting - General Error:", error);
      res.status(500).json({ message: "Error starting shortlisting", error: error.message, details: error.stack });
    }
  },

  getTotalApplicantsByYear: async (req, res) => {
    const { year } = req.params;
    try {
      const result = await pool.query('SELECT COUNT(applicant_id) as count FROM pp.applicant_primary_info WHERE nmms_year = $1', [year]);
      res.json({ count: result.rows[0].count });
    } catch (error) {
      console.error("Error fetching total applicants by year:", error);
      res.status(500).json({ error: "Failed to fetch total applicants by year" });
    }
  },

  getShortlistedStudentsByBatch: async (req, res) => {
    const { batchId } = req.params;
    try {
      const result = await pool.query('SELECT COUNT(applicant_id) as count FROM pp.shortlist_info WHERE shortlisted_yn = \'Y\' AND shortlist_batch_id = $1', [batchId]);
      res.json({ count: result.rows[0].count });
    } catch (error) {
      console.error("Error fetching shortlisted students by batch:", error);
      res.status(500).json({ error: "Failed to fetch shortlisted students by batch" });
    }
  }
};

module.exports = generateShortlistController;
