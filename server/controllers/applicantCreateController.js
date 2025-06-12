const pool = require("../config/db");
const moment = require("moment");

const sanitizeValue = (value, type = "text") => {
  if (value === undefined || value === null || value === "") {
    return type === "numeric" ? null : null; // You could adjust numeric sanitization here if needed
  }
  return value;
};

const sanitizeDate = (dateStr) => {
  if (!dateStr) return null;
  return moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"], true).isValid()
    ? moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
    : null;
};

const createApplicant = async (req, res) => {
  const client = await pool.connect();
  try {
    console.log("Received data:", req.body);

    const requiredFields = [
      "nmms_year", "nmms_reg_number", "student_name", "father_name",
      "medium", "contact_no1", "contact_no2", "district",
      "nmms_block", "current_institute_dise_code", "gmat_score", "sat_score"
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        console.error(`Missing field: ${field}`);
        return res.status(400).json({ error: `${field} is required.` });
      }
    }

    const applicantData = {
      nmms_year: sanitizeValue(req.body.nmms_year, "numeric"),
      nmms_reg_number: sanitizeValue(req.body.nmms_reg_number),
      app_state: sanitizeValue(req.body.app_state),
      district: sanitizeValue(req.body.district),
      nmms_block: sanitizeValue(req.body.nmms_block),
      student_name: sanitizeValue(req.body.student_name),
      father_name: sanitizeValue(req.body.father_name),
      gmat_score: sanitizeValue(req.body.gmat_score, "numeric"),
      sat_score: sanitizeValue(req.body.sat_score, "numeric"),
      contact_no1: sanitizeValue(req.body.contact_no1),
      contact_no2: sanitizeValue(req.body.contact_no2),
      current_institute_dise_code: sanitizeValue(req.body.current_institute_dise_code, "numeric"),
      previous_institute_dise_code: sanitizeValue(req.body.previous_institute_dise_code, "numeric"),
      medium: sanitizeValue(req.body.medium),
      home_address: sanitizeValue(req.body.home_address),
      family_income_total: sanitizeValue(req.body.family_income_total, "numeric"),
      mother_name: sanitizeValue(req.body.mother_name),
      gender: sanitizeValue(req.body.gender),
      aadhaar: sanitizeValue(req.body.aadhaar),
      DOB: sanitizeDate(req.body.DOB),
    };

    await client.query('BEGIN');

    const insertPrimaryQuery = `
      INSERT INTO pp.applicant_primary_info (
        nmms_year, nmms_reg_number, app_state, district, nmms_block, 
        student_name, father_name, gmat_score, sat_score, contact_no1, 
        contact_no2, current_institute_dise_code, previous_institute_dise_code, medium, 
        home_address, family_income_total, mother_name, gender, aadhaar, DOB
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING applicant_id
    `;

    const values = Object.values(applicantData);
    const result = await client.query(insertPrimaryQuery, values);

    const applicantId = result.rows[0].applicant_id;

    // Insert into secondary_info
    await client.query(
      `INSERT INTO pp.applicant_secondary_info (applicant_id) VALUES ($1)`,
      [applicantId]
    );

    await client.query('COMMIT');

    console.log("Application created successfully. ID:", applicantId);

    res.status(201).json({
      message: "Application created successfully",
      data: { applicant_id: applicantId }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error inserting data:", error.stack);  // Log stack trace for debugging
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  } finally {
    client.release();
  }
};

module.exports = { createApplicant };
