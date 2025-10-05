// const pool = require("../../config/db");
// const fs = require("fs");
// const { parse } = require("csv-parse");

// // ----------------------------
// // Get attendance by cohort, batch, date, classroom, start & end time
// // ----------------------------
// const getAttendanceByFilters = async (filters = {}) => {
//   const { cohortNumber, batchId, classroomId, date, startTime, endTime } = filters;

//   let query = `
//     SELECT 
//       sm.student_id,
//       sm.student_name,
//       b.batch_id,
//       b.batch_name,
//       c.cohort_number,
//       c.cohort_name,
//       sa.date AS attendance_date,
//       sa.start_time,
//       sa.end_time,
//       sa.status
//     FROM pp.student_master sm
//     JOIN pp.batch b ON sm.batch_id = b.batch_id
//     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
//     LEFT JOIN pp.student_attendance sa ON sm.student_id = sa.student_id
//       AND ($4::time IS NULL OR sa.start_time = $4)
//       AND ($5::time IS NULL OR sa.end_time = $5)
//       AND ($6::int IS NULL OR sa.classroom_id = $6)
//       AND ($3::date IS NULL OR sa.date = $3)
//     WHERE ($1::int IS NULL OR c.cohort_number = $1)
//       AND ($2::int IS NULL OR b.batch_id = $2)
//     ORDER BY sm.student_name
//   `;

//   const values = [
//     cohortNumber || null,
//     batchId || null,
//     date || null,
//     startTime || null,
//     endTime || null,
//     classroomId || null
//   ];

//   const result = await pool.query(query, values);
//   return result.rows;
// };

// // ----------------------------
// // Create single attendance record
// // ----------------------------
// async function createAttendance(data) {
//   const { student_id, classroom_id, date, start_time, end_time, status, remarks = "" } = data;

//   const query = `
//     INSERT INTO pp.student_attendance
//       (student_id, classroom_id, date, start_time, end_time, status, remarks)
//     VALUES ($1,$2,$3,$4,$5,$6,$7)
//     ON CONFLICT (student_id, classroom_id, date, start_time, end_time)
//     DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks
//     RETURNING *;
//   `;

//   const values = [student_id, classroom_id, date, start_time, end_time, status, remarks];
//   const result = await pool.query(query, values);
//   return result.rows[0];
// }

// // ----------------------------
// // Bulk create attendance records
// // ----------------------------
// async function createBulkAttendance(records) {
//   if (!records || records.length === 0) return [];

//   const values = [];
//   const valueStrings = records.map((r, i) => {
//     const offset = i * 7;
//     values.push(
//       r.student_id,
//       r.classroom_id,
//       r.date,
//       r.start_time,
//       r.end_time,
//       r.status,
//       r.remarks || ""
//     );
//     return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
//   });

//   const query = `
//     INSERT INTO pp.student_attendance
//       (student_id, classroom_id, date, start_time, end_time, status, remarks)
//     VALUES ${valueStrings.join(", ")}
//     ON CONFLICT (student_id, classroom_id, date, start_time, end_time)
//     DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks
//     RETURNING *;
//   `;

//   const result = await pool.query(query, values);
//   return result.rows;
// }

// // ----------------------------
// // CSV Bulk upload helper
// // ----------------------------
// async function processCSVAttendance(filePath, classroom_id, date, teacherStartTime, teacherEndTime) {
//   const errors = [];
//   const records = [];

//   const toMinutes = (timeStr) => {
//     if (!timeStr) return 0;
//     let [h, m] = timeStr.split(":").map(Number);
//     return h * 60 + m;
//   };

//   const teacherDuration = toMinutes(teacherEndTime) - toMinutes(teacherStartTime);

//   return new Promise((resolve, reject) => {
//     const rows = [];
//     fs.createReadStream(filePath)
//       .pipe(parse({ columns: true, trim: true }))
//       .on("data", (row) => rows.push(row))
//       .on("end", async () => {
//         for (const row of rows) {
//           try {
//             const studentName = row["STUDENT NAME"];
//             const startTime = row["TIME JOINED"];
//             const endTime = row["TIME EXITED"];
//             const durationJoined = toMinutes(endTime) - toMinutes(startTime);
//             const percent = (durationJoined / teacherDuration) * 100;

//             let status = "ABSENT";
//             if (percent >= 70) status = "PRESENT";
//             else if (percent >= 40) status = "LATE JOINED";

//             const studentRes = await pool.query(
//               `SELECT student_id FROM pp.student_master WHERE student_name = $1 AND batch_id = (
//                 SELECT batch_id FROM pp.classroom WHERE classroom_id = $2
//               )`,
//               [studentName, classroom_id]
//             );

//             if (!studentRes.rows.length) {
//               errors.push({ row, error: "Student not found in classroom batch" });
//               continue;
//             }

//             const student_id = studentRes.rows[0].student_id;
//             records.push({
//               student_id,
//               classroom_id,
//               date,
//               start_time: startTime,
//               end_time: endTime,
//               status,
//               remarks: ""
//             });
//           } catch (err) {
//             errors.push({ row, error: err.message });
//           }
//         }

//         try {
//           const inserted = await createBulkAttendance(records);
//           resolve({ inserted, errors });
//         } catch (err) {
//           reject(err);
//         }
//       })
//       .on("error", (err) => reject(err));
//   });
// }

// // ----------------------------
// // Other CRUD functions
// // ----------------------------
// async function updateAttendance(attendance_id, updates) {
//   const fields = [];
//   const values = [];
//   let i = 1;
//   for (let key in updates) {
//     fields.push(`${key} = $${i}`);
//     values.push(updates[key]);
//     i++;
//   }
//   values.push(attendance_id);
//   const query = `
//     UPDATE pp.student_attendance
//     SET ${fields.join(", ")}
//     WHERE attendance_id = $${i}
//     RETURNING *;
//   `;
//   const result = await pool.query(query, values);
//   return result.rows[0];
// }

// async function deleteAttendance(attendance_id) {
//   const query = `DELETE FROM pp.student_attendance WHERE attendance_id = $1`;
//   await pool.query(query, [attendance_id]);
//   return { message: "Attendance deleted" };
// }

// module.exports = {
//   getAttendanceByFilters,
//   createAttendance,
//   createBulkAttendance,
//   updateAttendance,
//   deleteAttendance,
//   processCSVAttendance
// };


// const pool = require("../../config/db");
// const fs = require("fs");
// const { parse } = require("csv-parse");

const pool = require("../../config/db");
const fs = require("fs");
const { parse } = require("csv-parse");

// ----------------------------
// Get attendance by cohort, batch, date, classroom, start & end time
// ----------------------------
const getAttendanceByFilters = async (filters = {}) => {
  console.log('Filters received:', filters);

  let { cohortNumber, batchId, classroomId, date, startTime, endTime } = filters;

  if (startTime && !startTime.includes(':')) {
    startTime = `${startTime.padStart(2, '0')}:00:00`;
  }
  if (endTime && !endTime.includes(':')) {
    endTime = `${endTime.padStart(2, '0')}:00:00`;
  }

  console.log('Formatted filters:', { cohortNumber, batchId, classroomId, date, startTime, endTime });

  let query = `
    SELECT 
      sm.student_id,
      sm.student_name,
      b.batch_id,
      b.batch_name,
      c.cohort_number,
      c.cohort_name,
      sa.date AS attendance_date,
      sa.start_time,
      sa.end_time,
      sa.status
    FROM pp.student_master sm
    JOIN pp.batch b ON sm.batch_id = b.batch_id
    JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    LEFT JOIN pp.student_attendance sa ON sm.student_id = sa.student_id
      AND ($3::date IS NULL OR sa.date = $3)
      AND ($4::time IS NULL OR sa.start_time >= $4)
      AND ($5::time IS NULL OR sa.end_time <= $5)
      AND ($6::int IS NULL OR sa.classroom_id = $6)
    WHERE ($1::int IS NULL OR c.cohort_number = $1)
      AND ($2::int IS NULL OR b.batch_id = $2)
    ORDER BY sm.student_name
  `;

  const values = [
    cohortNumber || null,
    batchId || null,
    date || null,
    startTime || null,
    endTime || null,
    classroomId || null
  ];

  const result = await pool.query(query, values);
  console.log(result.rows);
  return result.rows;
};

// ----------------------------
// Create single attendance record
// ----------------------------
async function createAttendance(data) {
  const { student_id, classroom_id, date, start_time, end_time, status, remarks = "" } = data;

  const query = `
    INSERT INTO pp.student_attendance
      (student_id, classroom_id, date, start_time, end_time, status, remarks)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (student_id, classroom_id, date, start_time, end_time)
    DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks
    RETURNING *;
  `;

  const values = [student_id, classroom_id, date, start_time, end_time, status, remarks];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// ----------------------------
// Bulk create attendance records
// ----------------------------
async function createBulkAttendance(records) {
  if (!records || records.length === 0) return [];

  const values = [];
  const valueStrings = records.map((r, i) => {
    const offset = i * 7;
    values.push(
      r.student_id,
      r.classroom_id,
      r.date,
      r.start_time,
      r.end_time,
      r.status,
      r.remarks || ""
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  });

  const query = `
    INSERT INTO pp.student_attendance
      (student_id, classroom_id, date, start_time, end_time, status, remarks)
    VALUES ${valueStrings.join(", ")}
    ON CONFLICT (student_id, classroom_id, date, start_time, end_time)
    DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

// ----------------------------
// CSV Bulk upload helper (robust fix)
// ----------------------------
async function processCSVAttendance(filePath, classroom_id, date) {
  const errors = [];
  const records = [];

  const parseTimeParts = (timeStr) => {
    if (!timeStr) return null;
    let s = String(timeStr).trim();
    s = s.replace(/\.+$/, "").replace(/\s+/g, " ").trim();
    let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
    if (m) {
      let hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = m[3] ? Number(m[3]) : 0;
      const meridian = m[4] ? m[4].toUpperCase() : null;
      if (meridian === "PM" && hh < 12) hh += 12;
      if (meridian === "AM" && hh === 12) hh = 0;
      return { h: hh, m: mm, s: ss };
    }
    return null;
  };

  const partsToMinutes = (p) => p ? p.h * 60 + p.m + p.s / 60 : null;
  const partsToSQLTime = (p) =>
    p ? `${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}:${String(p.s).padStart(2, "0")}` : null;

  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true, relax_column_count: true }))
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          if (!rows.length) return reject(new Error("CSV contains no data rows"));

          // Detect teacher row (keyword match), fallback to first row
          const teacherIdx = rows.findIndex(r => {
            const name = (r["STUDENT NAME"] || "").toString().trim();
            return /teacher|faculty|lecturer|instructor/i.test(name);
          });
          const teacherRow = teacherIdx >= 0 ? rows[teacherIdx] : rows[0];

          // Teacher time window
          const tStartParts = parseTimeParts(teacherRow["TIME JOINED"]);
          const tEndParts = parseTimeParts(teacherRow["TIME EXITED"]);
          if (!tStartParts || !tEndParts) {
            return reject(new Error("Invalid teacher TIME JOINED / TIME EXITED in CSV"));
          }
          const teacherStartMinutes = partsToMinutes(tStartParts);
          const teacherEndMinutes = partsToMinutes(tEndParts);
          const teacherDuration = teacherEndMinutes - teacherStartMinutes;
          if (teacherDuration <= 0) {
            return reject(new Error("Teacher end time must be after start time"));
          }

          const teacherStartSQL = partsToSQLTime(tStartParts);
          const teacherEndSQL = partsToSQLTime(tEndParts);

          const allStudents = await getStudentsByClassroom(classroom_id);
          const processedStudentIds = new Set();

          const studentRows = rows.filter((_, idx) => idx !== teacherIdx);

          for (const row of studentRows) {
            const rawName = (row["STUDENT NAME"] || "").trim();
            if (!rawName) continue;

            const sStartParts = parseTimeParts(row["TIME JOINED"]);
            const sEndParts = parseTimeParts(row["TIME EXITED"]);

            let durationJoined = 0;
            if (sStartParts && sEndParts) {
              const sStartMin = partsToMinutes(sStartParts);
              const sEndMin = partsToMinutes(sEndParts);
              durationJoined = Math.max(0, sEndMin - sStartMin);
            }

            const percent = teacherDuration > 0 ? (durationJoined / teacherDuration) * 100 : 0;

            let status = "ABSENT";
            if (percent >= 70) status = "PRESENT";
            else if (percent >= 40) status = "LATE JOINED";

            // Lookup student_id
            const normalizedStudentName = rawName.replace(/\s+/g, " ").trim();
            const studentRes = await pool.query(
              `SELECT sm.student_id
               FROM pp.student_master sm
               JOIN pp.classroom_batch cb ON sm.batch_id = cb.batch_id
               WHERE lower(trim(sm.student_name)) = lower(trim($1)) 
                 AND cb.classroom_id = $2
               LIMIT 1`,
              [normalizedStudentName, classroom_id]
            );

            if (!studentRes.rows.length) {
              errors.push({ row: rawName, error: "Student not found in classroom batch" });
              continue;
            }

            const student_id = studentRes.rows[0].student_id;
            processedStudentIds.add(student_id);

            records.push({
              student_id,
              classroom_id,
              date,
              start_time: teacherStartSQL,   // always teacher times
              end_time: teacherEndSQL,
              status,
              remarks: `Student actual: ${row["TIME JOINED"] || "N/A"} - ${row["TIME EXITED"] || "N/A"}`
            });
          }

          // Remaining students = ABSENT
          for (const s of allStudents) {
            if (!processedStudentIds.has(s.student_id)) {
              records.push({
                student_id: s.student_id,
                classroom_id,
                date,
                start_time: teacherStartSQL,
                end_time: teacherEndSQL,
                status: "ABSENT",
                remarks: "Not found in CSV"
              });
            }
          }

          const inserted = await createBulkAttendance(records);
          resolve({ inserted, errors });
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(err));
  });
}


// ----------------------------
// Fetch students for a classroom (for Reference CSV)
// ----------------------------
async function getStudentsByClassroom(classroomId) {
  const query = `
    SELECT sm.student_id, sm.student_name
    FROM pp.student_master sm
    JOIN pp.classroom_batch cb ON sm.batch_id = cb.batch_id
    WHERE cb.classroom_id = $1
    ORDER BY sm.student_name;
  `;
  const result = await pool.query(query, [classroomId]);
  return result.rows;
}

// ----------------------------
// Other CRUD functions
// ----------------------------
async function updateAttendance(attendance_id, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  for (let key in updates) {
    fields.push(`${key} = $${i}`);
    values.push(updates[key]);
    i++;
  }
  values.push(attendance_id);
  const query = `
    UPDATE pp.student_attendance
    SET ${fields.join(", ")}
    WHERE attendance_id = $${i}
    RETURNING *;
  `;
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function deleteAttendance(attendance_id) {
  const query = `DELETE FROM pp.student_attendance WHERE attendance_id = $1`;
  await pool.query(query, [attendance_id]);
  return { message: "Attendance deleted" };
}

module.exports = {
  getAttendanceByFilters,
  createAttendance,
  createBulkAttendance,
  updateAttendance,
  deleteAttendance,
  processCSVAttendance,
  getStudentsByClassroom // 👈 added
};
