const pool = require("../config/db");

/* ==============================
   GET all configurations
============================== */
const getAllConfigs = async () => {
  const query = `
    SELECT system_config_id, academic_year, phase, is_active, created_at, updated_at
    FROM pp.system_config
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/* ==============================
   CREATE configuration
============================== */
const createConfig = async ({ academic_year, phase, is_active }) => {
  const query = `
    INSERT INTO pp.system_config (academic_year, phase, is_active)
    VALUES ($1, $2, COALESCE($3, false))
    RETURNING *
  `;
  const result = await pool.query(query, [academic_year, phase, is_active]);
  return result.rows[0];
};

/* ==============================
   UPDATE configuration
============================== */
const updateConfig = async (id, { academic_year, phase, is_active }) => {
  const query = `
    UPDATE pp.system_config
    SET academic_year = $1,
        phase = $2,
        is_active = $3
    WHERE system_config_id = $4
    RETURNING *
  `;
  const result = await pool.query(query, [
    academic_year,
    phase,
    is_active,
    id,
  ]);
  return result.rows[0];
};

/* ==============================
   DELETE configuration
============================== */
const deleteConfig = async (id) => {
  const query = `
    DELETE FROM pp.system_config
    WHERE system_config_id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/* ==============================
   ACTIVATE configuration
============================== */
const activateConfig = async (id) => {
  const query = `
    UPDATE pp.system_config
    SET is_active = true
    WHERE system_config_id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/* ==============================
   GET active configurations
============================== */
const getActiveConfigs = async () => {
  const query = `
    SELECT system_config_id, academic_year, phase, is_active, created_at, updated_at
    FROM pp.system_config
    WHERE is_active = true
    ORDER BY academic_year DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  activateConfig,
  getActiveConfigs,
};
