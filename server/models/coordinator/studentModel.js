// const pool = require('../../config/db');

// // Fetch all students in a specific cohort
// const getStudentsByCohort = async (cohortNumber) => {
//   const query = `
//     SELECT 
//       sm.student_id,
//       sm.student_name,
//       sm.enr_id,
//       sm.contact_no1,
//       sm.contact_no2,
//       sm.parent_email,
//       sm.student_email,
//       sm.active_yn,
//       b.batch_name,
//       c.cohort_name,
//       c.cohort_number
//     FROM pp.student_master sm
//     JOIN pp.batch b ON sm.batch_id = b.batch_id
//     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
//     WHERE c.cohort_number = $1
//     ORDER BY sm.student_id;
//   `;
//   const result = await pool.query(query, [cohortNumber]);
//   return result.rows;
// };

const pool = require('../../config/db');

const getStudentsByCohortAndBatch = async (cohortNumber, batchId) => {
  const query = `
    SELECT 
      sm.student_id,
      sm.student_name,
      sm.enr_id,
      sm.contact_no1,
      sm.contact_no2,
      sm.parent_email,
      sm.student_email,
      sm.active_yn,
      b.batch_name,
      c.cohort_name,
      c.cohort_number
    FROM pp.student_master sm
    JOIN pp.batch b ON sm.batch_id = b.batch_id
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    WHERE c.cohort_number = $1 AND b.batch_id = $2
    ORDER BY sm.student_id;
  `;
  const result = await pool.query(query, [cohortNumber, batchId]);
  return result.rows;
};

const getAllStudents = async () => {
  const query = `
    SELECT 
      sm.student_id,
      sm.student_name,
      sm.enr_id,
      sm.contact_no1,
      sm.contact_no2,
      sm.parent_email,
      sm.student_email,
      sm.active_yn,
      b.batch_name,
      c.cohort_name,
      c.cohort_number
    FROM pp.student_master sm
    JOIN pp.batch b ON sm.batch_id = b.batch_id
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    ORDER BY sm.student_id;
  `;
  const result = await pool.query(query);
  return result.rows;
};

module.exports = { getStudentsByCohortAndBatch, getAllStudents };
