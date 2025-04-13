const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// POST /resolve-names
router.post("/juris-names", async (req, res) => {
    const { districtIds = [], blockIds = [], instituteIds = [] } = req.body;
  
    try {
      // Fetch district names
      const districtResult = await pool.query(
        `SELECT JURIS_CODE AS id, JURIS_NAME AS name FROM PP.JURISDICTION WHERE JURIS_TYPE = 'EDUCATION DISTRICT' AND JURIS_CODE = ANY($1)`,
        [districtIds]
      );
  
      // Fetch block names
      const blockResult = await pool.query(
        `SELECT JURIS_CODE AS id, JURIS_NAME AS name FROM PP.JURISDICTION WHERE JURIS_TYPE = 'BLOCK' AND JURIS_CODE = ANY($1)`,
        [blockIds]
      );
  
      // Fetch institute names
      const instituteResult = await pool.query(
        `SELECT DISE_CODE AS id, INSTITUTE_NAME AS name FROM PP.INSTITUTE WHERE DISE_CODE = ANY($1)`,
        [instituteIds]
      );
  
      const mapById = (rows) =>
        rows.reduce((acc, row) => {
          acc[row.id] = row.name;
          return acc;
        }, {});
  
      res.json({
        districts: mapById(districtResult.rows),
        blocks: mapById(blockResult.rows),
        institutes: mapById(instituteResult.rows),
      });
    } catch (error) {
      console.error("Error in juris-names:", error.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  module.exports = router;