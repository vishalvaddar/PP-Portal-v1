const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Fetch all states
router.get("/states", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT JURIS_CODE AS id, JURIS_NAME AS name
            FROM PP.JURISDICTION 
            WHERE JURIS_TYPE = 'STATE' AND PARENT_JURIS IS NULL
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching states:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch districts based on state ID
router.get("/districts-by-state/:stateId", async (req, res) => {
    try {
        const { stateId } = req.params;
        const result = await pool.query(`
            SELECT JURIS_CODE AS id, JURIS_NAME AS name 
            FROM PP.JURISDICTION 
            WHERE JURIS_TYPE = 'EDUCATION DISTRICT' 
            AND PARENT_JURIS = $1
        `, [stateId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching districts:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch blocks based on district name
router.get("/blocks-by-district/:districtId", async (req, res) => {
    try {
        const { districtId } = req.params;
        const result = await pool.query(`
            SELECT JURIS_CODE AS id, JURIS_NAME AS name 
            FROM PP.JURISDICTION 
            WHERE JURIS_TYPE = 'BLOCK' 
            AND PARENT_JURIS = $1
        `, [districtId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching blocks:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch institutes based on block name
router.get("/institutes-by-block/:blockID", async (req, res) => {
    try {
        const { blockID } = req.params;
        const result = await pool.query(`
            SELECT institute_id, institute_name, dise_code 
            FROM PP.INSTITUTE
            WHERE juris_code = $1
        `, [blockID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No institutes found" });
        }

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching institutes:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
