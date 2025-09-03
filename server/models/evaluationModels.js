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
            er.pp_exam_score,
            asi.village,
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
            aea.pp_exam_appeared_yn
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



async function insertBulkData(secondaryInfoData, examResultsData, examAttendance) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert/update secondary info
    for (const data of secondaryInfoData) {
      await client.query(`
        INSERT INTO pp.applicant_secondary_info (
          applicant_id, village, father_occupation, mother_occupation,
          father_education, mother_education, household_size, own_house,
          smart_phone_home, internet_facility_home, career_goals,
          subjects_of_interest, transportation_mode, distance_to_school,
          num_two_wheelers, num_four_wheelers, irrigation_land,
          neighbor_name, neighbor_phone, favorite_teacher_name,
          favorite_teacher_phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
        `, [
        data.applicant_id, data.village, data.father_occupation, data.mother_occupation,
        data.father_education, data.mother_education, data.household_size, data.own_house,
        data.smart_phone_home, data.internet_facility_home, data.career_goals,
        data.subjects_of_interest, data.transportation_mode, data.distance_to_school,
        data.num_two_wheelers, data.num_four_wheelers, data.irrigation_land,
        data.neighbor_name, data.neighbor_phone, data.favorite_teacher_name,
        data.favorite_teacher_phone
      ]);
    }

    // Insert/update exam results (removed student_name)
    for (const data of examResultsData) {
      await client.query(`
        INSERT INTO pp.exam_results (
          applicant_id, pp_exam_score
        ) VALUES ($1, $2)
        ON CONFLICT (applicant_id) DO UPDATE SET
          pp_exam_score = EXCLUDED.pp_exam_score
      `, [data.applicant_id, data.pp_exam_score]);
    }

    // Insert/update exam attendance
    for (const data of examAttendance) {
      await client.query(`
        INSERT INTO pp.applicant_exam_attendance (
          applicant_id, pp_exam_appeared_yn
        ) VALUES ($1, $2)
        ON CONFLICT (applicant_id) DO UPDATE SET
          pp_exam_appeared_yn = EXCLUDED.pp_exam_appeared_yn
      `, [data.applicant_id, data.pp_exam_appeared_yn]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database operation failed:', error);
    throw new Error('Failed to insert bulk data: ' + error.message);
  } finally {
    client.release();
  }
}

module.exports ={
  getExamNames,
  getStudents,
  insertBulkData
}