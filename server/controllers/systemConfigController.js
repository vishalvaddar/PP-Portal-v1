const pool = require("../config/db");

// Get all configs, including is_active field
exports.getAllConfigs = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, academic_year, phase, is_active, created_at FROM pp.system_config ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching configs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a new config
exports.createConfig = async (req, res) => {
  const { academic_year, phase } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pp.system_config (academic_year, phase) VALUES ($1, $2) RETURNING *`,
      [academic_year, phase]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error creating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Activate a config (set all others inactive)
exports.activateConfig = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE pp.system_config SET is_active = false WHERE is_active = true");
    const result = await pool.query(
      "UPDATE pp.system_config SET is_active = true WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error activating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Edit all fields in a config
exports.editConfig = async (req, res) => {
  const { id } = req.params;
  const { academic_year, phase, is_active } = req.body;
  try {
    // If activating this row, deactivate others
    if (typeof is_active !== 'undefined' && is_active === true) {
      await pool.query("UPDATE pp.system_config SET is_active = false WHERE is_active = true AND id != $1", [id]);
    }
    const result = await pool.query(
      `UPDATE pp.system_config 
         SET academic_year = $1, phase = $2, is_active = $3 
         WHERE id = $4 RETURNING *`,
      [academic_year, phase, is_active, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Configuration not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a config
exports.deleteConfig = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM pp.system_config WHERE id = $1 RETURNING *",
      [id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Configuration not found" });
    res.json({ message: "Configuration deleted" });
  } catch (err) {
    console.error("Error deleting config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get active config
exports.getActiveConfig = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, academic_year, phase, is_active FROM pp.system_config WHERE is_active = true LIMIT 1"
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("Error fetching active config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
