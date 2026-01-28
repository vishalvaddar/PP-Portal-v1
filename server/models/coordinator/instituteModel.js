const pool = require("../../config/db"); // Adjust this path to your database configuration file

/**
 * Searches for institutes by DISE code or Name.
 * Optimized for large datasets (2 Lakh+ records) using LIMIT.
 * * @param {string} searchTerm - The string to search for (DISE or Name)
 * @returns {Promise<Array>} - Returns an array of matching institutes
 */
const searchInstitutesModel = async (searchTerm) => {
    try {
        // We use ILIKE for case-insensitive matching.
        // We limit to 15-20 results to ensure fast response times and UI stability.
        const query = `
            SELECT 
                dise_code, 
                institute_name,
                institute_board,
                management_type
            FROM pp.institute
            WHERE dise_code ILIKE $1 
               OR institute_name ILIKE $1
            ORDER BY institute_name ASC
            LIMIT 15;
        `;

        // The % wildcards allow matching anywhere in the string
        const values = [`%${searchTerm}%`];
        
        const { rows } = await pool.query(query, values);
        return rows;
    } catch (error) {
        console.error("Database Error in searchInstitutesModel:", error);
        throw error;
    }
};

/**
 * Fetches a single institute by DISE code.
 * Useful for displaying the current institute name in the UI.
 */
const getInstituteByDiseModel = async (diseCode) => {
    try {
        const query = `
            SELECT dise_code, institute_name 
            FROM pp.institute 
            WHERE dise_code = $1;
        `;
        const { rows } = await pool.query(query, [diseCode]);
        return rows[0];
    } catch (error) {
        console.error("Database Error in getInstituteByDiseModel:", error);
        throw error;
    }
};

module.exports = {
    searchInstitutesModel,
    getInstituteByDiseModel
};