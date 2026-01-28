const pool = require("../config/db");

// Clean empty strings to NULL (Prevents integer/date crashes)
const clean = (val) => (val === "" || val === undefined ? null : val);

const formatDate = (val) => {
  if (!val) return null;
  try {
    return new Date(val).toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
};

// =========================================================
// 1. CREATE APPLICANT (Primary + Secondary)
// =========================================================
async function createApplicant(data) {
  const { primaryData, secondaryData } = data;
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // --- A. Insert Primary Info ---
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

    const primaryValues = [
      clean(primaryData.nmms_year),
      clean(primaryData.nmms_reg_number),
      clean(primaryData.app_state),
      clean(primaryData.district),
      clean(primaryData.nmms_block),
      clean(primaryData.student_name),
      clean(primaryData.father_name),
      clean(primaryData.mother_name),
      clean(primaryData.gmat_score),
      clean(primaryData.sat_score),
      clean(primaryData.gender),
      clean(primaryData.medium),
      clean(primaryData.aadhaar),
      formatDate(primaryData.dob),
      clean(primaryData.home_address),
      clean(primaryData.family_income_total),
      clean(primaryData.contact_no1),
      clean(primaryData.contact_no2),
      clean(primaryData.current_institute_dise_code),
      clean(primaryData.previous_institute_dise_code),
      primaryData.created_by
    ];

    const { rows } = await client.query(insertPrimary, primaryValues);
    if (!rows.length) throw new Error("Failed to insert primary info");
    
    const applicantId = rows[0].applicant_id;

    // --- B. Insert Secondary Info ---
    const insertSecondary = `
      INSERT INTO pp.applicant_secondary_info (
        applicant_id, village, father_occupation, mother_occupation,
        father_education, mother_education, household_size, own_house,
        smart_phone_home, internet_facility_home, career_goals, subjects_of_interest,
        transportation_mode, distance_to_school, num_two_wheelers, num_four_wheelers,
        irrigation_land, neighbor_name, neighbor_phone, favorite_teacher_name, favorite_teacher_phone,
        created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, 
        $5, $6, $7, $8, 
        $9, $10, $11, $12, 
        $13, $14, $15, $16, 
        $17, $18, $19, $20, $21,
        $22, $22
      )
    `;

    const sec = secondaryData || {};
    const secondaryValues = [
      applicantId,
      clean(sec.village),
      clean(sec.father_occupation),
      clean(sec.mother_occupation),
      clean(sec.father_education),
      clean(sec.mother_education),
      clean(sec.household_size),
      clean(sec.own_house),
      clean(sec.smart_phone_home),
      clean(sec.internet_facility_home),
      clean(sec.career_goals),
      clean(sec.subjects_of_interest),
      clean(sec.transportation_mode),
      clean(sec.distance_to_school),
      sec.num_two_wheelers || 0,
      sec.num_four_wheelers || 0,
      sec.irrigation_land || 0,
      clean(sec.neighbor_name),
      clean(sec.neighbor_phone),
      clean(sec.favorite_teacher_name),
      clean(sec.favorite_teacher_phone),
      primaryData.created_by
    ];

    await client.query(insertSecondary, secondaryValues);

    await client.query("COMMIT");
    return { applicant_id: applicantId };

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating applicant:", err);
    throw err;
  } finally {
    client.release();
  }
}

// =========================================================
// 2. UPDATE APPLICANT (Primary + Secondary)
// =========================================================
async function updateApplicant(applicantId, data) {
  const { primaryData, secondaryData } = data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --- A. Update Primary Info ---
    if (primaryData) {
      const updatePrimary = `
        UPDATE pp.applicant_primary_info
        SET
          nmms_year = $1, app_state = $2, district = $3, nmms_block = $4,
          student_name = $5, father_name = $6, mother_name = $7,
          gmat_score = $8, sat_score = $9, gender = $10,
          medium = $11, aadhaar = $12, dob = $13,
          home_address = $14, family_income_total = $15,
          contact_no1 = $16, contact_no2 = $17,
          current_institute_dise_code = $18, previous_institute_dise_code = $19,
          updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = $20
      `;

      const primaryValues = [
        clean(primaryData.nmms_year),
        clean(primaryData.app_state),
        clean(primaryData.district),
        clean(primaryData.nmms_block),
        clean(primaryData.student_name),
        clean(primaryData.father_name),
        clean(primaryData.mother_name),
        clean(primaryData.gmat_score),
        clean(primaryData.sat_score),
        clean(primaryData.gender),
        clean(primaryData.medium),
        clean(primaryData.aadhaar),
        formatDate(primaryData.dob),
        clean(primaryData.home_address),
        clean(primaryData.family_income_total),
        clean(primaryData.contact_no1),
        clean(primaryData.contact_no2),
        clean(primaryData.current_institute_dise_code),
        clean(primaryData.previous_institute_dise_code),
        applicantId
      ];

      await client.query(updatePrimary, primaryValues);
    }

    // --- B. Upsert Secondary Info (Insert if new, Update if exists) ---
    if (secondaryData) {
      const upsertSecondary = `
        INSERT INTO pp.applicant_secondary_info (
          village, father_occupation, mother_occupation, father_education, mother_education,
          household_size, own_house, smart_phone_home, internet_facility_home,
          career_goals, subjects_of_interest, transportation_mode, distance_to_school,
          num_two_wheelers, num_four_wheelers, irrigation_land,
          neighbor_name, neighbor_phone, favorite_teacher_name, favorite_teacher_phone,
          applicant_id, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP
        )
        ON CONFLICT (applicant_id) 
        DO UPDATE SET
          village = EXCLUDED.village,
          father_occupation = EXCLUDED.father_occupation,
          mother_occupation = EXCLUDED.mother_occupation,
          father_education = EXCLUDED.father_education,
          mother_education = EXCLUDED.mother_education,
          household_size = EXCLUDED.household_size,
          own_house = EXCLUDED.own_house,
          smart_phone_home = EXCLUDED.smart_phone_home,
          internet_facility_home = EXCLUDED.internet_facility_home,
          career_goals = EXCLUDED.career_goals,
          subjects_of_interest = EXCLUDED.subjects_of_interest,
          transportation_mode = EXCLUDED.transportation_mode,
          distance_to_school = EXCLUDED.distance_to_school,
          num_two_wheelers = EXCLUDED.num_two_wheelers,
          num_four_wheelers = EXCLUDED.num_four_wheelers,
          irrigation_land = EXCLUDED.irrigation_land,
          neighbor_name = EXCLUDED.neighbor_name,
          neighbor_phone = EXCLUDED.neighbor_phone,
          favorite_teacher_name = EXCLUDED.favorite_teacher_name,
          favorite_teacher_phone = EXCLUDED.favorite_teacher_phone,
          updated_at = CURRENT_TIMESTAMP;
      `;

      const secondaryValues = [
        clean(secondaryData.village),
        clean(secondaryData.father_occupation),
        clean(secondaryData.mother_occupation),
        clean(secondaryData.father_education),
        clean(secondaryData.mother_education),
        clean(secondaryData.household_size),
        clean(secondaryData.own_house),
        clean(secondaryData.smart_phone_home),
        clean(secondaryData.internet_facility_home),
        clean(secondaryData.career_goals),
        clean(secondaryData.subjects_of_interest),
        clean(secondaryData.transportation_mode),
        clean(secondaryData.distance_to_school),
        clean(secondaryData.num_two_wheelers),
        clean(secondaryData.num_four_wheelers),
        clean(secondaryData.irrigation_land),
        clean(secondaryData.neighbor_name),
        clean(secondaryData.neighbor_phone),
        clean(secondaryData.favorite_teacher_name),
        clean(secondaryData.favorite_teacher_phone),
        applicantId
      ];

      await client.query(upsertSecondary, secondaryValues);
    }

    await client.query("COMMIT");
    return { success: true, applicantId };

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating applicant:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

// =========================================================
// 3. READ: VIEW APPLICANT BY REG NUMBER (With JOINS)
// =========================================================
async function viewApplicantByRegNumber(nmms_reg_number) {
  const query = `
    SELECT 
      p.*,
      state.juris_name AS state_name,
      dist.juris_name AS district_name,
      blk.juris_name AS block_name,
      s.village, s.father_occupation, s.mother_occupation, s.father_education, s.mother_education,
      s.household_size, s.own_house, s.smart_phone_home, s.internet_facility_home,
      s.career_goals, s.subjects_of_interest, s.transportation_mode, s.distance_to_school,
      s.num_two_wheelers, s.num_four_wheelers, s.irrigation_land,
      s.neighbor_name, s.neighbor_phone, s.favorite_teacher_name, s.favorite_teacher_phone
    FROM pp.applicant_primary_info p
    LEFT JOIN pp.applicant_secondary_info s ON p.applicant_id = s.applicant_id
    LEFT JOIN pp.jurisdiction state ON p.app_state = state.juris_code
    LEFT JOIN pp.jurisdiction dist ON p.district = dist.juris_code
    LEFT JOIN pp.jurisdiction blk ON p.nmms_block = blk.juris_code
    WHERE p.nmms_reg_number = $1
  `;
  const { rows } = await pool.query(query, [nmms_reg_number]);
  return rows[0] || null;
}

// =========================================================
// 4. GET APPLICANT BY ID
// =========================================================
async function getApplicantById(applicantId) {
  const query = `
    SELECT p.*, s.*
    FROM pp.applicant_primary_info p
    LEFT JOIN pp.applicant_secondary_info s ON p.applicant_id = s.applicant_id
    WHERE p.applicant_id = $1
  `;
  const { rows } = await pool.query(query, [applicantId]);
  return rows[0] || null;
}

// =========================================================
// 5. DELETE
// =========================================================
async function deleteApplicant(applicantId) {
  const { rows } = await pool.query(
    `DELETE FROM pp.applicant_primary_info WHERE applicant_id = $1 RETURNING applicant_id`,
    [applicantId]
  );
  return rows[0];
}

// =========================================================
// 6. GET ALL (Summary View)
// =========================================================
async function getAllApplicants() {
  const query = `
    SELECT 
      p.applicant_id,
      p.nmms_year,
      p.nmms_reg_number,
      p.student_name,
      p.father_name,
      p.gender,
      dist.juris_name as district_name,
      p.contact_no1,
      p.created_at
    FROM pp.applicant_primary_info p
    LEFT JOIN pp.jurisdiction dist ON p.district = dist.juris_code
    ORDER BY p.created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
  createApplicant,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  viewApplicantByRegNumber,
  getAllApplicants
};