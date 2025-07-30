const pool = require("../config/db");

const studentSearchController = async (req, res) => {
  try {
    const {
      batch,
      cohort,
      name,
      enr_id,
      gender,
      limit = 50,
      offset = 0,
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100); // Max 100 records
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const baseQuery = `
      FROM pp.student_master sm
      JOIN pp.batch b ON sm.batch_id = b.batch_id
      JOIN pp.cohort c ON b.cohort_number = c.cohort_number
      JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
      WHERE 1 = 1
    `;

    const filters = [];
    const values = [];
    let paramIndex = 1;

    if (batch && batch.trim()) {
      filters.push(`b.batch_name ILIKE $${paramIndex++}`);
      values.push(`%${batch.trim()}%`);
    }

    if (enr_id && /^\d+$/.test(enr_id.trim())) {
      filters.push(`sm.enr_id = $${paramIndex++}`);
      values.push(parseInt(enr_id.trim()));
    }

    if (cohort && cohort.trim()) {
      filters.push(`c.cohort_name ILIKE $${paramIndex++}`);
      values.push(`%${cohort.trim()}%`);
    }

    if (name && name.trim()) {
      filters.push(`sm.student_name ILIKE $${paramIndex++}`);
      values.push(`%${name.trim()}%`);
    }

    if (gender && gender.trim()) {
      filters.push(`sm.gender = $${paramIndex++}`);
      values.push(gender.trim());
    }

    const whereClause = filters.length > 0 ? ` AND ${filters.join(" AND ")}` : "";

    const selectQuery = `
      SELECT 
        sm.student_id,
        sm.student_name,
        sm.enr_id,
        sm.gender,
        b.batch_name,
        c.cohort_name,
        api.nmms_year
      ${baseQuery}
      ${whereClause}
      ORDER BY sm.student_name ASC, sm.student_id ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parsedLimit, parsedOffset);

    const result = await pool.query(selectQuery, values);

    let total = 0;
    if (result.rows.length > 0 || parsedOffset > 0) {
      const countQuery = `
        SELECT COUNT(*) AS total
        ${baseQuery}
        ${whereClause}
      `;

      const countValues = values.slice(0, -2); // Remove limit and offset
      const countResult = await pool.query(countQuery, countValues);
      total = parseInt(countResult.rows[0]?.total || 0, 10);
    }

    const hasMore = (parsedOffset + parsedLimit) < total;
    
    res.json({
      success: true,
      data: result.rows || [],
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore,
        page: Math.floor(parsedOffset / parsedLimit) + 1,
        totalPages: Math.ceil(total / parsedLimit),
      },
      message: result.rows.length === 0 ? "No students found matching your criteria" : undefined,
    });

  } catch (error) {
    console.error("Error in student search controller:", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });

    if (error.code === '42P01') {
      return res.status(500).json({
        success: false,
        error: "Database table not found",
        message: "Please contact system administrator",
      });
    }

    if (error.code === '42703') {
      return res.status(500).json({
        success: false,
        error: "Database column not found", 
        message: "Please contact system administrator",
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: "Database connection failed",
        message: "Service temporarily unavailable",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred while searching students",
    });
  }
};

const advancedStudentSearch = async (req, res) => {
  try {
    const {
      batch,
      year,
      cohort,
      name,
      gender,
      enr_id,
      student_id,
      father_name,
      mother_name,
      sort_by = 'student_name',
      sort_order = 'ASC',
      limit = 50,
      offset = 0,
    } = req.query;

    const allowedSortFields = ['student_name', 'student_id', 'nmms_year', 'batch_name', 'enr_id'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'student_name';
    const sortOrder = allowedSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const baseQuery = `
      FROM pp.student_master sm
      JOIN pp.batch b ON sm.batch_id = b.batch_id
      JOIN pp.cohort c ON b.cohort_number = c.cohort_number
      JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
      WHERE 1 = 1
    `;

    const filters = [];
    const values = [];
    let paramIndex = 1;

    if (batch?.trim()) {
      filters.push(`b.batch_name ILIKE $${paramIndex++}`);
      values.push(`%${batch.trim()}%`);
    }

    if (year?.trim()) {
      if (/^\d{4}$/.test(year.trim())) {
        filters.push(`api.nmms_year = $${paramIndex++}`);
        values.push(parseInt(year.trim()));
      }
    }

    if (cohort?.trim()) {
      filters.push(`c.cohort_name ILIKE $${paramIndex++}`);
      values.push(`%${cohort.trim()}%`);
    }

    if (name?.trim()) {
      filters.push(`sm.student_name ILIKE $${paramIndex++}`);
      values.push(`%${name.trim()}%`);
    }

    if (gender?.trim()) {
      filters.push(`sm.gender = $${paramIndex++}`);
      values.push(gender.trim().toUpperCase());
    }

    if (enr_id?.trim()) {
      if (/^\d+$/.test(enr_id.trim())) {
        filters.push(`sm.enr_id = $${paramIndex++}`);
        values.push(parseInt(enr_id.trim()));
      } else {
        filters.push(`CAST(sm.enr_id AS TEXT) ILIKE $${paramIndex++}`);
        values.push(`%${enr_id.trim()}%`);
      }
    }

    if (student_id?.trim()) {
      if (/^\d+$/.test(student_id.trim())) {
        filters.push(`sm.student_id = $${paramIndex++}`);
        values.push(parseInt(student_id.trim()));
      }
    }

    if (father_name?.trim()) {
      filters.push(`sm.father_name ILIKE $${paramIndex++}`);
      values.push(`%${father_name.trim()}%`);
    }

    if (mother_name?.trim()) {
      filters.push(`sm.mother_name ILIKE $${paramIndex++}`);
      values.push(`%${mother_name.trim()}%`);
    }

    if (filters.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, limit: parsedLimit, offset: parsedOffset },
        message: "Please provide at least one search criteria",
      });
    }

    const whereClause = ` AND ${filters.join(" AND ")}`;

    const sortFieldMap = {
      'student_name': 'sm.student_name',
      'student_id': 'sm.student_id',
      'nmms_year': 'api.nmms_year',
      'batch_name': 'b.batch_name',
      'enr_id': 'sm.enr_id',
    };

    const selectQuery = `
      SELECT 
        sm.student_id,
        sm.student_name,
        sm.enr_id,
        sm.gender,
        sm.father_name,
        sm.mother_name,
        b.batch_name,
        c.cohort_name,
        api.nmms_year,
        sm.contact_no1,
        sm.contact_no2,
        sm.student_email,
        sm.parent_email
      ${baseQuery}
      ${whereClause}
      ORDER BY ${sortFieldMap[sortField]} ${sortOrder}, sm.student_id ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parsedLimit, parsedOffset);

    const result = await pool.query(selectQuery, values);

    let total = 0;
    if (result.rows.length > 0 || parsedOffset > 0) {
      const countQuery = `SELECT COUNT(*) AS total ${baseQuery} ${whereClause}`;
      const countResult = await pool.query(countQuery, values.slice(0, -2));
      total = parseInt(countResult.rows[0]?.total || 0, 10);
    }

    res.json({
      success: true,
      data: result.rows || [],
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: (parsedOffset + parsedLimit) < total,
        page: Math.floor(parsedOffset / parsedLimit) + 1,
        totalPages: Math.ceil(total / parsedLimit),
      },
      filters: {
        batch,
        year,
        cohort,
        name,
        gender,
        enr_id,
        student_id,
        father_name,
        mother_name,
        sort_by: sortField,
        sort_order: sortOrder,
      },
    });

  } catch (error) {
    console.error("Error in advanced student search:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred while searching students",
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (!student_id || !/^\d+$/.test(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID",
        message: "Student ID must be a valid number",
      });
    }

    const query = `
      SELECT 
        sm.student_id,
        sm.applicant_id,
        sm.enr_id,
        sm.student_name,
        sm.father_name,
        sm.mother_name,
        sm.gender,
        sm.sim_name,
        sm.student_email,
        sm.parent_email,
        sm.photo_link,
        sm.home_address,
        sm.contact_no1,
        sm.contact_no2,
        b.batch_name,
        c.cohort_name,
        c.start_date,
        c.end_date,
        api.nmms_year,
        api.nmms_reg_number,
        api.aadhaar,
        api.DOB,
        api.medium,
        api.gmat_score,
        api.sat_score,
        api.family_income_total,
        current_inst.institute_name as current_institute_name,
        previous_inst.institute_name as previous_institute_name
      FROM pp.student_master sm
      JOIN pp.batch b ON sm.batch_id = b.batch_id
      JOIN pp.cohort c ON b.cohort_number = c.cohort_number
      JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
      LEFT JOIN pp.institute current_inst ON sm.current_institute_dise_code = current_inst.dise_code
      LEFT JOIN pp.institute previous_inst ON sm.previous_institute_dise_code = previous_inst.dise_code
      WHERE sm.student_id = $1
    `;

    const result = await pool.query(query, [parseInt(student_id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
        message: "No student found with the provided ID",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Error fetching student by ID:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred while fetching student details",
    });
  }
};

module.exports = { 
  studentSearchController,
  advancedStudentSearch,
  getStudentById
};