// models/subjectModel.js
const pool = require('../../config/db');

// Fetch all subjects
const getAllSubjects = async () => {
  const result = await pool.query(
    "SELECT * FROM pp.subject ORDER BY subject_name"
  );
  return result.rows;
};

module.exports = { getAllSubjects };
