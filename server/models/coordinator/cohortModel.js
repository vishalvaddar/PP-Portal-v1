// models/coordinator/cohortModel.js
const pool = require("../../config/db");

async function getCohortsByUser(user_id) {
  const query = `
    SELECT DISTINCT c.cohort_number, c.cohort_name
    FROM pp.cohort c
    JOIN pp.batch b ON c.cohort_number = b.cohort_number
    JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id
    WHERE bcb.user_id = $1
    ORDER BY c.cohort_number;
  `;

  const { rows } = await pool.query(query, [user_id]);
  return rows;
}

module.exports = { getCohortsByUser };
