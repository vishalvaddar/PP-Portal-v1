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

//get institutess from query
router.get("/institutes/search", async (req, res) => {
    const { query } = req.query;
  
    if (!query) return res.status(400).json({ error: "Missing query parameter" });
  
    try {
      const result = await pool.query(
        `SELECT dise_code, institute_name 
         FROM pp.institute 
         WHERE institute_name ILIKE $1 
         LIMIT 10`,
        [`%${query}%`]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error searching institutes:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
module.exports = router;