const express = require("express");
const pool = require("../config/db"); // Import PostgreSQL connection
const router = express.Router();

// Search API
router.get("/search", async (req, res) => {
  try {
    const { 
      nmms_year, 
      nmms_reg_number, 
      student_name, 
      medium, 
      district, 
      current_institute_dise_code 
    } = req.query;

    let query = "SELECT * FROM pp.applicant_primary_info WHERE 1=1";
    let values = [];

    if (nmms_reg_number && !isNaN(nmms_reg_number)) {
      values.push(nmms_reg_number.trim());
      query += ` AND nmms_reg_number = $${values.length} LIMIT 1`; // Ensuring only one record
    } else {
      if (nmms_year && !isNaN(nmms_year)) {
        values.push(nmms_year.trim());
        query += ` AND nmms_year = $${values.length}`;
      }
      if (student_name) {
        values.push(`%${student_name.trim()}%`);
        query += ` AND LOWER(student_name) ILIKE LOWER($${values.length})`;
      }
      if (medium) {
        values.push(medium.trim());
        query += ` AND medium = $${values.length}`;
      }
      if (district) {
        values.push(district.trim());
        query += ` AND district = $${values.length}`;
      }
      if (current_institute_dise_code) {
        values.push(current_institute_dise_code.trim());
        query += ` AND current_institute_dise_code = $${values.length}`;
      }
    }

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No applications found matching the criteria." });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error searching applications:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
