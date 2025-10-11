const pool = require("../config/db");

// ==============================
// GET all configurations
// ==============================
exports.getAllConfigs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT system_config_id, academic_year, phase, is_active, created_at, updated_at
       FROM pp.system_config
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching configs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ==============================
// CREATE a new configuration
// ==============================
exports.createConfig = async (req, res) => {
  const { academic_year, phase, is_active } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO pp.system_config (academic_year, phase, is_active)
       VALUES ($1, $2, COALESCE($3, false))
       RETURNING *`,
      [academic_year, phase, is_active]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ==============================
// UPDATE (Edit) a configuration
// ==============================
exports.editConfig = async (req, res) => {
  const { id } = req.params;
  const { academic_year, phase, is_active } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: "Invalid or missing config ID" });
  }

  try {
    const result = await pool.query(
      `UPDATE pp.system_config
       SET academic_year = $1, phase = $2, is_active = $3
       WHERE system_config_id = $4 RETURNING *`,
      [academic_year, phase, is_active, id]
    );

    if (!result.rows[0])
      return res.status(404).json({ error: "Configuration not found" });

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: `Academic year '${academic_year}' already exists.` });
    }
    console.error("Error updating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ==============================
// DELETE a configuration
// ==============================
exports.deleteConfig = async (req, res) => {
  const { id } = req.params; // system_config_id

  try {
    const result = await pool.query(
      `DELETE FROM pp.system_config
       WHERE system_config_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    res.json({ message: "Configuration deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ==============================
// ACTIVATE a configuration
// (sets is_active = true for given row)
// ==============================
exports.activateConfig = async (req, res) => {
  const { id } = req.params; // system_config_id

  try {
    const result = await pool.query(
      `UPDATE pp.system_config
       SET is_active = true
       WHERE system_config_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error activating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ==============================
// GET all active configurations
// ==============================
exports.getActiveConfigs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT system_config_id, academic_year, phase, is_active, created_at, updated_at
       FROM pp.system_config
       WHERE is_active = true
       ORDER BY academic_year DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching active configs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
