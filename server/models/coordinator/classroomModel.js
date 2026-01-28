// server/models/coordinator/classroomModel.js
const pool = require("../../config/db");

// const getClassroomsByBatch = async (batchId) => {
//   const result = await pool.query(
//     `SELECT c.classroom_id, c.classroom_name
//      FROM pp.classroom c
//      JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
//      WHERE cb.batch_id = $1
//        AND c.active_yn = 'Y'
//      ORDER BY c.classroom_name`,
//     [batchId]
//   );
//   return result.rows || [];
// };

const getClassroomsByBatch = async (batchId) => {
  const result = await pool.query(
    `SELECT 
        c.classroom_id, 
        c.classroom_name, 
        c.class_link  -- Added this column so frontend can fetch it
     FROM pp.classroom c
     JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
     WHERE cb.batch_id = $1
       AND c.active_yn = 'Y'
     ORDER BY c.classroom_name`,
    [batchId]
  );
  return result.rows || [];
};

const getAllClassrooms = async () => {
  const result = await pool.query(
    `SELECT classroom_id, classroom_name, description, active_yn
     FROM pp.classroom
     ORDER BY classroom_name`
  );
  return result.rows || [];
};

const createClassroom = async (data) => {
  const {
    classroom_name,
    subject_id,
    teacher_id,
    platform_id,
    class_link,
    active_yn,
    created_by,
    updated_by,
  } = data;

  const result = await pool.query(
    `INSERT INTO pp.classroom
     (classroom_name, subject_id, teacher_id, platform_id, class_link, active_yn, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING classroom_id`,
    [
      classroom_name,
      subject_id,
      teacher_id,
      platform_id,
      class_link,
      active_yn,
      created_by,
      updated_by,
    ]
  );
  return result.rows[0];
}
const getTeachers = async () => {
  const result = await pool.query(
    `SELECT teacher_name
     FROM pp.teacher`
  );
  return result.rows || [];
};

const getPlatforms = async () => {
  const result = await pool.query(
    `SELECT platform_id, platform_name
     FROM pp.teaching_platform
     ORDER BY platform_name`
  );
  return result.rows || [];
};


module.exports = { getClassroomsByBatch, getAllClassrooms, createClassroom, getTeachers, getPlatforms };