const pool = require("../../config/db");

exports.insertInactiveStudent = async ({ student_id, inactive_reason, user_id }) => {
  const query = `
    INSERT INTO pp.inactive_students 
      (student_id, inactive_reason, inactive_date, created_by, updated_by)
    VALUES 
      ($1, $2, CURRENT_DATE, $3, $3)
    RETURNING *;
  `;

  const values = [student_id, inactive_reason, user_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};
