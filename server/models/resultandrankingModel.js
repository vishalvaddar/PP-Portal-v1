const pool = require("../config/db");

// Location Models
async function getDivisionsByState(stateId) {
  const result = await pool.query(`
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'DIVISION'
      AND PARENT_JURIS = $1
    ORDER BY JURIS_NAME
  `, [stateId]);
  return result.rows;
}

async function getEducationDistrictsByDivision(divisionId) {
  const result = await pool.query(`
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'EDUCATION DISTRICT'
      AND PARENT_JURIS = $1
    ORDER BY JURIS_NAME
  `, [divisionId]);
  return result.rows;
}

async function getBlocksByDistrict(districtId) {
  const result = await pool.query(`
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'BLOCK'
      AND PARENT_JURIS = $1
    ORDER BY JURIS_NAME
  `, [districtId]);
  return result.rows;
}

// Exam Models
async function getAllExams() {
  const result = await pool.query(`
    SELECT 
      exam_id,
      exam_name,
      exam_date,
      exam_start_time,
      exam_end_time
    FROM pp.examination 
    ORDER BY exam_date DESC
  `);
  return result.rows;
}

// Search by Blocks Model
// Search by Blocks Model - Fixed jurisdiction relationships
async function searchStudentsByBlocks(division, education_district, blocks, app_state) {
  let query = `
    SELECT 
      api.applicant_id,
      api.nmms_reg_number,
      api.student_name,
      api.father_name,
      api.gmat_score,
      api.sat_score,
      api.contact_no1,
      api.current_institute_dise_code,
      api.medium,
      si.institute_name as school_name,
      er.pp_exam_score,
      er.pp_exam_cleared,
      si_interview.status as interview_status,
      si_interview.interview_result,
      si_interview.remarks as interview_remarks,
      hv.status as verification_status,
      hv.remarks as verification_remarks,
      rr.rejection_reason as rejection_reasons,
      div.juris_name as division_name,
      dist.juris_name as district_name,
      blk.juris_name as block_name
    FROM pp.applicant_primary_info api
    LEFT JOIN pp.institute si ON api.current_institute_dise_code = si.dise_code
    LEFT JOIN pp.exam_results er ON api.applicant_id = er.applicant_id
    LEFT JOIN pp.student_interview si_interview ON api.applicant_id = si_interview.applicant_id
    LEFT JOIN pp.home_verification hv ON api.applicant_id = hv.applicant_id
    LEFT JOIN pp.rejection_reasons rr ON hv.rejection_reason_id = rr.rej_reason_id
    LEFT JOIN pp.jurisdiction blk ON blk.juris_code = api.nmms_block
    LEFT JOIN pp.jurisdiction dist ON dist.juris_code = api.district
    LEFT JOIN pp.jurisdiction div ON div.juris_code = dist.parent_juris
    WHERE api.app_state = $1
  `;
  
  const params = [app_state];
  let paramCount = 1;

  console.log('Search params:', { division, education_district, blocks });

  if (division && division !== '') {
    paramCount++;
    query += ` AND dist.parent_juris = $${paramCount}`;
    params.push(division);
    console.log(`Adding division filter via parent_juris: ${division}`);
  }

  if (education_district && education_district !== '') {
    paramCount++;
    query += ` AND api.district = $${paramCount}`;
    params.push(education_district);
    console.log(`Adding education district filter: ${education_district}`);
  }

  if (blocks && blocks.length > 0) {
    paramCount++;
    query += ` AND api.nmms_block = ANY($${paramCount})`;
    params.push(blocks);
    console.log(`Adding blocks filter: ${blocks}`);
  }

  query += ` ORDER BY COALESCE(blk.juris_name, 'Unknown'), api.student_name`;

  // console.log('Final query:', query);
  console.log('Query params:', params);

  const result = await pool.query(query, params);
  console.log(`Found ${result.rows.length} students`);
  return result.rows;
}

// Search by Exam Model
async function searchStudentsByExam(exam_id) {
  const query = `
    SELECT 
      api.applicant_id,
      api.nmms_reg_number,
      api.student_name,
      api.father_name,
      api.gmat_score,
      api.sat_score,
      api.contact_no1,
      api.current_institute_dise_code,
      api.medium,
      si.institute_name as school_name,
      er.pp_exam_score,
      er.pp_exam_cleared,
      si_interview.status as interview_status,
      si_interview.interview_result,
      si_interview.remarks as interview_remarks,
      hv.status as verification_status,
      hv.remarks as verification_remarks,
      rr.rejection_reason as rejection_reasons,
      div.juris_name as division_name,
      dist.juris_name as district_name,
      blk.juris_name as block_name,
      e.exam_name,
      e.exam_date
    FROM pp.applicant_primary_info api
    INNER JOIN pp.applicant_exam ae ON api.applicant_id = ae.applicant_id
    LEFT JOIN pp.institute si ON api.current_institute_dise_code = si.dise_code
    LEFT JOIN pp.exam_results er ON api.applicant_id = er.applicant_id
    LEFT JOIN pp.student_interview si_interview ON api.applicant_id = si_interview.applicant_id
    LEFT JOIN pp.home_verification hv ON api.applicant_id = hv.applicant_id
    LEFT JOIN pp.rejection_reasons rr ON hv.rejection_reason_id = rr.rej_reason_id
    LEFT JOIN pp.jurisdiction div ON div.juris_code = api.district
    LEFT JOIN pp.jurisdiction dist ON dist.juris_code = api.district
    LEFT JOIN pp.jurisdiction blk ON blk.juris_code = api.nmms_block
    LEFT JOIN pp.examination e ON ae.exam_id = e.exam_id
    WHERE ae.exam_id = $1
    ORDER BY api.student_name
  `;
  
  const result = await pool.query(query, [exam_id]);
  return result.rows;
}

module.exports = {
  getBlocksByDistrict,
  getEducationDistrictsByDivision,
  getDivisionsByState,
  getAllExams,
  searchStudentsByBlocks,
  searchStudentsByExam
};