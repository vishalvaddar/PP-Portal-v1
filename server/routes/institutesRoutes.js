const express = require("express");
const pool = require("../config/db");
const router = express.Router();

//Fetch all institutes without block name
router.get("/institutes/all", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT institute_name 
            FROM pp.institute 
            ORDER BY institute_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching institutes:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
    
});

module.exports = router;