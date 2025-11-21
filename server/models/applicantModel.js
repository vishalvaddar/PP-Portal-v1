const pool = require("../config/db");

// CREATE — Insert applicant primary info + empty secondary entry
async function createApplicant(primaryData) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert into primary info
    const insertPrimary = `
      INSERT INTO pp.applicant_primary_info (
        nmms_year, nmms_reg_number, app_state, district, nmms_block,
        student_name, father_name, mother_name, gmat_score, sat_score,
        gender, medium, aadhaar, dob, home_address, family_income_total,
        contact_no1, contact_no2, current_institute_dise_code, previous_institute_dise_code,
        created_by, updated_by
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,
        $21,$21
      )
      RETURNING applicant_id
    `;

    const values = [
      primaryData.nmms_year,
      primaryData.nmms_reg_number,
      primaryData.app_state,
      primaryData.district,
      primaryData.nmms_block,
      primaryData.student_name,
      primaryData.father_name,
      primaryData.mother_name,
      primaryData.gmat_score,
      primaryData.sat_score,
      primaryData.gender,
      primaryData.medium,
      primaryData.aadhaar,
      primaryData.dob,
      primaryData.home_address,
      primaryData.family_income_total,
      primaryData.contact_no1,
      primaryData.contact_no2,
      primaryData.current_institute_dise_code,
      primaryData.previous_institute_dise_code,
      primaryData.created_by
    ];

    const { rows } = await client.query(insertPrimary, values);
    const applicantId = rows[0].applicant_id;

    // Insert empty secondary info row
    await client.query(
      `
      INSERT INTO pp.applicant_secondary_info (applicant_id, created_by, updated_by)
      VALUES ($1, $2, $2)
      `,
      [applicantId, primaryData.created_by]
    );

    // REMOVE THIS unless you really want a default sibling!
    /*
    await client.query(
      `
      INSERT INTO pp.sibling_education (applicant_id, sibling_name, sibling_type, education, created_by, updated_by)
      VALUES ($1, NULL, 'B', 'OTHERS', $2, $2)
      `,
      [applicantId, primaryData.created_by]
    );
    */

    await client.query("COMMIT");
    return { applicant_id: applicantId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}



async function getApplicantById(applicantId) {
  const query = `
    SELECT *
    FROM pp.applicant_primary_info
    WHERE applicant_id = $1
  `;
  const { rows } = await pool.query(query, [applicantId]);
  return rows[0] || null;
}



// UPDATE
async function updateApplicant(applicantId, primaryData) {
  const query = `
    UPDATE pp.applicant_primary_info
    SET
      nmms_year = $1,
      app_state = $2,
      district = $3,
      nmms_block = $4,
      student_name = $5,
      father_name = $6,
      mother_name = $7,
      gmat_score = $8,
      sat_score = $9,
      gender = $10,
      medium = $11,
      aadhaar = $12,
      dob = $13,
      home_address = $14,
      family_income_total = $15,
      contact_no1 = $16,
      contact_no2 = $17,
      current_institute_dise_code = $18,
      previous_institute_dise_code = $19,
      updated_by = $20,
      updated_at = CURRENT_TIMESTAMP
    WHERE applicant_id = $21
    RETURNING *
  `;

  const values = [
    primaryData.nmms_year,
    primaryData.app_state,
    primaryData.district,
    primaryData.nmms_block,
    primaryData.student_name,
    primaryData.father_name,
    primaryData.mother_name,
    primaryData.gmat_score,
    primaryData.sat_score,
    primaryData.gender,
    primaryData.medium,
    primaryData.aadhaar,
    primaryData.dob,
    primaryData.home_address,
    primaryData.family_income_total,
    primaryData.contact_no1,
    primaryData.contact_no2,
    primaryData.current_institute_dise_code,
    primaryData.previous_institute_dise_code,
    primaryData.updated_by,
    applicantId
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}



// DELETE
async function deleteApplicant(applicantId) {
  const { rows } = await pool.query(
    `DELETE FROM pp.applicant_primary_info WHERE applicant_id = $1 RETURNING applicant_id`,
    [applicantId]
  );
  return rows[0];
}



// READ — View by NMMS registration number
async function viewApplicantByRegNumber(nmms_reg_number) {
  const query = `
    SELECT 
      p.*,
      s.*
    FROM pp.applicant_primary_info p
    LEFT JOIN pp.applicant_secondary_info s
      ON p.applicant_id = s.applicant_id
    WHERE p.nmms_reg_number = $1
  `;

  const { rows } = await pool.query(query, [nmms_reg_number]);
  return rows[0] || null;
}



// GET ALL
async function getAllApplicants() {
  const query = `
    SELECT 
      applicant_id,
      nmms_year,
      nmms_reg_number,
      student_name,
      father_name,
      mother_name,
      gender,
      district,
      contact_no1,
      created_at
    FROM pp.applicant_primary_info
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}


// EXPORTS
module.exports = {
  createApplicant,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  viewApplicantByRegNumber,
  getAllApplicants
};
