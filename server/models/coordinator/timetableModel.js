// // // const pool = require("../../config/db");

// // // // --------------------------------------------------------------
// // // // GET TIMETABLE BY BATCH
// // // // --------------------------------------------------------------
// // // exports.getTimetableByBatch = async (batchId) => {
// // //   const res = await pool.query(
// // //     `
// // //     SELECT t.*, c.classroom_name, s.subject_name, te.teacher_name, c.class_link
// // //     FROM pp.timetable t
// // //     JOIN pp.classroom c ON t.classroom_id = c.classroom_id
// // //     LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
// // //     LEFT JOIN pp.teacher te ON c.teacher_id = te.teacher_id
// // //     JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
// // //     WHERE cb.batch_id = $1
// // //     ORDER BY t.day_of_week, t.start_time
// // //     `,
// // //     [batchId]
// // //   );
// // //   return res.rows;
// // // };

// // // // --------------------------------------------------------------
// // // // CHECK CONFLICTS
// // // // --------------------------------------------------------------
// // // exports.checkConflicts = async ({ classroom_id, teacher_id, day, start_time, end_time, exclude_id }) => {
// // //   let query = `
// // //     SELECT t.*
// // //     FROM pp.timetable t
// // //     JOIN pp.classroom c ON t.classroom_id = c.classroom_id
// // //     WHERE t.day_of_week = $1
// // //       AND ((t.start_time < $3 AND t.end_time > $2))`; // overlap condition
// // //   let params = [day, start_time, end_time];

// // //   if (classroom_id) {
// // //     query += ` AND t.classroom_id = $4`;
// // //     params.push(classroom_id);
// // //   }

// // //   if (teacher_id) {
// // //     query += ` OR (c.teacher_id = $5 AND t.day_of_week = $1 AND (t.start_time < $3 AND t.end_time > $2))`;
// // //     params.push(teacher_id);
// // //   }

// // //   if (exclude_id) {
// // //     query += ` AND t.timetable_id <> $6`;
// // //     params.push(exclude_id);
// // //   }

// // //   const res = await pool.query(query, params);
// // //   return res.rows;
// // // };

// // // // --------------------------------------------------------------
// // // // CREATE SLOT
// // // // --------------------------------------------------------------
// // // exports.createSlot = async ({ batch_id, classroom_id, day, start_time, end_time, meeting_link }) => {
// // //   const res = await pool.query(
// // //     `
// // //     INSERT INTO pp.timetable (classroom_id, day_of_week, start_time, end_time, created_by, updated_by)
// // //     VALUES ($1,$2,$3,$4,1,1)
// // //     RETURNING *
// // //     `,
// // //     [classroom_id, day, start_time, end_time]
// // //   );
// // //   return res.rows[0];
// // // };

// // // // --------------------------------------------------------------
// // // // UPDATE SLOT
// // // // --------------------------------------------------------------
// // // exports.updateSlot = async (id, { classroom_id, day, start_time, end_time, meeting_link }) => {
// // //   const res = await pool.query(
// // //     `
// // //     UPDATE pp.timetable
// // //     SET classroom_id=$2, day_of_week=$3, start_time=$4, end_time=$5, updated_at=NOW()
// // //     WHERE timetable_id=$1
// // //     RETURNING *
// // //     `,
// // //     [id, classroom_id, day, start_time, end_time]
// // //   );
// // //   return res.rows[0];
// // // };

// // // // --------------------------------------------------------------
// // // // DELETE SLOT
// // // // --------------------------------------------------------------
// // // exports.deleteSlot = async (id) => {
// // //   await pool.query(`DELETE FROM pp.timetable WHERE timetable_id=$1`, [id]);
// // // };


// // const pool = require("../../config/db");

// // /*  
// // ===============================================================
// //  GET TIMETABLE BY BATCH
// // ===============================================================
// // */
// // exports.getTimetableByBatch = async (batchId) => {
// //   const res = await pool.query(
// //     `
// //     SELECT t.*, c.classroom_name, s.subject_name, te.teacher_name, c.class_link
// //     FROM pp.timetable t
// //     JOIN pp.classroom c ON t.classroom_id = c.classroom_id
// //     LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
// //     LEFT JOIN pp.teacher te ON c.teacher_id = te.teacher_id
// //     JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
// //     WHERE cb.batch_id = $1
// //     ORDER BY t.day_of_week, t.start_time
// //     `,
// //     [batchId]
// //   );
// //   return res.rows;
// // };

// // /*  
// // ===============================================================
// //  CHECK CONFLICTS  (FIXED VERSION)
// // ===============================================================
// // */
// // exports.checkConflicts = async ({
// //   classroom_id,
// //   teacher_id,
// //   day,
// //   start_time,
// //   end_time,
// //   exclude_id
// // }) => {

// //   const query = `
// //     SELECT t.*
// //     FROM pp.timetable t
// //     JOIN pp.classroom c ON t.classroom_id = c.classroom_id
// //     WHERE t.day_of_week = $1
// //       AND ($2 < t.end_time AND $3 > t.start_time)

// //       -- classroom conflict
// //       AND ($4::int IS NULL OR t.classroom_id = $4)

// //       -- teacher conflict
// //       AND ($5::int IS NULL OR c.teacher_id = $5)

// //       -- exclude same entry (for update)
// //       AND ($6::int IS NULL OR t.timetable_id <> $6)
// //   `;

// //   const params = [
// //     day,
// //     start_time,
// //     end_time,
// //     classroom_id || null,
// //     teacher_id || null,
// //     exclude_id || null
// //   ];

// //   const res = await pool.query(query, params);
// //   return res.rows;
// // };

// // /*  
// // ===============================================================
// //  CREATE SLOT
// // ===============================================================
// // */
// // exports.createSlot = async ({
// //   batch_id,
// //   classroom_id,
// //   day,
// //   start_time,
// //   end_time
// // }) => {
// //   const res = await pool.query(
// //     `
// //     INSERT INTO pp.timetable 
// //       (classroom_id, day_of_week, start_time, end_time, created_by, updated_by)
// //     VALUES 
// //       ($1, $2, $3, $4, 1, 1)
// //     RETURNING *
// //     `,
// //     [classroom_id, day, start_time, end_time]
// //   );
// //   return res.rows[0];
// // };

// // /*  
// // ===============================================================
// //  UPDATE SLOT
// // ===============================================================
// // */
// // exports.updateSlot = async (id, {
// //   classroom_id,
// //   day,
// //   start_time,
// //   end_time
// // }) => {
// //   const res = await pool.query(
// //     `
// //     UPDATE pp.timetable
// //     SET classroom_id = $2,
// //         day_of_week = $3,
// //         start_time = $4,
// //         end_time = $5,
// //         updated_at = NOW()
// //     WHERE timetable_id = $1
// //     RETURNING *
// //     `,
// //     [id, classroom_id, day, start_time, end_time]
// //   );
// //   return res.rows[0];
// // };

// // /*  
// // ===============================================================
// //  DELETE SLOT
// // ===============================================================
// // */
// // exports.deleteSlot = async (id) => {
// //   await pool.query(`DELETE FROM pp.timetable WHERE timetable_id = $1`, [id]);
// // };


// const pool = require("../../config/db");

// /*  
// ===============================================================
//  GET TIMETABLE BY BATCH
// ===============================================================
// */
// exports.getTimetableByBatch = async (batchId) => {
//   const res = await pool.query(
//     `
//     SELECT t.*, c.classroom_name, s.subject_name, te.teacher_name, c.class_link
//     FROM pp.timetable t
//     JOIN pp.classroom c ON t.classroom_id = c.classroom_id
//     LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
//     LEFT JOIN pp.teacher te ON c.teacher_id = te.teacher_id
//     JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
//     WHERE cb.batch_id = $1
//     ORDER BY t.day_of_week, t.start_time
//     `,
//     [batchId]
//   );
//   return res.rows;
// };

// /*  
// ===============================================================
//  CHECK CONFLICTS (FINAL FIXED VERSION)
// ===============================================================
// */
// exports.checkConflicts = async ({
//   classroom_id,
//   teacher_id,
//   day,
//   start_time,
//   end_time,
//   exclude_id
// }) => {

//   const query = `
//     SELECT 
//         t.timetable_id,
//         t.classroom_id,
//         c.classroom_name,
//         c.teacher_id,
//         t.day_of_week,
//         t.start_time,
//         t.end_time
//     FROM pp.timetable t
//     JOIN pp.classroom c ON t.classroom_id = c.classroom_id
//     WHERE 
//         -- Same day
//         t.day_of_week = $1

//         -- Time overlap
//         AND ($2 < t.end_time AND $3 > t.start_time)

//         -- ANY conflict rule:
//         AND (
//               -- 1️⃣ Classroom conflict
//               ( $4::int IS NOT NULL AND t.classroom_id = $4 )

//            OR -- 2️⃣ Teacher conflict
//               ( $5::int IS NOT NULL AND c.teacher_id = $5 )

//            OR -- 3️⃣ Batch conflict
//               EXISTS (
//                 SELECT 1
//                 FROM pp.classroom_batch cb1
//                 JOIN pp.classroom_batch cb2 
//                   ON cb1.batch_id = cb2.batch_id
//                 WHERE cb1.classroom_id = t.classroom_id
//                   AND cb2.classroom_id = $4
//               )
//         )

//         -- Exclude same row when updating
//         AND ($6::int IS NULL OR t.timetable_id <> $6)
//   `;

//   const params = [
//     day,
//     start_time,
//     end_time,
//     classroom_id || null,
//     teacher_id || null,
//     exclude_id || null
//   ];

//   const res = await pool.query(query, params);
//   return res.rows;
// };

// /*  
// ===============================================================
//  CREATE SLOT
// ===============================================================
// */
// exports.createSlot = async ({
//   batch_id,
//   classroom_id,
//   day,
//   start_time,
//   end_time
// }) => {
//   const res = await pool.query(
//     `
//     INSERT INTO pp.timetable 
//       (classroom_id, day_of_week, start_time, end_time, created_by, updated_by)
//     VALUES 
//       ($1, $2, $3, $4, 1, 1)
//     RETURNING *
//     `,
//     [classroom_id, day, start_time, end_time]
//   );
//   return res.rows[0];
// };

// /*  
// ===============================================================
//  UPDATE SLOT
// ===============================================================
// */
// exports.updateSlot = async (
//   id,
//   { classroom_id, day, start_time, end_time }
// ) => {
//   const res = await pool.query(
//     `
//     UPDATE pp.timetable
//     SET classroom_id = $2,
//         day_of_week = $3,
//         start_time = $4,
//         end_time = $5,
//         updated_at = NOW()
//     WHERE timetable_id = $1
//     RETURNING *
//     `,
//     [id, classroom_id, day, start_time, end_time]
//   );
//   return res.rows[0];
// };

// /*  
// ===============================================================
//  DELETE SLOT
// ===============================================================
// */
// exports.deleteSlot = async (id) => {
//   await pool.query(`DELETE FROM pp.timetable WHERE timetable_id = $1`, [id]);
// };




const pool = require("../../config/db");

/* ===============================================================
 GET TIMETABLE BY BATCH (Includes Subject Code & Link)
=============================================================== */
exports.getTimetableByBatch = async (batchId) => {
  const res = await pool.query(
    `
    SELECT 
        t.*, 
        c.classroom_name, 
        c.class_link, -- Link comes from classroom table
        s.subject_name, 
        s.subject_code, 
        te.teacher_name
    FROM pp.timetable t
    JOIN pp.classroom c ON t.classroom_id = c.classroom_id
    LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
    LEFT JOIN pp.teacher te ON c.teacher_id = te.teacher_id
    JOIN pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
    WHERE cb.batch_id = $1
    ORDER BY 
        CASE t.day_of_week 
            WHEN 'SUNDAY' THEN 1 WHEN 'MONDAY' THEN 2 WHEN 'TUESDAY' THEN 3 
            WHEN 'WEDNESDAY' THEN 4 WHEN 'THURSDAY' THEN 5 WHEN 'FRIDAY' THEN 6 
            WHEN 'SATURDAY' THEN 7 END, 
        t.start_time
    `,
    [batchId]
  );
  return res.rows;
};

/* ===============================================================
 CHECK CONFLICTS (Enhanced with Subject/Teacher Data)
=============================================================== */
exports.checkConflicts = async ({
  classroom_id,
  teacher_id,
  day,
  start_time,
  end_time,
  exclude_id
}) => {
  const query = `
    SELECT 
        t.timetable_id,
        t.start_time,
        t.end_time,
        c.classroom_name,
        s.subject_name,
        te.teacher_name
    FROM pp.timetable t
    JOIN pp.classroom c ON t.classroom_id = c.classroom_id
    LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
    LEFT JOIN pp.teacher te ON c.teacher_id = te.teacher_id
    WHERE 
        t.day_of_week = $1
        AND ($2 < t.end_time AND $3 > t.start_time)
        AND (
              ( $4::int IS NOT NULL AND t.classroom_id = $4 )
           OR ( $5::int IS NOT NULL AND c.teacher_id = $5 )
           OR EXISTS (
                SELECT 1
                FROM pp.classroom_batch cb1
                JOIN pp.classroom_batch cb2 ON cb1.batch_id = cb2.batch_id
                WHERE cb1.classroom_id = t.classroom_id
                  AND cb2.classroom_id = $4
              )
        )
        AND ($6::int IS NULL OR t.timetable_id <> $6)
  `;

  const params = [day, start_time, end_time, classroom_id || null, teacher_id || null, exclude_id || null];
  const res = await pool.query(query, params);
  return res.rows;
};

/* ===============================================================
 CREATE SLOT (Updates Classroom Link in the process)
=============================================================== */
exports.createSlot = async ({ classroom_id, day, start_time, end_time, class_link }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert the timetable record
    const res = await client.query(
      `INSERT INTO pp.timetable 
        (classroom_id, day_of_week, start_time, end_time, created_by, updated_by)
      VALUES 
        ($1, $2, $3, $4, 1, 1)
      RETURNING *`,
      [classroom_id, day, start_time, end_time]
    );

    // 2. Update the classroom link in the classroom table
    await client.query(
      `UPDATE pp.classroom SET class_link = $2 WHERE classroom_id = $1`,
      [classroom_id, class_link || null]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/* ===============================================================
 UPDATE SLOT AND LINK (Transactional Update)
=============================================================== */
exports.updateSlotAndLink = async (id, { classroom_id, day, start_time, end_time, class_link }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update the timetable record
    const res = await client.query(
      `UPDATE pp.timetable
       SET classroom_id = $2, day_of_week = $3, start_time = $4, end_time = $5, updated_at = NOW()
       WHERE timetable_id = $1
       RETURNING *`,
      [id, classroom_id, day, start_time, end_time]
    );

    // 2. Update the link in the classroom table
    await client.query(
      `UPDATE pp.classroom SET class_link = $2 WHERE classroom_id = $1`,
      [classroom_id, class_link || null]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/* ===============================================================
 DELETE SLOT
=============================================================== */
exports.deleteSlot = async (id) => {
  await pool.query(`DELETE FROM pp.timetable WHERE timetable_id = $1`, [id]);
};