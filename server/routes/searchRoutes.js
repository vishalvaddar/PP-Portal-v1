const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const {
      nmms_year,
      nmms_reg_number,
      student_name,
      medium,
      district,
      nmms_block,
      app_state,
      current_institute_dise_code,
      limit = 10,
      offset = 0,
      sort_by = "applicant_id",
      sort_order = "ASC",
    } = req.query;

    const pageLimit = parseInt(limit) || 10;
    const pageOffset = parseInt(offset) || 0;

    const sortableFields = [
      "applicant_id", "student_name", "nmms_year", "nmms_reg_number", "medium",
      "district", "nmms_block", "app_state", "current_institute_dise_code"
    ];

    const sortBySafe = sortableFields.includes(sort_by) ? sort_by : "applicant_id";
    const sortOrderSafe = (sort_order && sort_order.toUpperCase() === "DESC") ? "DESC" : "ASC";

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

    // Total count
    const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    if (totalCount === 0) {
      return res.status(404).json({ message: "No applications found matching the criteria." });
    }

    const dataValues = [...values];
    dataValues.push(pageLimit);
    dataValues.push(pageOffset);

    const dataQuery = `
      SELECT 
        a.*, 
        i.institute_name,
        js.juris_name AS state_name,
        jd.juris_name AS district_name,
        jb.juris_name AS block_name
      ${baseQuery}
      ${whereClause}
      ORDER BY a.${sortBySafe} ${sortOrderSafe}
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `;

    const { rows } = await pool.query(dataQuery, dataValues);

    res.json({
      data: rows,
      pagination: {
        total: totalCount,
        limit: pageLimit,
        offset: pageOffset,
        totalPages: Math.ceil(totalCount / pageLimit),
        currentPage: Math.floor(pageOffset / pageLimit) + 1,
        nextOffset: pageOffset + pageLimit < totalCount ? pageOffset + pageLimit : null,
        preOffset: pageOffset - pageLimit >= 0 ? pageOffset - pageLimit : null,
      },
      sort: {
        sortBy: sortBySafe,
        sortOrder: sortOrderSafe,
      }
    });

  } catch (error) {
    console.error("Error searching applications:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.get("/cohorts", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * from pp.cohort ORDER BY cohort_number ASC
    `);
    res.json({ data: rows });
  } catch (error) {
    console.error("Error fetching cohorts:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.get("/batches/cohort/:cohortNumber", async (req, res) => {
  try {
    const { cohortNumber } = req.params;
    const { rows } = await pool.query(`
      SELECT * from pp.batch WHERE cohort_number = $1 ORDER BY batch_id ASC
    `, [cohortNumber]);
    res.json({ data: rows });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
