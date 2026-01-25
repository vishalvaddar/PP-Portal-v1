const { searchInstitutesModel } = require("../../models/coordinator/instituteModel");

/**
 * GET /api/coordinator/institutes/search
 * Handles the async search for the institute dropdown
 */
const searchInstitutes = async (req, res) => {
    try {
        const { q } = req.query;

        // 1. Validation: Don't query the DB for empty or very short strings
        // This prevents performance hits from 2 Lakh records
        if (!q || q.trim().length < 3) {
            return res.status(200).json([]);
        }

        const searchTerm = q.trim();

        // 2. Call the Model to perform the indexed search
        const institutes = await searchInstitutesModel(searchTerm);

        // 3. Return results
        // Even if empty, return 200 with an empty array so UI doesn't break
        res.status(200).json(institutes);

    } catch (error) {
        console.error("Error in searchInstitutes controller:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to search institutes. Please try again." 
        });
    }
};

/**
 * You can add other institute-related methods here (e.g., getById)
 */
module.exports = {
    searchInstitutes
};