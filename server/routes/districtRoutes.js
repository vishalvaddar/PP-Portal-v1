const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/districts/all", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT JURIS_NAME AS district, JURIS_CODE AS district_code
            FROM PP.JURISDICTION 
            WHERE JURIS_TYPE = 'EDUCATION DISTRICT' 
            ORDER BY JURIS_NAME
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching districts:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;