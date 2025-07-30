const pool = require("../config/db");

// 1. Get Coordinators
exports.getCoordinators = async (req, res) => {
  try {
    const roleRes = await pool.query(
      `SELECT role_id FROM pp.role WHERE role_name = 'BATCH COORDINATOR'`
    );

    if (roleRes.rows.length === 0)
      return res.status(404).json({ error: "Coordinator role not found" });

    const roleId = roleRes.rows[0].role_id;

    const result = await pool.query(
      `SELECT u.user_id AS id, u.user_name AS name
       FROM pp.user u
       JOIN pp.user_role ur ON u.user_id = ur.user_id
       WHERE ur.role_id = $1`,
      [roleId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching coordinators:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. Create Batch
exports.createBatch = async (req, res) => {
  try {
    const { batch_name, cohort_number, batch_status = "active", coordinator_id = null } = req.body;

    if (!batch_name || cohort_number == null)
      return res.status(400).json({ error: "batch_name and cohort_number are required" });

    const existing = await pool.query(
      `SELECT 1 FROM pp.batch WHERE batch_name = $1 AND cohort_number = $2`,
      [batch_name.trim(), cohort_number]
    );

    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Batch with this name already exists for the selected cohort." });

    const result = await pool.query(
      `INSERT INTO pp.batch (batch_name, cohort_number, batch_status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [batch_name.trim(), cohort_number, batch_status.toLowerCase()]
    );

    const batchId = result.rows[0].batch_id;

    if (coordinator_id) {
      await pool.query(
        `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [coordinator_id, batchId]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 3. Get All Batches
exports.getAllBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.batch_id AS id, 
        b.batch_name, 
        b.batch_status,
        b.cohort_number, 
        c.cohort_name, 
        u.user_name AS coordinator_name,
        u.user_id AS coordinator_id
      FROM pp.batch b
      LEFT JOIN pp.cohort c ON b.cohort_number = c.cohort_number
      LEFT JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id
      LEFT JOIN pp.user u ON bcb.user_id = u.user_id
      ORDER BY b.batch_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 4. Update Batch
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_name, cohort_number, coordinator_id, batch_status } = req.body;

    if (!batch_name || cohort_number == null || !batch_status)
      return res.status(400).json({ error: "Missing required fields" });

    const duplicate = await pool.query(
      `SELECT 1 FROM pp.batch
       WHERE batch_name = $1 AND cohort_number = $2 AND batch_id != $3`,
      [batch_name.trim(), cohort_number, id]
    );

    if (duplicate.rows.length > 0)
      return res.status(409).json({ error: "Batch with this name already exists for the selected cohort." });

    const result = await pool.query(
      `UPDATE pp.batch
       SET batch_name = $1, cohort_number = $2, batch_status = $3
       WHERE batch_id = $4
       RETURNING *`,
      [batch_name.trim(), cohort_number, batch_status.toLowerCase(), id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Batch not found" });

    await pool.query(`DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`, [id]);
    if (coordinator_id) {
      await pool.query(
        `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
         VALUES ($1, $2)`,
        [coordinator_id, id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 5. Delete Batch
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM pp.batch WHERE batch_id = $1 RETURNING *`, [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Batch not found" });

    res.json({ message: "Batch deleted successfully", deleted: result.rows[0] });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 6. Assign Coordinator
exports.assignCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinator_id } = req.body;

    if (!coordinator_id)
      return res.status(400).json({ error: "coordinator_id is required" });

    await pool.query(`DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`, [id]);
    await pool.query(
      `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
       VALUES ($1, $2)`,
      [coordinator_id, id]
    );

    res.json({ message: "Coordinator assigned successfully." });
  } catch (err) {
    console.error("Error assigning coordinator:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 7. Get Batch Names
exports.getBatchNames = async (req, res) => {
  try {
    const result = await pool.query(`SELECT name FROM pp.batch_names ORDER BY name ASC`);
    res.json(result.rows.map((row) => ({ label: row.name, value: row.name })));
  } catch (err) {
    console.error("Error fetching batch names:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 8. Add Batch Name
exports.addBatchName = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2)
    return res.status(400).json({ error: "Batch name must be at least 2 characters" });

  try {
    const result = await pool.query(
      `INSERT INTO pp.batch_names (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name.trim()]
    );

    if (result.rows.length === 0)
      return res.status(200).json({ message: "Name already exists" });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error saving batch name:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 9. Get All Cohorts
exports.getAllCohorts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cohort_number, cohort_name, start_date, description 
      FROM pp.cohort 
      ORDER BY cohort_number ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching cohorts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 10. Create Cohort
exports.createCohort = async (req, res) => {
  const { cohort_name, start_date, description } = req.body;

  if (!cohort_name || !start_date)
    return res.status(400).json({ error: "cohort_name and start_date are required." });

  try {
    const result = await pool.query(
      `INSERT INTO pp.cohort (cohort_name, start_date, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cohort_name.trim(), start_date, description || null]
    );

    res.status(201).json({
      message: "Cohort created successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getStudentsInBatch = async (req, res) => {
  const { id } = req.params;

  try{
    const result = await pool.query(`
      SELECT sm.*
      FROM pp.batch b
      JOIN pp.student_master sm ON sm.batch_id = b.batch_id
      WHERE b.batch_id = $1
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students in batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};