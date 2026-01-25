// // // // const pool = require('../../config/db');

// // // // // Fetch all students in a specific cohort
// // // // const getStudentsByCohort = async (cohortNumber) => {
// // // //   const query = `
// // // //     SELECT 
// // // //       sm.student_id,
// // // //       sm.student_name,
// // // //       sm.enr_id,
// // // //       sm.contact_no1,
// // // //       sm.contact_no2,
// // // //       sm.parent_email,
// // // //       sm.student_email,
// // // //       sm.active_yn,
// // // //       b.batch_name,
// // // //       c.cohort_name,
// // // //       c.cohort_number
// // // //     FROM pp.student_master sm
// // // //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// // // //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// // // //     WHERE c.cohort_number = $1
// // // //     ORDER BY sm.student_id;
// // // //   `;
// // // //   const result = await pool.query(query, [cohortNumber]);
// // // //   return result.rows;
// // // // };

// // // const pool = require('../../config/db');

// // // const getStudentsByCohortAndBatch = async (cohortNumber, batchId) => {
// // //   const query = `
// // //     SELECT 
// // //       sm.student_id,
// // //       sm.student_name,
// // //       sm.enr_id,
// // //       sm.contact_no1,
// // //       sm.contact_no2,
// // //       sm.parent_email,
// // //       sm.student_email,
// // //       sm.active_yn,
// // //       b.batch_name,
// // //       c.cohort_name,
// // //       c.cohort_number
// // //     FROM pp.student_master sm
// // //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// // //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// // //     WHERE c.cohort_number = $1 AND b.batch_id = $2
// // //     ORDER BY sm.student_id;
// // //   `;
// // //   const result = await pool.query(query, [cohortNumber, batchId]);
// // //   return result.rows;
// // // };

// // // const getAllStudents = async () => {
// // //   const query = `
// // //     SELECT 
// // //       sm.student_id,
// // //       sm.student_name,
// // //       sm.enr_id,
// // //       sm.contact_no1,
// // //       sm.contact_no2,
// // //       sm.parent_email,
// // //       sm.student_email,
// // //       sm.active_yn,
// // //       b.batch_name,
// // //       c.cohort_name,
// // //       c.cohort_number
// // //     FROM pp.student_master sm
// // //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// // //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// // //     ORDER BY sm.student_id;
// // //   `;
// // //   const result = await pool.query(query);
// // //   return result.rows;
// // // };

// // // const getStudentsByCoordinator = async (user_id) => {
// // //   const query = `
// // //     SELECT 
// // //       sm.student_id,
// // //       sm.student_name,
// // //       sm.enr_id,
// // //       sm.contact_no1,
// // //       sm.contact_no2,
// // //       sm.parent_email,
// // //       sm.student_email,
// // //       sm.active_yn,
// // //       b.batch_name,
// // //       c.cohort_name,
// // //       c.cohort_number
// // //     FROM pp.student_master sm
// // //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// // //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// // //     JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id
// // //     WHERE bcb.user_id = $1
// // //     ORDER BY sm.student_id;
// // //   `;
  
// // //   const { rows } = await pool.query(query, [user_id]);
// // //   return rows;
// // // };

 
// // // module.exports = { getStudentsByCohortAndBatch, getAllStudents , getStudentsByCoordinator };

// // const pool = require('../../config/db');

// // /* ===========================================================
// //    1) FETCH STUDENTS BY COHORT + BATCH
// //    =========================================================== */
// // const getStudentsByCohortAndBatch = async (cohortNumber, batchId) => {
// //   const query = `
// //     SELECT 
// //       sm.student_id,
// //       sm.student_name,
// //       sm.enr_id,
// //       sm.contact_no1,
// //       sm.contact_no2,
// //       sm.parent_email,
// //       sm.student_email,
// //       sm.active_yn,
// //       b.batch_name,
// //       c.cohort_name,
// //       c.cohort_number
// //     FROM pp.student_master sm
// //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// //     WHERE c.cohort_number = $1 AND b.batch_id = $2
// //     ORDER BY sm.student_id;
// //   `;
// //   const result = await pool.query(query, [cohortNumber, batchId]);
// //   return result.rows;
// // };

// // /* ===========================================================
// //    2) FETCH STUDENTS ASSIGNED TO A COORDINATOR
// //    =========================================================== */
// // const getStudentsByCoordinator = async (user_id) => {
// //   const query = `
// //     SELECT 
// //       sm.student_id,
// //       sm.student_name,
// //       sm.enr_id,
// //       sm.contact_no1,
// //       sm.contact_no2,
// //       sm.parent_email,
// //       sm.student_email,
// //       sm.active_yn,
// //       b.batch_name,
// //       c.cohort_name,
// //       c.cohort_number
// //     FROM pp.student_master sm
// //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// //     JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id
// //     WHERE bcb.user_id = $1
// //     ORDER BY sm.student_id;
// //   `;
// //   const result = await pool.query(query, [user_id]);
// //   return result.rows;
// // };

// // /* ===========================================================
// //    3) UPDATE STUDENT (GENERAL EDIT)
// //    =========================================================== */
// // const updateStudentModel = async (id, payload) => {
// //   // Prevent updating inactive_reason inside main table
// //   if ("inactive_reason" in payload) {
// //     delete payload.inactive_reason;
// //   }

// //   // Normalize ACTIVE/INACTIVE so DB constraint does not break
// //   if (payload.active_yn) {
// //     payload.active_yn = payload.active_yn.toUpperCase();
// //   }

// //   const fields = Object.keys(payload)
// //     .map((k, i) => `${k} = $${i + 1}`)
// //     .join(", ");

// //   const values = Object.values(payload);

// //   const sql = `
// //     UPDATE pp.student_master
// //     SET ${fields}
// //     WHERE student_id = $${values.length + 1}
// //   `;

// //   await pool.query(sql, [...values, id]);
// // };

// // /* ===========================================================
// //    4) MARK STUDENT INACTIVE + STORE HISTORY
// //    =========================================================== */
// // const markStudentInactiveModel = async (student_id, reason, user_id) => {
// //   // Insert into inactive_students (history log)
// //   await pool.query(
// //     `
// //     INSERT INTO pp.inactive_students
// //       (student_id, inactive_reason, inactive_date, created_by, updated_by)
// //     VALUES
// //       ($1, $2, CURRENT_DATE, $3, $3)
// //     `,
// //     [student_id, reason, user_id]
// //   );

// //   // Update the master record (active_yn only)
// //   await pool.query(
// //     `
// //     UPDATE pp.student_master
// //     SET active_yn = 'INACTIVE'
// //     WHERE student_id = $1
// //     `,
// //     [student_id]
// //   );
// // };

// // /* ===========================================================
// //    5) FETCH INACTIVE HISTORY (LOGS)
// //    =========================================================== */
// // const getInactiveHistoryByStudentId = async (student_id) => {
// //   const sql = `
// //     SELECT 
// //       inactive_reason,
// //       inactive_date,
// //       created_by,
// //       updated_by
// //     FROM pp.inactive_students
// //     WHERE student_id = $1
// //     ORDER BY inactive_date DESC
// //   `;
// //   const result = await pool.query(sql, [student_id]);
// //   return result.rows;
// // };

// // module.exports = {
// //   getStudentsByCohortAndBatch,
// //   getStudentsByCoordinator,
// //   updateStudentModel,
// //   markStudentInactiveModel,
// //   getInactiveHistoryByStudentId,
// // };



// const pool = require("../../config/db");

// /* ===========================================================
//    COMMON STUDENT SELECT (USED EVERYWHERE)
//    =========================================================== */
// const STUDENT_SELECT = `
//   sm.student_id,
//   sm.applicant_id,
//   sm.enr_id,
//   sm.student_name,
//   sm.gender,

//   sm.father_name,
//   sm.father_occupation,
//   sm.mother_name,
//   sm.mother_occupation,

//   sm.student_email,
//   sm.student_email_password,
//   sm.parent_email,

//   sm.contact_no1,
//   sm.contact_no2,
//   sm.home_address,

//   sm.current_institute_dise_code AS current_institute,
//   sm.previous_institute_dise_code AS previous_institute,
//   sm.sim_name,

//   sm.teacher_name,
//   sm.teacher_mobile_number,

//   sm.active_yn,
//   sm.recharge_status,
//   sm.sponsor,

//   sm.photo_link,

//   sm.batch_id,
//   b.batch_name,

//   c.cohort_number,
//   c.cohort_name
// `;

// /* ===========================================================
//    1) FETCH STUDENTS BY COHORT + BATCH
//    =========================================================== */
// const getStudentsByCohortAndBatch = async (cohortNumber, batchId) => {
//   const sql = `
//     SELECT ${STUDENT_SELECT}
//     FROM pp.student_master sm
//     JOIN pp.batch b 
//       ON sm.batch_id = b.batch_id
//     JOIN pp.cohort c 
//       ON b.cohort_number = c.cohort_number
//     WHERE c.cohort_number = $1
//       AND b.batch_id = $2
//     ORDER BY sm.student_id;
//   `;

//   const { rows } = await pool.query(sql, [cohortNumber, batchId]);
//   return rows;
// };

// /* ===========================================================
//    2) FETCH STUDENTS ASSIGNED TO A COORDINATOR
//    =========================================================== */
// const getStudentsByCoordinator = async (user_id) => {
//   const sql = `
//     SELECT ${STUDENT_SELECT}
//     FROM pp.student_master sm
//     JOIN pp.batch b 
//       ON sm.batch_id = b.batch_id
//     JOIN pp.cohort c 
//       ON b.cohort_number = c.cohort_number
//     JOIN pp.batch_coordinator_batches bcb
//       ON b.batch_id = bcb.batch_id
//     WHERE bcb.user_id = $1
//     ORDER BY sm.student_id;
//   `;

//   const { rows } = await pool.query(sql, [user_id]);
//   return rows;
// };

// /* ===========================================================
//    3) UPDATE STUDENT (GENERAL EDIT)
//    =========================================================== */
// const updateStudentModel = async (student_id, payload) => {
//   // inactive_reason is stored in history table
//   if ("inactive_reason" in payload) {
//     delete payload.inactive_reason;
//   }

//   // Normalize ACTIVE / INACTIVE
//   if (payload.active_yn) {
//     payload.active_yn = payload.active_yn.toUpperCase();
//   }

//   const fields = Object.keys(payload)
//     .map((key, index) => `${key} = $${index + 1}`)
//     .join(", ");

//   const values = Object.values(payload);

//   const sql = `
//     UPDATE pp.student_master
//     SET ${fields},
//         updated_at = CURRENT_TIMESTAMP
//     WHERE student_id = $${values.length + 1};
//   `;

//   await pool.query(sql, [...values, student_id]);
// };

// /* ===========================================================
//    4) MARK STUDENT INACTIVE + LOG HISTORY
//    =========================================================== */
// const markStudentInactiveModel = async (student_id, reason, user_id) => {
//   // Log inactive history
//   await pool.query(
//     `
//     INSERT INTO pp.inactive_students
//       (student_id, inactive_reason, inactive_date, created_by, updated_by)
//     VALUES
//       ($1, $2, CURRENT_DATE, $3, $3);
//     `,
//     [student_id, reason, user_id]
//   );

//   // Update master record
//   await pool.query(
//     `
//     UPDATE pp.student_master
//     SET active_yn = 'INACTIVE',
//         updated_at = CURRENT_TIMESTAMP
//     WHERE student_id = $1;
//     `,
//     [student_id]
//   );
// };

// /* ===========================================================
//    5) FETCH INACTIVE HISTORY (FOR PROFILE VIEW)
//    =========================================================== */
// const getInactiveHistoryByStudentId = async (student_id) => {
//   const sql = `
//     SELECT
//       inactive_reason,
//       inactive_date,
//       created_by,
//       updated_by
//     FROM pp.inactive_students
//     WHERE student_id = $1
//     ORDER BY inactive_date DESC;
//   `;

//   const { rows } = await pool.query(sql, [student_id]);
//   return rows;
// };

// /* ===========================================================
//    EXPORTS
//    =========================================================== */
// module.exports = {
//   getStudentsByCohortAndBatch,
//   getStudentsByCoordinator,
//   updateStudentModel,
//   markStudentInactiveModel,
//   getInactiveHistoryByStudentId,
// };


const pool = require("../../config/db");

/* ===========================================================
   COMMON STUDENT SELECT (USED EVERYWHERE)
   =========================================================== */
const STUDENT_SELECT = `
  sm.student_id,
  sm.applicant_id,
  sm.enr_id,
  sm.student_name,
  sm.gender,

  sm.father_name,
  sm.father_occupation,
  sm.mother_name,
  sm.mother_occupation,

  sm.student_email,
  sm.student_email_password,
  sm.parent_email,

  sm.contact_no1,
  sm.contact_no2,
  sm.home_address,

  /* keep DISE codes for edit */
  sm.current_institute_dise_code,
  sm.previous_institute_dise_code,

  /* institute names for display */
  ci.institute_name AS current_institute,
  pi.institute_name AS previous_institute,

  sm.sim_name,

  sm.teacher_name,
  sm.teacher_mobile_number,

  sm.active_yn,
  sm.recharge_status,
  sm.sponsor,

  sm.photo_link,

  sm.batch_id,
  b.batch_name,

  c.cohort_number,
  c.cohort_name,

  ins.inactive_reason,

  sm.created_at,
  sm.updated_at
`;

/* ===========================================================
   1) FETCH STUDENTS BY COHORT + BATCH
   =========================================================== */
const getStudentsByCohortAndBatch = async (cohortNumber, batchId) => {
  const sql = `
    SELECT ${STUDENT_SELECT}
    FROM pp.student_master sm

    JOIN pp.batch b
      ON sm.batch_id = b.batch_id

    JOIN pp.cohort c
      ON b.cohort_number = c.cohort_number

    LEFT JOIN pp.institute ci
      ON ci.dise_code = sm.current_institute_dise_code

    LEFT JOIN pp.institute pi
      ON pi.dise_code = sm.previous_institute_dise_code

    LEFT JOIN pp.inactive_students ins
      ON ins.student_id = sm.student_id
     AND sm.active_yn = 'INACTIVE'

    WHERE c.cohort_number = $1
      AND b.batch_id = $2

    ORDER BY sm.student_name;
  `;

  const { rows } = await pool.query(sql, [cohortNumber, batchId]);
  return rows;
};

/* ===========================================================
   2) FETCH STUDENTS ASSIGNED TO A COORDINATOR
   =========================================================== */
const getStudentsByCoordinator = async (user_id) => {
  const sql = `
    SELECT ${STUDENT_SELECT}
    FROM pp.student_master sm

    JOIN pp.batch b
      ON sm.batch_id = b.batch_id

    JOIN pp.cohort c
      ON b.cohort_number = c.cohort_number

    JOIN pp.batch_coordinator_batches bcb
      ON b.batch_id = bcb.batch_id

    LEFT JOIN pp.institute ci
      ON ci.dise_code = sm.current_institute_dise_code

    LEFT JOIN pp.institute pi
      ON pi.dise_code = sm.previous_institute_dise_code

    LEFT JOIN pp.inactive_students ins
      ON ins.student_id = sm.student_id
     AND sm.active_yn = 'INACTIVE'

    WHERE bcb.user_id = $1

    ORDER BY sm.student_name;
  `;

  const { rows } = await pool.query(sql, [user_id]);
  return rows;
};

/* ===========================================================
   3) UPDATE STUDENT (GENERAL EDIT)
   =========================================================== */
const updateStudentModel = async (student_id, payload) => {
  // inactive_reason is stored only in history table
  if ("inactive_reason" in payload) {
    delete payload.inactive_reason;
  }

  // Normalize ACTIVE / INACTIVE
  if (payload.active_yn) {
    payload.active_yn = payload.active_yn.toUpperCase();
  }

  if (!Object.keys(payload).length) return;

  const fields = Object.keys(payload)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const values = Object.values(payload);

  const sql = `
    UPDATE pp.student_master
    SET ${fields},
        updated_at = CURRENT_TIMESTAMP
    WHERE student_id = $${values.length + 1};
  `;

  await pool.query(sql, [...values, student_id]);
};

/* ===========================================================
   4) MARK STUDENT INACTIVE + LOG HISTORY
   =========================================================== */
const markStudentInactiveModel = async (student_id, reason, user_id) => {
  // Log inactive history
  await pool.query(
    `
    INSERT INTO pp.inactive_students
      (student_id, inactive_reason, inactive_date, created_by, updated_by)
    VALUES
      ($1, $2, CURRENT_DATE, $3, $3);
    `,
    [student_id, reason, user_id]
  );

  // Update master record
  await pool.query(
    `
    UPDATE pp.student_master
    SET active_yn = 'INACTIVE',
        updated_at = CURRENT_TIMESTAMP
    WHERE student_id = $1;
    `,
    [student_id]
  );
};

/* ===========================================================
   5) FETCH INACTIVE HISTORY (FOR PROFILE VIEW)
   =========================================================== */
const getInactiveHistoryByStudentId = async (student_id) => {
  const sql = `
    SELECT
      inactive_reason,
      inactive_date,
      created_by,
      updated_by
    FROM pp.inactive_students
    WHERE student_id = $1
    ORDER BY inactive_date DESC;
  `;

  const { rows } = await pool.query(sql, [student_id]);
  return rows;
};




// /* ===========================================================
//    ATTENDANCE ONLY: FETCH ACTIVE STUDENTS
//    =========================================================== */
// const getActiveStudentsForAttendance = async (cohortNumber, batchId, classroomId) => {
//   const sql = `
//     SELECT
//       sm.student_id,
//       sm.enr_id,
//       sm.student_name,
//       sm.father_name,
//       sm.contact_no1,
//       sm.student_email,
//       sm.batch_id
//     FROM pp.student_master sm
//     JOIN pp.batch b
//       ON sm.batch_id = b.batch_id
//     JOIN pp.cohort c
//       ON b.cohort_number = c.cohort_number
//     WHERE c.cohort_number = $1
//       AND b.batch_id = $2
//       AND sm.active_yn = 'ACTIVE'
//     ORDER BY sm.student_name;
//   `;

//   const { rows } = await pool.query(sql, [cohortNumber, batchId]);
//   return rows;
// };


const getActiveStudentsForAttendance = async (cohortNumber, batchId) => {
  const sql = `
    SELECT 
      sm.student_id, sm.enr_id, sm.student_name, 
      sm.contact_no1, sm.student_email, sm.batch_id, sm.active_yn
    FROM pp.student_master sm
    JOIN pp.batch b ON sm.batch_id = b.batch_id
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    WHERE c.cohort_number = $1 
      AND b.batch_id = $2
      AND sm.active_yn = 'ACTIVE'  -- ✅ Strictly Active
    ORDER BY sm.student_name;
  `;
  const { rows } = await pool.query(sql, [cohortNumber, batchId]);
  return rows;
};

/* ===========================================================
   EXPORTS
   =========================================================== */
module.exports = {
  getStudentsByCohortAndBatch,
  getStudentsByCoordinator,
  updateStudentModel,
  markStudentInactiveModel,
  getInactiveHistoryByStudentId,
  getActiveStudentsForAttendance,   // ✅ NEW
};
