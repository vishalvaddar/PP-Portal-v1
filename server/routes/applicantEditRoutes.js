const express = require("express");
const pool = require("../config/db"); // Ensure this points to your PostgreSQL connection
const router = express.Router();

// Fetch student details by NMMS Reg Number
router.get("/:nmms_reg_number", async (req, res) => {
  const { nmms_reg_number } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT * FROM applicants WHERE nmms_reg_number = $1",
      [nmms_reg_number]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update student details
router.put("/:nmms_reg_number", async (req, res) => {
  const { nmms_reg_number } = req.params;
  const updates = req.body;

  try {
    const updateQuery = `
      UPDATE applicants
      SET ${Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(", ")}
      WHERE nmms_reg_number = $${Object.keys(updates).length + 1}
      RETURNING *;
    `;

    const values = [...Object.values(updates), nmms_reg_number];
    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student updated successfully", student: result.rows[0] });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
