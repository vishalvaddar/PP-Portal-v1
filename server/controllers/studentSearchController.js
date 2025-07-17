// controllers/studentSearchController.js
const pool = require("../config/db");

// -----------------------------------------------------------------------------
// GET /api/students/search
// -----------------------------------------------------------------------------
const studentSearchController = async (req, res) => {
  try {
    // ------------------------------ Query params -----------------------------
    const {
      nmms_year,
      app_state,
      district,
      nmms_block,
      medium,
      current_institute_dise_code,
      nmms_reg_number,
      student_name,
      limit = 10,
      offset = 0,
    } = req.query;

    // --------------------------- Base query & filters ------------------------
    let query = `
      SELECT *
      FROM   pp.students_master sm
      WHERE  1 = 1
    `;

    const filters = [];
    const values  = [];
    let idx = 1;

    if (nmms_year) {
      filters.push(`sm.nmms_year = $${idx++}`);
      values.push(nmms_year);
    }

    if (app_state) {
      filters.push(`sm.app_state = $${idx++}`);
      values.push(app_state);
    }

    if (district) {
      filters.push(`sm.district = $${idx++}`);
      values.push(district);
    }

    if (nmms_block) {
      filters.push(`sm.nmms_block = $${idx++}`);
      values.push(nmms_block);
    }

    if (medium) {
      filters.push(`sm.medium = $${idx++}`);
      values.push(medium);
    }

    if (current_institute_dise_code) {
      filters.push(`sm.current_institute_dise_code = $${idx++}`);
      values.push(current_institute_dise_code);
    }

    if (nmms_reg_number) {
      filters.push(`sm.nmms_reg_number = $${idx++}`);
      values.push(nmms_reg_number);
    }

    if (student_name) {
      filters.push(`sm.student_name ILIKE '%' || $${idx++} || '%'`);
      values.push(student_name);
    }

    if (filters.length) {
      query += " AND " + filters.join(" AND ");
    }

    // ---------------------------- Pagination ---------------------------------
    query += ` ORDER BY sm.student_name ASC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    // ------------------------------ Run query --------------------------------
    const { rows } = await pool.query(query, values);

    // ------------------------------ Count query ------------------------------
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM   pp.students_master sm
      WHERE  1 = 1
      ${filters.length ? " AND " + filters.join(" AND ") : ""}
    `;
    const { rows: countRows } = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countRows[0].total, 10);

    // ------------------------------ Response ---------------------------------
    res.json({
      data: rows,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (err) {
    console.error("Error in studentSearch controller:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { studentSearchController };
