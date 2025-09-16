const pool = require("../config/db");

exports.getSystemConfig = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT academic_year, phase FROM pp.system_config WHERE is_active = true LIMIT 1"
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("Error fetching system config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateSystemConfig = async (req, res) => {
  const { academic_year, phase } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pp.system_config 
       SET academic_year = $1, phase = $2 
       WHERE is_active = true 
       RETURNING *`,
      [academic_year, phase]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating system config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
