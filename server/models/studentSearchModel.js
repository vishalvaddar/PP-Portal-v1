const pool = require("../config/db");

const searchStudents = async (filters) => {
  const {
    batch_id,
    cohort_number,
    name,
    enr_id,
    gender,
    state_id,
    district_id,
    block_id,
    limit = 50,
    offset = 0,
  } = filters;

  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const parsedOffset = Math.max(Number(offset) || 0, 0);

  let where = [];
  let values = [];
  let i = 1;

  // --- Standard Filters ---
  if (batch_id) {
    where.push(`sm.batch_id = $${i++}`);
    values.push(Number(batch_id));
  }

  if (cohort_number) {
    where.push(`c.cohort_number = $${i++}`);
    values.push(Number(cohort_number));
  }

  if (name?.trim()) {
    where.push(`sm.student_name ILIKE $${i++}`);
    values.push(`%${name.trim()}%`);
  }

  if (enr_id?.trim()) {
    where.push(`CAST(sm.enr_id AS TEXT) ILIKE $${i++}`);
    values.push(`%${enr_id.trim()}%`);
  }

  if (gender?.trim()) {
    where.push(`UPPER(sm.gender) = $${i++}`);
    values.push(gender.trim().toUpperCase());
  }

  // --- Location Filters ---
  if (state_id) {
    where.push(`api.app_state = $${i++}`);
    values.push(Number(state_id));
  }

  if (district_id) {
    where.push(`api.district = $${i++}`);
    values.push(Number(district_id));
  }

  if (block_id) {
    where.push(`api.nmms_block = $${i++}`);
    values.push(Number(block_id));
  }

  const whereClause = where.length ? `AND ${where.join(" AND ")}` : "";

  // --- Data Query ---
  const dataQuery = `
    SELECT
      sm.student_id,
      sm.student_name,
      sm.enr_id,
      sm.gender,
      b.batch_name,
      c.cohort_name,
      api.nmms_year,
      api.nmms_reg_number,
      j_state.juris_name AS state,
      j_dist.juris_name AS district
    FROM pp.student_master sm
    JOIN pp.batch b ON sm.batch_id = b.batch_id
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
    LEFT JOIN pp.jurisdiction j_state ON api.app_state = j_state.juris_code
    LEFT JOIN pp.jurisdiction j_dist ON api.district = j_dist.juris_code
    WHERE 1=1
    ${whereClause}
    ORDER BY sm.student_name ASC
    LIMIT $${i++} OFFSET $${i++}
  `;

  const dataResult = await pool.query(
    dataQuery,
    [...values, parsedLimit, parsedOffset]
  );

  // --- Count Query ---
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM pp.student_master sm
    JOIN pp.batch b ON sm.batch_id = b.batch_id
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
    WHERE 1=1
    ${whereClause}
  `;

  const countResult = await pool.query(countQuery, values);

  return {
    rows: dataResult.rows,
    total: Number(countResult.rows[0].total),
    limit: parsedLimit,
    offset: parsedOffset,
  };
};

/* =========================================================
   GET STUDENT BY ID
========================================================= */
const getStudentById = async (student_id) => {
  const result = await pool.query(
    `SELECT * FROM pp.student_master WHERE student_id = $1`,
    [Number(student_id)]
  );
  return result.rows[0] || null;
};

module.exports = {
  searchStudents,
  getStudentById,
};
