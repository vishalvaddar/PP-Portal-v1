const pool = require("../../config/db");

// Fetch batches for a given cohort AND assigned to the coordinator
async function getBatchesByCohort(cohort_number, coordinator_id) {
  const query = `
    SELECT 
      b.batch_id, 
      b.batch_name, 
      b.cohort_number, 
      c.cohort_name
    FROM pp.batch b
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id
    WHERE b.cohort_number = $1
      AND bcb.user_id = $2
    ORDER BY b.batch_id DESC;
  `;
  const { rows } = await pool.query(query, [cohort_number, coordinator_id]);
  return rows;
}

// Create batch
async function createBatchController(batch_name, cohort_number) {
  const query = `
    INSERT INTO pp.batch (batch_name, cohort_number)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [batch_name, cohort_number]);
  return rows[0];
}

module.exports = { getBatchesByCohort, createBatchController };
