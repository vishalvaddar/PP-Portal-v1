// server/models/coordinator/classroomModel.js
const pool = require("../../config/db");

const getClassroomsByBatch = async (batchId) => {
  const result = await pool.query(
    `SELECT c.classroom_id, c.classroom_name
     FROM pp.classroom c
     JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
     WHERE cb.batch_id = $1
       AND c.active_yn = 'Y'
     ORDER BY c.classroom_name`,
    [batchId]
  );
  return result.rows || [];
};

module.exports = { getClassroomsByBatch };
