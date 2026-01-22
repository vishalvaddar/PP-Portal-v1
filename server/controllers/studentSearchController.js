const pool = require("../config/db");

/* =========================================================
   BASIC STUDENT SEARCH
========================================================= */
const studentSearchController = async (req, res) => {
  try {
    const {
      batch_id,
      cohort_number,
      name,
      enr_id,
      gender,
      state_id,      // <--- Added
      district_id,   // <--- Added
      block_id,      // <--- Added
      limit = 50,
      offset = 0,
    } = req.query;

    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const parsedOffset = Math.max(Number(offset) || 0, 0);

    let where = [];
    let values = [];
    let i = 1;

    // --- 1. Standard Filters ---
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

    // --- 2. Location Filters (Crucial for "Search by State" to work) ---
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

    // --- 3. Main Query ---
    // If no filters are provided, this simply returns the first 50 students (WHERE 1=1)
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

    const dataValues = [...values, parsedLimit, parsedOffset];
    const dataResult = await pool.query(dataQuery, dataValues);

    // --- 4. Count Query ---
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
    const total = Number(countResult.rows[0].total);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        page: Math.floor(parsedOffset / parsedLimit) + 1,
        totalPages: Math.ceil(total / parsedLimit),
        hasMore: parsedOffset + parsedLimit < total,
      },
    });

  } catch (error) {
    console.error("Student search error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

/* =========================================================
   ADVANCED SEARCH (UPDATED)
========================================================= */
const advancedStudentSearch = async (req, res) => {
  try {
    const {
      batch_id, cohort_number, year, name, gender, enr_id,
      state_id, district_id, block_id, // Added geo params
      sort_by = "student_name", sort_order = "ASC",
      limit = 50, offset = 0,
    } = req.query;

    const allowedSort = {
      student_name: "sm.student_name",
      student_id: "sm.student_id",
      nmms_year: "api.nmms_year",
      enr_id: "sm.enr_id",
    };

    const sortField = allowedSort[sort_by] || allowedSort.student_name;
    const sortOrder = sort_order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    let where = [];
    let values = [];
    let i = 1;

    // Filters
    if (batch_id) { where.push(`sm.batch_id = $${i++}`); values.push(Number(batch_id)); }
    if (cohort_number) { where.push(`c.cohort_number = $${i++}`); values.push(Number(cohort_number)); }
    if (year) { where.push(`api.nmms_year = $${i++}`); values.push(Number(year)); }
    if (name?.trim()) { where.push(`sm.student_name ILIKE $${i++}`); values.push(`%${name.trim()}%`); }
    if (gender?.trim()) { where.push(`UPPER(sm.gender) = $${i++}`); values.push(gender.trim().toUpperCase()); }
    if (enr_id?.trim()) { where.push(`CAST(sm.enr_id AS TEXT) ILIKE $${i++}`); values.push(`%${enr_id.trim()}%`); }
    
    // Geo Filters
    if (state_id) { where.push(`api.app_state = $${i++}`); values.push(Number(state_id)); }
    if (district_id) { where.push(`api.district = $${i++}`); values.push(Number(district_id)); }
    if (block_id) { where.push(`api.nmms_block = $${i++}`); values.push(Number(block_id)); }

    // Removed the check "if (where.length === 0)" to allow empty search here too if desired.
    // If you WANT to block empty search in Advanced Mode, uncomment below:
    /*
    if (where.length === 0) {
      return res.json({ success: true, data: [], message: "Provide at least one search field" });
    }
    */

    const whereClause = where.length ? `AND ${where.join(" AND ")}` : "";

    const query = `
      SELECT
        sm.student_id,
        sm.student_name,
        sm.enr_id,
        sm.gender,
        b.batch_name,
        c.cohort_name,
        api.nmms_year,
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
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${i++} OFFSET $${i++}
    `;

    const result = await pool.query(query, [...values, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({ success: false });
  }
};

/* =========================================================
   GET STUDENT BY ID
========================================================= */
const getStudentById = async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM pp.student_master WHERE student_id = $1`,
      [Number(student_id)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  studentSearchController,
  advancedStudentSearch,
  getStudentById,
};