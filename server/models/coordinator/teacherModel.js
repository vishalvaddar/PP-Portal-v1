const pool = require("../../config/db");

/**
 * Fetch all active teachers with their assigned subjects
 * Includes teacher_id, teacher_name, contact number, and subjects list
 * 
 * 
 */

async function getTeachersByCoordinator(coordinator_id) {
  const query = `
    SELECT 
      DISTINCT t.teacher_id,
      t.teacher_name,
      t.contact_no,
      COALESCE(STRING_AGG(DISTINCT s.subject_name, ', ' ORDER BY s.subject_name), 'No Subjects') AS subjects
    FROM pp.teacher t
    JOIN pp.classroom c ON c.teacher_id = t.teacher_id
    JOIN pp.subject s ON s.subject_id = c.subject_id
    JOIN pp.classroom_batch cb ON cb.classroom_id = c.classroom_id
    JOIN pp.batch b ON b.batch_id = cb.batch_id
    WHERE b.coordinator_id = $1
    GROUP BY t.teacher_id, t.teacher_name, t.contact_no
    ORDER BY t.teacher_name;
  `;
  const { rows } = await pool.query(query, [coordinator_id]);
  return rows;
}


async function getAllTeachers() {
  const query = `
    SELECT 
      t.teacher_id,
      t.teacher_name,
      t.contact_no,
      COALESCE(STRING_AGG(s.subject_name, ', ' ORDER BY s.subject_name), 'No Subjects') AS subjects
    FROM pp.teacher t
    LEFT JOIN pp.teacher_subject ts ON t.teacher_id = ts.teacher_id
    LEFT JOIN pp.subject s ON ts.subject_id = s.subject_id
    GROUP BY t.teacher_id, t.teacher_name, t.contact_no
    ORDER BY t.teacher_name;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Fetch a single teacher by ID
 */
async function getTeacherById(teacher_id) {
  const query = `
    SELECT 
      t.teacher_id,
      t.teacher_name,
      t.qualification,
      t.experience_yrs,
      t.contact_no,
      COALESCE(STRING_AGG(s.subject_name, ', ' ORDER BY s.subject_name), 'No Subjects') AS subjects
    FROM pp.teacher t
    LEFT JOIN pp.teacher_subject ts ON t.teacher_id = ts.teacher_id
    LEFT JOIN pp.subject s ON ts.subject_id = s.subject_id
    WHERE t.teacher_id = $1
    GROUP BY t.teacher_id, t.teacher_name, t.qualification, t.experience_yrs, t.contact_no;
  `;
  const { rows } = await pool.query(query, [teacher_id]);
  return rows[0];
}

/**
 * Create a new teacher
 */
async function createTeacher(teacher_name, qualification, experience_yrs, contact_no, created_by) {
  const query = `
    INSERT INTO pp.teacher (teacher_name, qualification, experience_yrs, contact_no, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [
    teacher_name,
    qualification,
    experience_yrs,
    contact_no,
    created_by,
  ]);
  return rows[0];
}

/**
 * Update teacher details
 */
async function updateTeacher(teacher_id, teacher_name, qualification, experience_yrs, contact_no, updated_by) {
  const query = `
    UPDATE pp.teacher
    SET 
      teacher_name = $2,
      qualification = $3,
      experience_yrs = $4,
      contact_no = $5,
      updated_by = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE teacher_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [
    teacher_id,
    teacher_name,
    qualification,
    experience_yrs,
    contact_no,
    updated_by,
  ]);
  return rows[0];
}

/**
 * Delete teacher by ID (soft delete optional)
 */
async function deleteTeacher(teacher_id) {
  const query = `
    DELETE FROM pp.teacher
    WHERE teacher_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [teacher_id]);
  return rows[0];
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
