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

  getDistricts: async (req, res) => {
    const { stateName } = req.params;
    try {
      const districts = await GenerateShortlistModel.getDistrictsByState(stateName);
      res.json(districts);
    } catch (error) {
      console.error("getDistricts - Error:", error);
      res.status(500).json({ message: "Error fetching districts", error: error.message, details: error.stack });
    }
  },

  getBlocks: async (req, res) => {
    const { districtName } = req.params;
    try {
      const blocks = await GenerateShortlistModel.getBlocksByDistrict(districtName);
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
    try {
      const { criteriaId, locations, name, description, year } = req.body;
      const { state, district, blocks } = locations;

      if (!state || !district || !criteriaId || !name || !description || !year || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
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
          year
        );

        const totalApplicantsResult = await pool.query(
          'SELECT COUNT(applicant_id) as count FROM pp.applicant_primary_info WHERE nmms_year = $1',
          [year]
        );
        const totalApplicantsCount = totalApplicantsResult.rows[0].count;

        const shortlistedStudentsResult = await pool.query(
          `SELECT COUNT(asi.applicant_id) FROM pp.applicant_shortlist_info asi
           WHERE asi.applicant_id IN (
             SELECT api.applicant_id FROM pp.applicant_primary_info api
             WHERE api.nmms_year = $1 AND api.nmms_block IN (
               SELECT j.juris_code FROM pp.jurisdiction j
               WHERE LOWER(TRIM(j.juris_name)) = ANY($2)
             )
           )`,
          [year, blocks.map(block => block.toLowerCase().trim())]
        );
        const shortlistedStudentsCount = shortlistedStudentsResult.rows[0].count;

        const shortlistedCountForBlocksAndYear = await GenerateShortlistModel.getShortlistedCountForBlocksAndYear(blocks, year);

        res.status(200).json({
          message: "Shortlisting process started successfully.",
          shortlistBatchId: result.shortlistBatchId,
          shortlistedCount: result.shortlistedCount,
          totalApplicantsCount,
          shortlistedStudentsCount,
          shortlistedCountForBlocksAndYear
        });
      } catch (modelError) {
        if (modelError.message.startsWith("Shortlists already exist")) {
          return res.status(409).json({ error: modelError.message });
        }
        console.error("startShortlisting - Model Error:", modelError);
        return res.status(500).json({ message: "Error during shortlist creation", error: modelError.message, details: modelError.stack });
      }
    } catch (error) {
      console.error("startShortlisting - General Error:", error);
      res.status(500).json({ message: "Error starting shortlisting", error: error.message, details: error.stack });
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
