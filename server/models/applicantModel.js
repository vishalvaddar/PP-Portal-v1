const pool = require("../config/db");

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
      primaryData.created_by // Assumes controller adds this to primaryData
    ];

    const { rows } = await client.query(insertPrimary, primaryValues);
    if (!rows.length) throw new Error("Failed to insert primary info");
    
    const applicantId = rows[0].applicant_id;

    // --- B. Insert Secondary Info ---
    // Even if secondaryData is empty, we create a row to link the ID
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

    // Use default values if secondaryData fields are missing
    const sec = secondaryData || {};
    const secondaryValues = [
      applicantId,
      sec.village || null,
      sec.father_occupation || null,
      sec.mother_occupation || null,
      sec.father_education || null,
      sec.mother_education || null,
      sec.household_size || null,
      sec.own_house || null,
      sec.smart_phone_home || null,
      sec.internet_facility_home || null,
      sec.career_goals || null,
      sec.subjects_of_interest || null,
      sec.transportation_mode || null,
      sec.distance_to_school || null,
      sec.num_two_wheelers || 0,
      sec.num_four_wheelers || 0,
      sec.irrigation_land || 0,
      sec.neighbor_name || null,
      sec.neighbor_phone || null,
      sec.favorite_teacher_name || null,
      sec.favorite_teacher_phone || null,
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
          updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = $20
      `;

      const primaryValues = [
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
        applicantId
      ];

      await client.query(updatePrimary, primaryValues);
    }

    // --- B. Update Secondary Info ---
    if (secondaryData) {
      const updateSecondary = `
        UPDATE pp.applicant_secondary_info
        SET
          village = $1,
          father_occupation = $2,
          mother_occupation = $3,
          father_education = $4,
          mother_education = $5,
          household_size = $6,
          own_house = $7,
          smart_phone_home = $8,
          internet_facility_home = $9,
          career_goals = $10,
          subjects_of_interest = $11,
          transportation_mode = $12,
          distance_to_school = $13,
          num_two_wheelers = $14,
          num_four_wheelers = $15,
          irrigation_land = $16,
          neighbor_name = $17,
          neighbor_phone = $18,
          favorite_teacher_name = $19,
          favorite_teacher_phone = $20,
          updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = $21
      `;

      const secondaryValues = [
        secondaryData.village,
        secondaryData.father_occupation,
        secondaryData.mother_occupation,
        secondaryData.father_education,
        secondaryData.mother_education,
        secondaryData.household_size,
        secondaryData.own_house,
        secondaryData.smart_phone_home,
        secondaryData.internet_facility_home,
        secondaryData.career_goals,
        secondaryData.subjects_of_interest,
        secondaryData.transportation_mode,
        secondaryData.distance_to_school,
        secondaryData.num_two_wheelers,
        secondaryData.num_four_wheelers,
        secondaryData.irrigation_land,
        secondaryData.neighbor_name,
        secondaryData.neighbor_phone,
        secondaryData.favorite_teacher_name,
        secondaryData.favorite_teacher_phone,
        applicantId
      ];

      await client.query(updateSecondary, secondaryValues);
    }

    await client.query("COMMIT");
    return { success: true, applicantId };

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating applicant:", err);
    throw err;
  } finally {
    client.release();
  }
}

// =========================================================
// 3. READ: VIEW APPLICANT BY REG NUMBER (With JOINS)
// =========================================================
async function viewApplicantByRegNumber(nmms_reg_number) {
  // We join with Jurisdiction and Institute tables to get Names instead of just IDs
  // This helps the Frontend display "Karnataka" instead of "29"
  const query = `
    SELECT 
      p.*,
      -- Jurisdiction Names
      state.juris_name AS state_name,
      dist.juris_name AS district_name,
      blk.juris_name AS block_name,
      
      -- Secondary Info
      s.village,
      s.father_occupation,
      s.mother_occupation,
      s.father_education,
      s.mother_education,
      s.household_size,
      s.own_house,
      s.smart_phone_home,
      s.internet_facility_home,
      s.career_goals,
      s.subjects_of_interest,
      s.transportation_mode,
      s.distance_to_school,
      s.num_two_wheelers,
      s.num_four_wheelers,
      s.irrigation_land,
      s.neighbor_name,
      s.neighbor_phone,
      s.favorite_teacher_name,
      s.favorite_teacher_phone

    FROM pp.applicant_primary_info p
    LEFT JOIN pp.applicant_secondary_info s ON p.applicant_id = s.applicant_id
    
    -- Joins for Names
    LEFT JOIN pp.jurisdiction state ON p.app_state = state.juris_code
    LEFT JOIN pp.jurisdiction dist ON p.district = dist.juris_code
    LEFT JOIN pp.jurisdiction blk ON p.nmms_block = blk.juris_code
    
    WHERE p.nmms_reg_number = $1
  `;
  const { rows } = await pool.query(query, [nmms_reg_number]);
  return rows[0] || null;
}

// =========================================================
// 4. GET APPLICANT BY ID (Matches View Structure)
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