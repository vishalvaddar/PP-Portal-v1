const { get } = require("mongoose");
const pool = require("../config/db");
/**
 * FETCH TEACHERS BY SUBJECT
 * Joins teacher -> user (for name) via the junction table teacher_subject
 */
const getTeachersBySubject = async (subjectId) => {
  const result = await pool.query(
    `SELECT 
        t.teacher_id, 
        u.user_name AS teacher_name
     FROM pp.teacher t
     JOIN pp.user u ON t.user_id = u.user_id
     JOIN pp.teacher_subject ts ON t.teacher_id = ts.teacher_id
     WHERE ts.subject_id = $1
     ORDER BY u.user_name`,
    [subjectId]
  );
  return result.rows || [];
};

/**
 * CREATE CLASSROOM (Transactional)
 * Logic includes linking the classroom to the selected batch
 */
const createClassroom = async (data) => {
  const {
    classroom_name, // Generated on frontend (e.g., ARS09-MAHAJAN-B8)
    subject_id,
    teacher_id,
    platform_id,
    class_link,
    active_yn,
    created_by,
    updated_by,
    batch_id
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert into pp.classroom
    const classRes = await client.query(
      `INSERT INTO pp.classroom
       (classroom_name, subject_id, teacher_id, platform_id, class_link, active_yn, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING classroom_id`,
      [classroom_name, subject_id, teacher_id, platform_id, class_link, active_yn, created_by, updated_by]
    );

    const newClassroomId = classRes.rows[0].classroom_id;

    // 2. Insert into pp.classroom_batch junction table
    await client.query(
      `INSERT INTO pp.classroom_batch (classroom_id, batch_id) VALUES ($1, $2)`,
      [newClassroomId, batch_id]
    );

    await client.query('COMMIT');
    return { classroom_id: newClassroomId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * GET ALL CLASSROOMS
 * Updated to join multiple tables so the UI gets names instead of just IDs
 */
const getClassrooms = async () => {
  const result = await pool.query(
    `SELECT distinct on (c.classroom_id)
        c.classroom_id, c.classroom_name, c.class_link, c.active_yn, c.description,
        s.subject_name, s.subject_code,
        u.user_name AS teacher_name, 
        p.platform_name,
        cb.batch_id
     FROM pp.classroom c
     LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
     LEFT JOIN pp.teacher t ON c.teacher_id = t.teacher_id
     LEFT JOIN pp.user u ON t.user_id = u.user_id
     LEFT JOIN pp.teaching_platform p ON c.platform_id = p.platform_id
     LEFT JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
     ORDER BY 
	 	 c.classroom_id,
		 c.created_at DESC`
  );
  return result.rows || [];
};

const getSubjects = async () => {
  const res = await pool.query(
    `SELECT subject_id, subject_name, subject_code FROM pp.subject ORDER BY subject_name`
  );
  return res.rows;
};

const getTeachingPlatforms = async () => {
  const result = await pool.query(
    `SELECT platform_id, platform_name FROM pp.teaching_platform ORDER BY platform_name`
  );
  return result.rows || [];
};

const updateClassroom = async (classroomId, data) => {
    const {
        classroom_name,
        subject_id,
        teacher_id,
        platform_id,
        class_link,
        active_yn,
        updated_by
    } = data;
    const result = await pool.query(
        `UPDATE pp.classroom
            SET classroom_name = $1,
                subject_id = $2,
                teacher_id = $3,
                platform_id = $4,
                class_link = $5,
                active_yn = $6,
                updated_by = $7,
                updated_at = NOW()
            WHERE classroom_id = $8
            RETURNING classroom_id`,
        [
            classroom_name,
            subject_id,
            teacher_id,
            platform_id,
            class_link,
            active_yn,
            updated_by,
            classroomId
        ]
    );
    return result.rows[0];
};

const deleteClassroom = async (classroomId) => {
    const result = await pool.query(
        `DELETE FROM pp.classroom
            WHERE classroom_id = $1
            RETURNING classroom_id`,
        [classroomId]
    );
    return result.rows[0];
};

const getBatchesByCohort = async (cohort_number) => {
    const result = await pool.query(
        `SELECT batch_id, batch_name FROM pp.batch WHERE cohort_number = $1 ORDER BY batch_name`,
        [cohort_number]
    );
    return result.rows || [];
};


module.exports = {
  getTeachersBySubject,
  createClassroom,
  getClassrooms,
  getSubjects,
  getBatchesByCohort,
  getTeachingPlatforms,
  updateClassroom,
  deleteClassroom
};
