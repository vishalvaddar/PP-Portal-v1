const pool = require('../config/db');

async function getExamNames(){
    const result = await pool.query(
        `select exam_name from pp.examination 
        order by exam_id ASC`
    )
    return result.rows;
}

async function getStudents(exam_name) {
    const result = await pool.query(`
       SELECT 
            api.applicant_id,
            api.student_name,
            api.father_name,
            api.mother_name,
            asi.village,
            api.gender,
            api.aadhaar,
            api.dob,
            api.medium,
            api.home_address,
            api.family_income_total,
            asi.father_occupation,
            asi.mother_occupation,
            asi.father_education,
            asi.mother_education,
            asi.household_size,
            asi.own_house,
            asi.smart_phone_home,
            asi.internet_facility_home,
            asi.career_goals,
            asi.subjects_of_interest,
            asi.transportation_mode,
            asi.distance_to_school,
            asi.num_two_wheelers,
            asi.num_four_wheelers,
            asi.irrigation_land,
            asi.neighbor_name,
            asi.neighbor_phone,
            asi.favorite_teacher_name,
            asi.favorite_teacher_phone,
            aea.pp_exam_appeared_yn,
            er.pp_exam_score,
            er.pp_exam_cleared,
            er.interview_required_yn
        FROM 
            pp.examination ex
        LEFT JOIN 
            pp.applicant_exam ae ON ae.exam_id = ex.exam_id
        LEFT JOIN 
            pp.applicant_primary_info api ON api.applicant_id = ae.applicant_id
        LEFT JOIN 
            pp.applicant_secondary_info asi ON api.applicant_id = asi.applicant_id
        LEFT JOIN 
            pp.exam_results er ON asi.applicant_id = er.applicant_id 
        LEFT JOIN
            pp.applicant_exam_attendance aea ON aea.applicant_id = asi.applicant_id       
        WHERE 
            ex.exam_name = $1`, [exam_name]
    );
    return result.rows;
}

async function insertBulkData(
  primaryInfoUpdates,
  secondaryInfoData,
  examResultsData,
  examAttendanceData,
  eligibleStudents
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ---------- Enrollment ID Generator ----------
    const generateEnrId = async () => {
      const year = new Date().getFullYear() % 100;
const baseNumber = year * 10000 + 1;


      const { rows } = await client.query(
        `SELECT MAX(enr_id) AS max_enr_id
         FROM pp.student_master
         WHERE enr_id >= $1 AND enr_id < $2`,
        [baseNumber, (year + 1) * 10000]
      );

      return rows[0].max_enr_id
        ? rows[0].max_enr_id + 1
        : baseNumber;
    };

    // ---------- Update applicant_primary_info ----------
    for (const p of primaryInfoUpdates) {
      await client.query(
        `
        UPDATE pp.applicant_primary_info
        SET
          father_name = COALESCE($2, father_name),
          mother_name = COALESCE($3, mother_name),
          gender = COALESCE($4, gender),
          medium = COALESCE($5, medium),
          aadhaar = COALESCE($6, aadhaar),
          dob = COALESCE($7, dob),
          home_address = COALESCE($8, home_address),
          family_income_total = COALESCE($9, family_income_total)
        WHERE applicant_id = $1
        `,
        [
          p.applicant_id,
          p.father_name,
          p.mother_name,
          p.gender,
          p.medium,
          p.aadhaar,
          p.dob,
          p.home_address,
          p.family_income_total
        ]
      );
    }

    // ---------- applicant_secondary_info ----------
    for (const d of secondaryInfoData) {
      await client.query(
        `
        INSERT INTO pp.applicant_secondary_info (
          applicant_id, village, father_occupation, mother_occupation,
          father_education, mother_education, household_size,
          own_house, smart_phone_home, internet_facility_home,
          career_goals, subjects_of_interest, transportation_mode,
          distance_to_school, num_two_wheelers, num_four_wheelers,
          irrigation_land, neighbor_name, neighbor_phone,
          favorite_teacher_name, favorite_teacher_phone
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
        )
        ON CONFLICT (applicant_id) DO UPDATE SET
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
          favorite_teacher_phone = EXCLUDED.favorite_teacher_phone
        `,
        [
          d.applicant_id,
          d.village,
          d.father_occupation,
          d.mother_occupation,
          d.father_education,
          d.mother_education,
          d.household_size,
          d.own_house,
          d.smart_phone_home,
          d.internet_facility_home,
          d.career_goals,
          d.subjects_of_interest,
          d.transportation_mode,
          d.distance_to_school,
          d.num_two_wheelers,
          d.num_four_wheelers,
          d.irrigation_land,
          d.neighbor_name,
          d.neighbor_phone,
          d.favorite_teacher_name,
          d.favorite_teacher_phone
        ]
      );
    }

    // ---------- exam_results ----------
    for (const e of examResultsData) {
      await client.query(
        `
        INSERT INTO pp.exam_results (
          applicant_id, pp_exam_score, pp_exam_cleared, interview_required_yn
        )
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (applicant_id) DO UPDATE SET
          pp_exam_score = EXCLUDED.pp_exam_score,
          pp_exam_cleared = EXCLUDED.pp_exam_cleared,
          interview_required_yn = EXCLUDED.interview_required_yn
        `,
        [
          e.applicant_id,
          e.pp_exam_score,
          e.pp_exam_cleared,
          e.interview_required_yn
        ]
      );
    }

    // ---------- exam_attendance ----------
    for (const a of examAttendanceData) {
      await client.query(
        `
        INSERT INTO pp.applicant_exam_attendance (
          applicant_id, pp_exam_appeared_yn
        )
        VALUES ($1,$2)
        ON CONFLICT (applicant_id) DO UPDATE SET
          pp_exam_appeared_yn = EXCLUDED.pp_exam_appeared_yn
        `,
        [a.applicant_id, a.pp_exam_appeared_yn]
      );
    }

    // ---------- student_master ----------
 // ---------- student_master ----------
let nextEnrId = await generateEnrId();  // 🔥 generate once

for (const s of eligibleStudents) {

  const { rows } = await client.query(
    `SELECT contact_no1, contact_no2,
            current_institute_dise_code,
            previous_institute_dise_code
     FROM pp.applicant_primary_info
     WHERE applicant_id = $1`,
    [s.applicant_id]
  );

  if (!rows.length) continue;

  // Prevent duplicate insert
  const exists = await client.query(
    `SELECT 1 FROM pp.student_master WHERE applicant_id = $1`,
    [s.applicant_id]
  );
  if (exists.rowCount) continue;

  const enrId = nextEnrId++;   // ✅ SAFE
  const p = rows[0];

  await client.query(
    `
    INSERT INTO pp.student_master (
      applicant_id, enr_id, student_name,
      father_name, mother_name, gender,
      father_occupation, mother_occupation,
      home_address, contact_no1, contact_no2,
      current_institute_dise_code,
      previous_institute_dise_code,
      teacher_name, teacher_mobile_number,
      created_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,
      CURRENT_TIMESTAMP
    )
    `,
    [
      s.applicant_id,
      enrId,
      s.student_name,
      s.father_name,
      s.mother_name,
      s.gender,
      s.father_occupation,
      s.mother_occupation,
      s.home_address,
      p.contact_no1,
      p.contact_no2,
      p.current_institute_dise_code,
      p.previous_institute_dise_code,
      s.teacher_name,
      s.teacher_mobile_number
    ]
  );
}

    await client.query('COMMIT');

    return {
      primaryInfoUpdated: primaryInfoUpdates.length,
      secondaryInfoCount: secondaryInfoData.length,
      examResultsCount: examResultsData.length,
      examAttendanceCount: examAttendanceData.length,
      eligibleStudentsCount: eligibleStudents.length
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error('Failed to insert bulk data: ' + err.message);
  } finally {
    client.release();
  }
}


module.exports ={
  getExamNames,
  getStudents,
  insertBulkData
}