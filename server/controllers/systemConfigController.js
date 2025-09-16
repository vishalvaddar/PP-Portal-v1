const pool = require("../config/db");

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

exports.createConfig = async (req, res) => {
  const { academic_year, phase } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pp.system_config (academic_year, phase) 
       VALUES ($1, $2) RETURNING *`,
      [academic_year, phase]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error creating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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

exports.deleteConfig = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM pp.system_config WHERE id = $1 RETURNING *",
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Configuration not found" });
    res.json({ message: "Configuration deleted" });
  } catch (err) {
    console.error("Error deleting config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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
