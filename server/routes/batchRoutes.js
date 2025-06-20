const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ─────────────────────────────────────────────
// Utility to compute cohort string
// ─────────────────────────────────────────────
const getCohort = (year) => `Cohort-${year - 2021}`;

// ────────────────────────────────────────────────────────────────
// GET all coordinators (with role_name = 'BATCH COORDINATOR')
// ────────────────────────────────────────────────────────────────
router.get("/coordinators", async (req, res) => {
  try {
    const roleResult = await pool.query(
      `SELECT role_id FROM pp.role WHERE role_name = 'BATCH COORDINATOR'`
    );
    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: "BATCH COORDINATOR role not found" });
    }

    const coordinatorRoleId = roleResult.rows[0].role_id;

    const result = await pool.query(
      `SELECT u.user_id AS id, u.user_name AS name
       FROM pp.user u
       JOIN pp.user_role ur ON u.user_id = ur.user_id
       WHERE ur.role_id = $1`,
      [coordinatorRoleId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching coordinators:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ────────────────────────────────────────────────────────────────
// CREATE new batch
// ────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { batch_no, batch_year, batch_status = "Active", coordinator_id = null } = req.body;

    if (!batch_no || !batch_year) {
      return res.status(400).json({ error: "batch_no and batch_year are required" });
    }

    const cohort = getCohort(batch_year);

    const result = await pool.query(
      `INSERT INTO pp.batches (batch_no, batch_year, cohort, batch_status, coordinator_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [batch_no, batch_year, cohort, batch_status, coordinator_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ────────────────────────────────────────────────────────────────
// READ all batches
// ────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.user_name AS coordinator_name
      FROM pp.batches b
      LEFT JOIN pp.user u ON b.coordinator_id = u.user_id
      ORDER BY b.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ────────────────────────────────────────────────────────────────
// UPDATE full batch info
// ────────────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_no, batch_year, batch_status, coordinator_id } = req.body;

    if (!batch_no || !batch_year || !batch_status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cohort = getCohort(batch_year);

    const result = await pool.query(
      `UPDATE pp.batches
       SET batch_no = $1,
           batch_year = $2,
           batch_status = $3,
           cohort = $4,
           coordinator_id = $5
       WHERE id = $6
       RETURNING *`,
      [batch_no, batch_year, batch_status, cohort, coordinator_id || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ────────────────────────────────────────────────────────────────
// DELETE batch by ID
// ────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM pp.batches WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({ message: "Batch deleted successfully", deleted: result.rows[0] });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ────────────────────────────────────────────────────────────────
// Assign/reassign coordinator only (if needed separately)
// ────────────────────────────────────────────────────────────────
router.put("/:id/assign-coordinator", async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinator_id } = req.body;

    if (!coordinator_id) {
      return res.status(400).json({ error: "coordinator_id is required" });
    }

    const result = await pool.query(
      `UPDATE pp.batches SET coordinator_id = $1 WHERE id = $2 RETURNING *`,
      [coordinator_id, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating coordinator:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
