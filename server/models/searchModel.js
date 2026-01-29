const pool = require("../config/db");

const searchModel = {
  searchStudents: async (filters, pagination, sorting) => {
    const { 
      nmms_reg_number, student_name, nmms_year, medium, 
      app_state, district, nmms_block, current_institute_dise_code 
    } = filters;

    const { limit, offset } = pagination;
    const { sortBy, sortOrder } = sorting;

    let baseQuery = `
      FROM pp.applicant_primary_info a
      LEFT JOIN pp.institute i ON a.current_institute_dise_code = i.dise_code
      LEFT JOIN pp.jurisdiction js ON a.app_state = js.juris_code
      LEFT JOIN pp.jurisdiction jd ON a.district = jd.juris_code
      LEFT JOIN pp.jurisdiction jb ON a.nmms_block = jb.juris_code
      WHERE 1=1
    `;

    const values = [];
    let whereClause = "";

    // Dynamic Query Construction
    if (nmms_reg_number) {
      values.push(nmms_reg_number.trim());
      whereClause += ` AND a.nmms_reg_number = $${values.length}`;
    }
    if (student_name) {
      values.push(`%${student_name.trim()}%`);
      whereClause += ` AND a.student_name ILIKE $${values.length}`;
    }
    if (nmms_year) {
      values.push(parseInt(nmms_year));
      whereClause += ` AND a.nmms_year = $${values.length}`;
    }
    if (medium) {
      values.push(medium.trim().toUpperCase());
      whereClause += ` AND UPPER(a.medium) = $${values.length}`;
    }
    if (app_state) {
      values.push(app_state.trim());
      whereClause += ` AND a.app_state = $${values.length}`;
    }
    if (district) {
      values.push(district.trim());
      whereClause += ` AND a.district = $${values.length}`;
    }
    if (nmms_block) {
      values.push(nmms_block.trim());
      whereClause += ` AND a.nmms_block = $${values.length}`;
    }
    if (current_institute_dise_code) {
      values.push(current_institute_dise_code.trim());
      whereClause += ` AND a.current_institute_dise_code = $${values.length}`;
    }

    // 1. Get Total Count
    const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    if (totalCount === 0) {
      return { rows: [], totalCount: 0 };
    }

    // 2. Get Data
    const dataValues = [...values, limit, offset];
    const dataQuery = `
      SELECT 
        a.*, 
        i.institute_name,
        js.juris_name AS state_name,
        jd.juris_name AS district_name,
        jb.juris_name AS block_name
      ${baseQuery}
      ${whereClause}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `;

    const { rows } = await pool.query(dataQuery, dataValues);
    
    return { rows, totalCount };
  },

  /**
   * Get all cohorts
   */
  getAllCohorts: async () => {
    const query = `SELECT * from pp.cohort ORDER BY cohort_number ASC`;
    const { rows } = await pool.query(query);
    return rows;
  },

  /**
   * Get batches by cohort number
   */
  getBatchesByCohort: async (cohortNumber) => {
    const query = `SELECT * from pp.batch WHERE cohort_number = $1 ORDER BY batch_id ASC`;
    const { rows } = await pool.query(query, [cohortNumber]);
    return rows;
  }
};

module.exports = searchModel;