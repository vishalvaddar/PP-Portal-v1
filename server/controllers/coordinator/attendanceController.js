// // // // // // // // controllers/AttendanceController.js
// // // // // // // const fs = require("fs");
// // // // // // // const path = require("path");
// // // // // // // const Papa = require("papaparse");
// // // // // // // const pool = require("../../config/db"); // keep your existing db config import

// // // // // // // // === Helper: Parse CSV (no header expected) ===
// // // // // // // const parseCSV = async (filePath) =>
// // // // // // //   new Promise((resolve, reject) => {
// // // // // // //     const stream = fs.createReadStream(filePath);
// // // // // // //     Papa.parse(stream, {
// // // // // // //       header: false,
// // // // // // //       skipEmptyLines: true,
// // // // // // //       complete: (results) => resolve(results.data),
// // // // // // //       error: (err) => reject(err),
// // // // // // //     });
// // // // // // //   });

// // // // // // // // === Helper: robust time parsing to minutes from midnight
// // // // // // // // Supports "18:30", "6:42PM", "6:42?PM", "06:42 PM", "6:42 pm", etc.
// // // // // // // // Returns minutes since 00:00 (integer) or null on failure.
// // // // // // // const parseTimeToMinutes = (raw) => {
// // // // // // //   if (!raw && raw !== 0) return null;
// // // // // // //   const s = String(raw).trim();

// // // // // // //   // Remove stray characters except digits, colon, space, AM/PM letters
// // // // // // //   const cleaned = s.replace(/[^\d:apmAPM ]/g, "").replace(/\s+/g, " ").trim();

// // // // // // //   // Try 24-hour HH:MM first
// // // // // // //   const hhmm24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
// // // // // // //   if (hhmm24) {
// // // // // // //     const h = parseInt(hhmm24[1], 10);
// // // // // // //     const m = parseInt(hhmm24[2], 10);
// // // // // // //     if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
// // // // // // //     return null;
// // // // // // //   }

// // // // // // //   // Try 12-hour with AM/PM
// // // // // // //   const hhmm12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])$/);
// // // // // // //   if (hhmm12) {
// // // // // // //     let h = parseInt(hhmm12[1], 10);
// // // // // // //     const m = parseInt(hhmm12[2], 10);
// // // // // // //     const ampm = hhmm12[3].toUpperCase();
// // // // // // //     if (ampm === "PM" && h < 12) h += 12;
// // // // // // //     if (ampm === "AM" && h === 12) h = 0;
// // // // // // //     if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
// // // // // // //     return null;
// // // // // // //   }

// // // // // // //   // Try something like "6PM" or "6 PM"
// // // // // // //   const hhOnly = cleaned.match(/^(\d{1,2})\s*([aApP][mM])$/);
// // // // // // //   if (hhOnly) {
// // // // // // //     let h = parseInt(hhOnly[1], 10);
// // // // // // //     const ampm = hhOnly[2].toUpperCase();
// // // // // // //     if (ampm === "PM" && h < 12) h += 12;
// // // // // // //     if (ampm === "AM" && h === 12) h = 0;
// // // // // // //     if (h >= 0 && h < 24) return h * 60;
// // // // // // //     return null;
// // // // // // //   }

// // // // // // //   // Last resort: extract first HH:MM-looking substring
// // // // // // //   const anyHHMM = cleaned.match(/(\d{1,2}):(\d{2})/);
// // // // // // //   if (anyHHMM) {
// // // // // // //     const h = parseInt(anyHHMM[1], 10);
// // // // // // //     const m = parseInt(anyHHMM[2], 10);
// // // // // // //     if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
// // // // // // //   }

// // // // // // //   return null;
// // // // // // // };

// // // // // // // // compute percent of attendance given joinmins/exitmins and classStart/classEnd minutes
// // // // // // // const computePercent = (joinMins, exitMins, classStartMins, classEndMins) => {
// // // // // // //   if (
// // // // // // //     joinMins === null ||
// // // // // // //     exitMins === null ||
// // // // // // //     classStartMins === null ||
// // // // // // //     classEndMins === null
// // // // // // //   )
// // // // // // //     return 0;
// // // // // // //   const classDuration = classEndMins - classStartMins;
// // // // // // //   if (!classDuration || classDuration <= 0) return 0;
// // // // // // //   const attended = Math.max(0, Math.min(exitMins, classEndMins) - Math.max(joinMins, classStartMins));
// // // // // // //   const pct = (attended / classDuration) * 100;
// // // // // // //   if (isNaN(pct)) return 0;
// // // // // // //   return Math.max(0, Math.min(100, pct));
// // // // // // // };

// // // // // // // // normalize status text to DB allowed values
// // // // // // // const normalizeStatus = (pct) => {
// // // // // // //   if (pct >= 75) return "PRESENT";
// // // // // // //   if (pct >= 40) return "LATE JOINED";
// // // // // // //   return "ABSENT";
// // // // // // // };

// // // // // // // // ========================= PREVIEW =========================
// // // // // // // const previewCSVAttendance = async (req, res) => {
// // // // // // //   try {
// // // // // // //     console.log("======================================================");
// // // // // // //     console.log("[Route] 🟢 /attendance/csv/preview called");
// // // // // // //     console.log("======================================================");

// // // // // // //     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

// // // // // // //     const filePath = req.file.path;
// // // // // // //     console.log("[previewCSVAttendance] 📂 File path:", filePath);

// // // // // // //     const rows = await parseCSV(filePath);
// // // // // // //     console.log(`[previewCSVAttendance] ✅ Parsed ${rows.length} rows`);

// // // // // // //     if (rows.length < 3) {
// // // // // // //       // keep the uploaded file around for debugging in dev, but still respond error
// // // // // // //       return res.status(400).json({ message: "Invalid CSV format. Needs header, class-time row and at least one student row." });
// // // // // // //     }

// // // // // // //     // Row 0 = header (ignored for parsing)
// // // // // // //     // Row 1 = class times: [, classStart, classEnd]
// // // // // // //     const classStartRaw = rows[1][1];
// // // // // // //     const classEndRaw = rows[1][2];
// // // // // // //     const classStartMins = parseTimeToMinutes(classStartRaw);
// // // // // // //     const classEndMins = parseTimeToMinutes(classEndRaw);

// // // // // // //     const classDuration = (classStartMins !== null && classEndMins !== null) ? (classEndMins - classStartMins) : null;
// // // // // // //     console.log(`🕒 Class Start raw: ${classStartRaw}, End raw: ${classEndRaw}, duration mins: ${classDuration}`);

// // // // // // //     // Build student rows from row 2 onwards
// // // // // // //     const csvStudents = [];
// // // // // // //     for (let i = 2; i < rows.length; i++) {
// // // // // // //       const [rawName, rawJoin, rawExit] = rows[i];
// // // // // // //       const name = rawName ? String(rawName).trim() : null;
// // // // // // //       if (!name) continue;
// // // // // // //       const joinRaw = rawJoin ? String(rawJoin).trim() : null;
// // // // // // //       const exitRaw = rawExit ? String(rawExit).trim() : null;

// // // // // // //       const joinMins = parseTimeToMinutes(joinRaw);
// // // // // // //       const exitMins = parseTimeToMinutes(exitRaw);
// // // // // // //       const pct = computePercent(joinMins, exitMins, classStartMins, classEndMins);
// // // // // // //       const pctFixed = Math.round(pct * 100) / 100; // 2 decimal-ish
// // // // // // //       const status = normalizeStatus(pctFixed);

// // // // // // //       csvStudents.push({
// // // // // // //         name,
// // // // // // //         raw_join: joinRaw || null,
// // // // // // //         raw_exit: exitRaw || null,
// // // // // // //         join_mins: joinMins,
// // // // // // //         exit_mins: exitMins,
// // // // // // //         percent: pctFixed,
// // // // // // //         status,
// // // // // // //       });
// // // // // // //     }

// // // // // // //     // We expect caller to pass batch_id OR classroom_id to map students to DB
// // // // // // //     const batchId = req.body.batch_id || null;
// // // // // // //     const classroomId = req.body.classroom_id || null;

// // // // // // //     if (!batchId && !classroomId) {
// // // // // // //       // attempt to read batch_id from form (older clients send batch)
// // // // // // //       // but if missing, we still produce a preview with unmatched = all
// // // // // // //       console.warn("[previewCSVAttendance] ⚠️ batch_id and classroom_id not provided. Preview will not map to DB students.");
// // // // // // //     }

// // // // // // //     // Query DB students for mapping (prefer classroom->batch mapping if classroom given)
// // // // // // //     let dbStudents = [];
// // // // // // //     if (batchId) {
// // // // // // //       const q = await pool.query(
// // // // // // //         `SELECT student_id, student_name, batch_id FROM pp.student_master WHERE batch_id = $1`,
// // // // // // //         [batchId]
// // // // // // //       );
// // // // // // //       dbStudents = q.rows;
// // // // // // //     } else if (classroomId) {
// // // // // // //       // if you maintain classroom_batch table linking classroom<->batch, pick those batches (or students linked directly)
// // // // // // //       // We'll fetch students by batch via classroom_batch -> batch -> student_master
// // // // // // //       const q = await pool.query(
// // // // // // //         `SELECT sm.student_id, sm.student_name, sm.batch_id
// // // // // // //          FROM pp.student_master sm
// // // // // // //          JOIN pp.classroom_batch cb ON sm.batch_id = cb.batch_id
// // // // // // //          WHERE cb.classroom_id = $1`,
// // // // // // //         [classroomId]
// // // // // // //       );
// // // // // // //       dbStudents = q.rows;
// // // // // // //     }

// // // // // // //     // build quick lookup maps (lowercase names)
// // // // // // //     const nameToStudent = new Map();
// // // // // // //     dbStudents.forEach((s) => {
// // // // // // //       if (s.student_name) nameToStudent.set(String(s.student_name).toLowerCase().trim(), s);
// // // // // // //     });

// // // // // // //     const matched = [];
// // // // // // //     const unmatched = [];
// // // // // // //     const matchedNamesSet = new Set();

// // // // // // //     for (const cs of csvStudents) {
// // // // // // //       const lookup = nameToStudent.get(String(cs.name).toLowerCase().trim());
// // // // // // //       if (lookup) {
// // // // // // //         matched.push({
// // // // // // //           student_id: lookup.student_id,
// // // // // // //           student_name: lookup.student_name,
// // // // // // //           classroom_id: classroomId || null,
// // // // // // //           batch_id: lookup.batch_id || null,
// // // // // // //           time_joined: cs.raw_join,
// // // // // // //           time_exited: cs.raw_exit,
// // // // // // //           attendance_percent: cs.percent,
// // // // // // //           status: cs.status,
// // // // // // //         });
// // // // // // //         matchedNamesSet.add(String(lookup.student_name).toLowerCase().trim());
// // // // // // //       } else {
// // // // // // //         unmatched.push({
// // // // // // //           student_name: cs.name,
// // // // // // //           time_joined: cs.raw_join,
// // // // // // //           time_exited: cs.raw_exit,
// // // // // // //           attendance_percent: cs.percent,
// // // // // // //           status: cs.status,
// // // // // // //         });
// // // // // // //       }
// // // // // // //     }

// // // // // // //     // absentees = DB students in class/batch who were NOT matched
// // // // // // //     const absentees = [];
// // // // // // //     if (dbStudents.length > 0) {
// // // // // // //       for (const s of dbStudents) {
// // // // // // //         const nm = String(s.student_name).toLowerCase().trim();
// // // // // // //         if (!matchedNamesSet.has(nm)) {
// // // // // // //           absentees.push({
// // // // // // //             student_id: s.student_id,
// // // // // // //             student_name: s.student_name,
// // // // // // //             classroom_id: classroomId || null,
// // // // // // //             batch_id: s.batch_id,
// // // // // // //             time_joined: null,
// // // // // // //             time_exited: null,
// // // // // // //             attendance_percent: 0,
// // // // // // //             status: "ABSENT",
// // // // // // //           });
// // // // // // //         }
// // // // // // //       }
// // // // // // //     }

// // // // // // //     // final preview rows: matched then absentees
// // // // // // //     const previewRows = [...matched, ...absentees];

// // // // // // //     // Persist preview server-side (optional) but safer: return preview rows in response and allow commit with attendanceList in body.
// // // // // // //     // remove uploaded file to keep uploads folder tidy
// // // // // // //     try {
// // // // // // //       fs.unlinkSync(filePath);
// // // // // // //     } catch (e) {
// // // // // // //       // ignore remove errors
// // // // // // //     }

// // // // // // //     console.log("------------------------------------------------------");
// // // // // // //     console.log("✅ Matched:", matched.length);
// // // // // // //     console.log("⚠️ Unmatched:", unmatched.length);
// // // // // // //     console.log("❌ Absentees:", absentees.length);
// // // // // // //     console.log("------------------------------------------------------");

// // // // // // //     return res.status(200).json({
// // // // // // //       classStart: classStartRaw,
// // // // // // //       classEnd: classEndRaw,
// // // // // // //       classDurationMins: classDuration,
// // // // // // //       previewData: previewRows,
// // // // // // //       unmatchedStudents: unmatched,
// // // // // // //       absentees,
// // // // // // //       matchedCount: matched.length,
// // // // // // //       unmatchedCount: unmatched.length,
// // // // // // //       absenteeCount: absentees.length,
// // // // // // //       message: "Preview generated",
// // // // // // //     });
// // // // // // //   } catch (err) {
// // // // // // //     console.error("❌ Error in previewCSVAttendance:", err);
// // // // // // //     return res.status(500).json({ message: "Error during CSV preview", error: err.message });
// // // // // // //   }
// // // // // // // };

// // // // // // // // ========================= COMMIT =========================
// // // // // // // // Accepts either:
// // // // // // // // - req.body.attendanceList (array of rows returned by preview) [recommended]
// // // // // // // // - or server-side cached preview if you have such mechanism (not required here)
// // // // // // // const commitCSVAttendance = async (req, res) => {
// // // // // // //   const client = await pool.connect();
// // // // // // //   try {
// // // // // // //     const attendanceList = req.body.attendanceList || req.body.previewData || null;
// // // // // // //     const attendanceDate = req.body.attendanceDate || req.body.date || new Date().toISOString().split("T")[0];
// // // // // // //     const classroomId = req.body.classroom_id || req.body.classroomId || null;
// // // // // // //     if (!attendanceList || attendanceList.length === 0) {
// // // // // // //       return res.status(400).json({ message: "No attendance list provided for commit" });
// // // // // // //     }

// // // // // // //     await client.query("BEGIN");
// // // // // // //     const insertedIds = [];

// // // // // // //     for (const r of attendanceList) {
// // // // // // //       // r should contain student_id, classroom_id or batch_id, time_joined, time_exited, attendance_percent, status
// // // // // // //       const student_id = r.student_id;
// // // // // // //       const classroom_id = r.classroom_id || classroomId || null;
// // // // // // //       const start_time = r.time_joined || r.time_joined || r.joined || null;
// // // // // // //       const end_time = r.time_exited || r.time_exited || r.exited || null;

// // // // // // //       // If start_time/end_time are text like "6:42PM", attempt to normalize to hh:mm:ss for DB time
// // // // // // //       // POSTGRES accepts 'HH:MM:SS' or 'HH:MM'
// // // // // // //       const normalizeToTimeString = (raw) => {
// // // // // // //         if (!raw) return null;
// // // // // // //         // parse to minutes
// // // // // // //         const mins = parseTimeToMinutes(raw);
// // // // // // //         if (mins === null) return null;
// // // // // // //         const hh = Math.floor(mins / 60).toString().padStart(2, "0");
// // // // // // //         const mm = (mins % 60).toString().padStart(2, "0");
// // // // // // //         return `${hh}:${mm}:00`;
// // // // // // //       };

// // // // // // //       const start_ts = normalizeToTimeString(start_time);
// // // // // // //       const end_ts = normalizeToTimeString(end_time);

// // // // // // //       const status = (r.status || r.attendance_status || "ABSENT").toString().toUpperCase();

// // // // // // //       // Insert with ON CONFLICT on unique(student_id, date, classroom_id, start_time, end_time)
// // // // // // //       await client.query(
// // // // // // //         `INSERT INTO pp.student_attendance
// // // // // // //           (student_id, classroom_id, date, start_time, end_time, status, remarks)
// // // // // // //          VALUES ($1, $2, $3, $4, $5, $6, $7)
// // // // // // //          ON CONFLICT (student_id, date, classroom_id, start_time, end_time)
// // // // // // //          DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = NOW()`,
// // // // // // //         [student_id, classroom_id, attendanceDate, start_ts || "00:00:00", end_ts || "00:00:00", status, null]
// // // // // // //       );

// // // // // // //       insertedIds.push(student_id);
// // // // // // //     }

// // // // // // //     await client.query("COMMIT");
// // // // // // //     // cache last commit metadata so undo can use it (optional)
// // // // // // //     global.lastCommit = {
// // // // // // //       ids: insertedIds,
// // // // // // //       date: attendanceDate,
// // // // // // //       classroom_id: classroomId,
// // // // // // //     };

// // // // // // //     return res.status(200).json({
// // // // // // //       message: "Attendance committed",
// // // // // // //       insertedCount: insertedIds.length,
// // // // // // //     });
// // // // // // //   } catch (err) {
// // // // // // //     await client.query("ROLLBACK");
// // // // // // //     console.error("❌ Error committing attendance:", err);
// // // // // // //     return res.status(500).json({ message: "Error committing attendance", error: err.message });
// // // // // // //   } finally {
// // // // // // //     client.release();
// // // // // // //   }
// // // // // // // };

// // // // // // // // ========================= UNDO =========================
// // // // // // // // expects { classroom_id, date } OR uses global.lastCommit if present
// // // // // // // const undoLastAttendanceCommit = async (req, res) => {
// // // // // // //   try {
// // // // // // //     let classroomId = req.body.classroom_id || req.body.classroomId || null;
// // // // // // //     let date = req.body.date || req.body.attendanceDate || null;

// // // // // // //     // fallback to global cached commit data
// // // // // // //     if ((!classroomId || !date) && global.lastCommit) {
// // // // // // //       classroomId = classroomId || global.lastCommit.classroom_id;
// // // // // // //       date = date || global.lastCommit.date;
// // // // // // //     }

// // // // // // //     if (!classroomId || !date) {
// // // // // // //       return res.status(400).json({ message: "Missing classroom_id or date for undo" });
// // // // // // //     }

// // // // // // //     const result = await pool.query(
// // // // // // //       `DELETE FROM pp.student_attendance WHERE classroom_id = $1 AND date = $2 RETURNING student_id`,
// // // // // // //       [classroomId, date]
// // // // // // //     );

// // // // // // //     // clear cached lastCommit
// // // // // // //     if (global.lastCommit) global.lastCommit = null;

// // // // // // //     return res.status(200).json({
// // // // // // //       message: "Undo successful",
// // // // // // //       deleted: result.rowCount,
// // // // // // //       deletedIds: result.rows.map((r) => r.student_id),
// // // // // // //     });
// // // // // // //   } catch (err) {
// // // // // // //     console.error("❌ Error undoing last attendance commit:", err);
// // // // // // //     return res.status(500).json({ message: "Undo failed", error: err.message });
// // // // // // //   }
// // // // // // // };

// // // // // // // const getAttendanceByFilters = async (filters = {}) => {
// // // // // // //   console.log('Filters received:', filters);

// // // // // // //   let { cohortNumber, batchId, classroomId, date, startTime, endTime } = filters;

// // // // // // //   if (startTime && !startTime.includes(':')) {
// // // // // // //     startTime = `${startTime.padStart(2, '0')}:00:00`;
// // // // // // //   }
// // // // // // //   if (endTime && !endTime.includes(':')) {
// // // // // // //     endTime = `${endTime.padStart(2, '0')}:00:00`;
// // // // // // //   }

// // // // // // //   console.log('Formatted filters:', { cohortNumber, batchId, classroomId, date, startTime, endTime });

// // // // // // //   let query = `
// // // // // // //     SELECT 
// // // // // // //       sm.student_id,
// // // // // // //       sm.student_name,
// // // // // // //       b.batch_id,
// // // // // // //       b.batch_name,
// // // // // // //       c.cohort_number,
// // // // // // //       c.cohort_name,
// // // // // // //       sa.date AS attendance_date,
// // // // // // //       sa.start_time,
// // // // // // //       sa.end_time,
// // // // // // //       sa.status
// // // // // // //     FROM pp.student_master sm
// // // // // // //     JOIN pp.batch b ON sm.batch_id = b.batch_id
// // // // // // //     JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// // // // // // //     LEFT JOIN pp.student_attendance sa ON sm.student_id = sa.student_id
// // // // // // //       AND ($3::date IS NULL OR sa.date = $3)
// // // // // // //       AND ($4::time IS NULL OR sa.start_time >= $4)
// // // // // // //       AND ($5::time IS NULL OR sa.end_time <= $5)
// // // // // // //       AND ($6::int IS NULL OR sa.classroom_id = $6)
// // // // // // //     WHERE ($1::int IS NULL OR c.cohort_number = $1)
// // // // // // //       AND ($2::int IS NULL OR b.batch_id = $2)
// // // // // // //     ORDER BY sm.student_name
// // // // // // //   `;

// // // // // // //   const values = [
// // // // // // //     cohortNumber || null,
// // // // // // //     batchId || null,
// // // // // // //     date || null,
// // // // // // //     startTime || null,
// // // // // // //     endTime || null,
// // // // // // //     classroomId || null
// // // // // // //   ];

// // // // // // //   const result = await pool.query(query, values);
// // // // // // //   console.log(result.rows);
// // // // // // //   return result.rows;
// // // // // // // };


// // // // // // // // Fetch attendance (by cohort, batch, classroom, date, time)
// // // // // // // // ----------------------------
// // // // // // // const fetchAttendance = async (req, res) => {
// // // // // // //   try {
// // // // // // //     // ✅ Use query params from the frontend request
// // // // // // //     // Fix: Changed cohortId to cohortNumber to match the model
// // // // // // //     const { cohortNumber, batchId, classroomId, date, startTime, endTime } = req.query;

// // // // // // //     if (!cohortNumber && !batchId && !classroomId && !date) {
// // // // // // //       return res.status(400).json({
// // // // // // //         message: "At least one filter (cohortNumber, batchId, classroomId, date) is required",
// // // // // // //       });
// // // // // // //     }

// // // // // // //     // Corrected: Create a single filters object to pass to the model function
// // // // // // //     const filters = {
// // // // // // //       // Fix: Use cohortNumber here
// // // // // // //       cohortNumber: cohortNumber ? parseInt(cohortNumber) : null,
// // // // // // //       batchId: batchId ? parseInt(batchId) : null,
// // // // // // //       classroomId: classroomId ? parseInt(classroomId) : null,
// // // // // // //       date: date || null,
// // // // // // //       startTime: startTime || null,
// // // // // // //       endTime: endTime || null,
// // // // // // //     };

// // // // // // //     const data = await getAttendanceByFilters(filters);

// // // // // // //     res.status(200).json(data || []);
// // // // // // //   } catch (err) {
// // // // // // //     console.error("Error fetching attendance:", err);
// // // // // // //     res.status(500).json({ message: "Error fetching attendance", error: err.message });
// // // // // // //   }
// // // // // // // };

// // // // // // // // Download sample CSV
// // // // // // // const downloadSampleCSV = (req, res) => {
// // // // // // //   const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
// // // // // // //   res.download(filePath, "sample_attendance.csv", (err) => {
// // // // // // //     if (err) {
// // // // // // //       console.error("Error sending sample CSV:", err);
// // // // // // //       res.status(500).send("Could not download sample CSV");
// // // // // // //     }
// // // // // // //   });
// // // // // // // };

// // // // // // // // ----------------------------
// // // // // // // // Bulk create attendance records
// // // // // // // // ----------------------------
// // // // // // // async function createBulkAttendance(records) {
// // // // // // //   if (!records || records.length === 0) return [];

// // // // // // //   const values = [];
// // // // // // //   const valueStrings = records.map((r, i) => {
// // // // // // //     const offset = i * 7;
// // // // // // //     values.push(
// // // // // // //       r.student_id,
// // // // // // //       r.classroom_id,
// // // // // // //       r.date,
// // // // // // //       r.start_time,
// // // // // // //       r.end_time,
// // // // // // //       r.status,
// // // // // // //       r.remarks || ""
// // // // // // //     );
// // // // // // //     return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
// // // // // // //   });

// // // // // // //   const query = `
// // // // // // //     INSERT INTO pp.student_attendance
// // // // // // //       (student_id, classroom_id, date, start_time, end_time, status, remarks)
// // // // // // //     VALUES ${valueStrings.join(", ")}
// // // // // // //     ON CONFLICT (student_id, classroom_id, date, start_time, end_time)
// // // // // // //     DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks
// // // // // // //     RETURNING *;
// // // // // // //   `;

// // // // // // //   const result = await pool.query(query, values);
// // // // // // //   return result.rows;
// // // // // // // }

// // // // // // // // ----------------------------
// // // // // // // // Bulk attendance upload via JSON (manual + bulk submit)
// // // // // // // // ----------------------------
// // // // // // // const submitBulkAttendance = async (req, res) => {
// // // // // // //   try {
// // // // // // //     const { attendanceRecords } = req.body;

// // // // // // //     if (!attendanceRecords || !attendanceRecords.length) {
// // // // // // //       return res.status(400).json({ message: "No attendance records provided" });
// // // // // // //     }

// // // // // // //     const inserted = await createBulkAttendance(attendanceRecords);
// // // // // // //     res.status(201).json({ message: "Attendance uploaded", inserted });
// // // // // // //   } catch (err) {
// // // // // // //     console.error("Error uploading attendance:", err);
// // // // // // //     res
// // // // // // //       .status(500)
// // // // // // //       .json({ message: "Error uploading attendance", error: err.message });
// // // // // // //   }
// // // // // // // };

// // // // // // // const uploadCSVAttendance = async (req, res) => {
// // // // // // //   return res.status(200).json({ message: "CSV Upload route active" });
// // // // // // // };


// // // // // // // // ========================= CHECK OVERLAP =========================
// // // // // // // // Verifies if the selected class time overlaps with existing attendance
// // // // // // // const checkOverlap = async (req, res) => {
// // // // // // //   try {
// // // // // // //     const { classroomId, date, startTime, endTime } = req.query;

// // // // // // //     if (!classroomId || !date || !startTime || !endTime) {
// // // // // // //       return res.status(400).json({
// // // // // // //         overlap: false,
// // // // // // //         message: "Missing parameters classroomId, date, startTime, endTime"
// // // // // // //       });
// // // // // // //     }

// // // // // // //     // Convert to time hh:mm:ss if needed
// // // // // // //     const normalize = (t) => {
// // // // // // //       if (!t) return null;
// // // // // // //       if (t.length === 5) return t + ":00"; // 09:00 → 09:00:00
// // // // // // //       return t;
// // // // // // //     };

// // // // // // //     const start = normalize(startTime);
// // // // // // //     const end = normalize(endTime);

// // // // // // //     const query = `
// // // // // // //       SELECT *
// // // // // // //       FROM pp.student_attendance
// // // // // // //       WHERE classroom_id = $1
// // // // // // //         AND date = $2
// // // // // // //         AND (
// // // // // // //               (start_time <= $3 AND end_time >= $3) OR
// // // // // // //               (start_time <= $4 AND end_time >= $4) OR
// // // // // // //               ($3 <= start_time AND $4 >= end_time)
// // // // // // //         )
// // // // // // //       LIMIT 1;
// // // // // // //     `;

// // // // // // //     const result = await pool.query(query, [
// // // // // // //       classroomId, date, start, end
// // // // // // //     ]);

// // // // // // //     if (result.rows.length > 0) {
// // // // // // //       return res.status(200).json({
// // // // // // //         overlap: true,
// // // // // // //         conflict: result.rows[0],
// // // // // // //       });
// // // // // // //     }

// // // // // // //     return res.status(200).json({ overlap: false });
// // // // // // //   } catch (err) {
// // // // // // //     console.error("❌ checkOverlap error:", err);
// // // // // // //     return res.status(500).json({
// // // // // // //       overlap: false,
// // // // // // //       message: "Server error while checking overlap",
// // // // // // //     });
// // // // // // //   }
// // // // // // // };


// // // // // // // module.exports = {
// // // // // // //   previewCSVAttendance,
// // // // // // //   commitCSVAttendance,
// // // // // // //   undoLastAttendanceCommit,
// // // // // // //   fetchAttendance,
// // // // // // //   downloadSampleCSV,
// // // // // // //   submitBulkAttendance,
// // // // // // //   uploadCSVAttendance,
// // // // // // //   checkOverlap,
// // // // // // // };


// // // // // // // controllers/coordinator/attendanceController.js
// // // // // // // Part 1/3 - helpers + session lookup + CSV preview
// // // // // // const fs = require("fs");
// // // // // // const path = require("path");
// // // // // // const Papa = require("papaparse");
// // // // // // const pool = require("../../config/db");

// // // // // // // ---------------------- Helpers ----------------------

// // // // // // /**
// // // // // //  * Parse CSV file from path into rows (no header assumption)
// // // // // //  * returns array of rows (each row is array of cells)
// // // // // //  */
// // // // // // const parseCSV = async (filePath) =>
// // // // // //   new Promise((resolve, reject) => {
// // // // // //     const stream = fs.createReadStream(filePath);
// // // // // //     Papa.parse(stream, {
// // // // // //       header: false,
// // // // // //       skipEmptyLines: true,
// // // // // //       complete: (results) => resolve(results.data),
// // // // // //       error: (err) => reject(err),
// // // // // //     });
// // // // // //   });

// // // // // // /**
// // // // // //  * Convert fuzzy time strings into minutes since midnight.
// // // // // //  * Accepts "09:00", "9:00 AM", "9AM", "0900", "9.00pm" (best-effort).
// // // // // //  * Returns integer minutes or null.
// // // // // //  */
// // // // // // const parseTimeToMinutes = (raw) => {
// // // // // //   if (!raw && raw !== 0) return null;
// // // // // //   const s = String(raw).trim();

// // // // // //   // keep digits, colon, am/pm, spaces, remove weird unicode spaces
// // // // // //   const cleaned = s.replace(/\u202F|\u00A0/g, " ").replace(/[^\d:apmAPM ]/g, "").replace(/\s+/g, " ").trim();

// // // // // //   // HH:MM
// // // // // //   let m = cleaned.match(/^(\d{1,2}):(\d{2})$/);
// // // // // //   if (m) {
// // // // // //     const hh = parseInt(m[1], 10);
// // // // // //     const mm = parseInt(m[2], 10);
// // // // // //     if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) return hh * 60 + mm;
// // // // // //     return null;
// // // // // //   }

// // // // // //   // HH:MM AM/PM
// // // // // //   m = cleaned.match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])$/);
// // // // // //   if (m) {
// // // // // //     let hh = parseInt(m[1], 10);
// // // // // //     const mm = parseInt(m[2], 10);
// // // // // //     const ampm = m[3].toUpperCase();
// // // // // //     if (ampm === "PM" && hh < 12) hh += 12;
// // // // // //     if (ampm === "AM" && hh === 12) hh = 0;
// // // // // //     if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) return hh * 60 + mm;
// // // // // //     return null;
// // // // // //   }

// // // // // //   // 9AM / 9 PM
// // // // // //   m = cleaned.match(/^(\d{1,2})\s*([aApP][mM])$/);
// // // // // //   if (m) {
// // // // // //     let hh = parseInt(m[1], 10);
// // // // // //     const ampm = m[2].toUpperCase();
// // // // // //     if (ampm === "PM" && hh < 12) hh += 12;
// // // // // //     if (ampm === "AM" && hh === 12) hh = 0;
// // // // // //     if (hh >= 0 && hh < 24) return hh * 60;
// // // // // //     return null;
// // // // // //   }

// // // // // //   // fallback: digits like 0900 or 900
// // // // // //   m = cleaned.match(/(\d{3,4})/);
// // // // // //   if (m) {
// // // // // //     const sdigits = m[1];
// // // // // //     const hh = parseInt(sdigits.slice(0, sdigits.length - 2), 10);
// // // // // //     const mm = parseInt(sdigits.slice(-2), 10);
// // // // // //     if (!isNaN(hh) && !isNaN(mm) && hh >= 0 && hh < 24 && mm >= 0 && mm < 60) return hh * 60 + mm;
// // // // // //   }

// // // // // //   // last attempt: find first HH:MM anywhere
// // // // // //   m = cleaned.match(/(\d{1,2}):(\d{2})/);
// // // // // //   if (m) {
// // // // // //     const hh = parseInt(m[1], 10);
// // // // // //     const mm = parseInt(m[2], 10);
// // // // // //     if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) return hh * 60 + mm;
// // // // // //   }

// // // // // //   return null;
// // // // // // };

// // // // // // /**
// // // // // //  * Convert minutes -> "HH:MM:SS" or null
// // // // // //  */
// // // // // // const minutesToTimeString = (mins) => {
// // // // // //   if (mins === null || mins === undefined) return null;
// // // // // //   const h = Math.floor(mins / 60);
// // // // // //   const m = mins % 60;
// // // // // //   return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
// // // // // // };

// // // // // // /**
// // // // // //  * Normalize arbitrary time-like input to "HH:MM:SS" for DB insertion,
// // // // // //  * or return null.
// // // // // //  */
// // // // // // const normalizeToTimeString = (raw) => {
// // // // // //   if (!raw && raw !== 0) return null;
// // // // // //   const s = String(raw).trim();
// // // // // //   // if already in HH:MM or HH:MM:SS
// // // // // //   if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
// // // // // //     if (s.length === 5) return s + ":00";
// // // // // //     return s;
// // // // // //   }
// // // // // //   // parse fuzzy
// // // // // //   const mins = parseTimeToMinutes(raw);
// // // // // //   return mins === null ? null : minutesToTimeString(mins);
// // // // // // };

// // // // // // /**
// // // // // //  * Normalize time for comparisons (HH:MM format) - returns string 'HH:MM' or null
// // // // // //  */
// // // // // // const normalizeToHHMM = (raw) => {
// // // // // //   const t = normalizeToTimeString(raw);
// // // // // //   if (!t) return null;
// // // // // //   return t.slice(0, 5); // "HH:MM:SS" -> "HH:MM"
// // // // // // };

// // // // // // /**
// // // // // //  * Compute attendance percent given join/exit minutes against class start/end minutes
// // // // // //  */
// // // // // // const computePercent = (joinMins, exitMins, classStartMins, classEndMins) => {
// // // // // //   if (joinMins === null || exitMins === null || classStartMins === null || classEndMins === null) return 0;
// // // // // //   const classDur = classEndMins - classStartMins;
// // // // // //   if (!classDur || classDur <= 0) return 0;
// // // // // //   const attended = Math.max(0, Math.min(exitMins, classEndMins) - Math.max(joinMins, classStartMins));
// // // // // //   const pct = (attended / classDur) * 100;
// // // // // //   if (isNaN(pct)) return 0;
// // // // // //   return Math.max(0, Math.min(100, Math.round(pct * 100) / 100));
// // // // // // };

// // // // // // const normalizeStatusFromPercent = (pct) => {
// // // // // //   if (pct >= 75) return "PRESENT";
// // // // // //   if (pct >= 40) return "LATE JOINED";
// // // // // //   return "ABSENT";
// // // // // // };

// // // // // // // ---------------------- ROUTE: GET /attendance/session ----------------------
// // // // // // /**
// // // // // //  * getOrFindSession
// // // // // //  * Query params: classroom_id, session_date (YYYY-MM-DD), start_time (HH:MM[:SS]) optional end_time
// // // // // //  * Returns: { session_id: number|null, start_time, end_time }
// // // // // //  */
// // // // // // const getOrFindSession = async (req, res) => {
// // // // // //   try {
// // // // // //     const classroom_id = req.query.classroom_id || req.query.classroomId;
// // // // // //     const session_date = req.query.session_date || req.query.date;
// // // // // //     const start_time = req.query.start_time || req.query.startTime || null;
// // // // // //     const end_time = req.query.end_time || req.query.endTime || null;

// // // // // //     if (!classroom_id || !session_date) {
// // // // // //       return res.status(400).json({ message: "Missing classroom_id or session_date" });
// // // // // //     }

// // // // // //     // Normalize times to HH:MM for comparison
// // // // // //     const st_hhmm = start_time ? normalizeToHHMM(start_time) : null;
// // // // // //     const et_hhmm = end_time ? normalizeToHHMM(end_time) : null;

// // // // // //     // 1) Try exact match using HH:MM comparison (handles 09:00 vs 09:00:00)
// // // // // //     if (st_hhmm && et_hhmm) {
// // // // // //       const q = `
// // // // // //         SELECT session_id, start_time::text as start_time, end_time::text as end_time
// // // // // //         FROM pp.class_session
// // // // // //         WHERE classroom_id = $1 AND session_date = $2
// // // // // //           AND to_char(start_time, 'HH24:MI') = $3
// // // // // //           AND to_char(end_time, 'HH24:MI') = $4
// // // // // //         LIMIT 1
// // // // // //       `;
// // // // // //       const r = await pool.query(q, [classroom_id, session_date, st_hhmm, et_hhmm]);
// // // // // //       if (r.rows.length > 0) {
// // // // // //         return res.status(200).json({ session_id: r.rows[0].session_id, start_time: r.rows[0].start_time, end_time: r.rows[0].end_time });
// // // // // //       }
// // // // // //     }

// // // // // //     // 2) Fallback: return any session for that classroom+date (first by start_time)
// // // // // //     const r2 = await pool.query(
// // // // // //       `SELECT session_id, start_time::text as start_time, end_time::text as end_time
// // // // // //        FROM pp.class_session
// // // // // //        WHERE classroom_id = $1 AND session_date = $2
// // // // // //        ORDER BY start_time
// // // // // //        LIMIT 1`,
// // // // // //       [classroom_id, session_date]
// // // // // //     );
// // // // // //     if (r2.rows.length === 0) {
// // // // // //       return res.status(200).json({ session_id: null });
// // // // // //     }
// // // // // //     return res.status(200).json({ session_id: r2.rows[0].session_id, start_time: r2.rows[0].start_time, end_time: r2.rows[0].end_time });
// // // // // //   } catch (err) {
// // // // // //     console.error("getOrFindSession error:", err);
// // // // // //     return res.status(500).json({ message: "Error fetching session", error: err.message });
// // // // // //   }
// // // // // // };

// // // // // // // ---------------------- ROUTE: POST /attendance/csv/preview ----------------------
// // // // // // /**
// // // // // //  * previewCSVAttendance
// // // // // //  * Accepts uploaded CSV (file) and optional form fields: batch_id, classroom_id, session_date, timetable_id
// // // // // //  * Parses CSV on server, matches rows to students (via batch/classroom mapping), computes attendance percentage if start/end present.
// // // // // //  */
// // // // // // const previewCSVAttendance = async (req, res) => {
// // // // // //   try {
// // // // // //     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

// // // // // //     const filePath = req.file.path;
// // // // // //     const rows = await parseCSV(filePath);
// // // // // //     if (!rows || rows.length < 3) {
// // // // // //       try { fs.unlinkSync(filePath); } catch (e) {}
// // // // // //       return res.status(400).json({ message: "CSV needs header row, class-time row and at least one student row" });
// // // // // //     }

// // // // // //     // class-time row is expected at rows[1]: [ , classStart, classEnd ]
// // // // // //     const classStartRaw = rows[1][1] || null;
// // // // // //     const classEndRaw = rows[1][2] || null;
// // // // // //     const classStartMins = parseTimeToMinutes(classStartRaw);
// // // // // //     const classEndMins = parseTimeToMinutes(classEndRaw);

// // // // // //     // build csv students from row 2 onwards
// // // // // //     const csvStudents = [];
// // // // // //     for (let i = 2; i < rows.length; i++) {
// // // // // //       const rawCells = rows[i].map((c) => (c === undefined || c === null ? "" : String(c).trim()));
// // // // // //       const rawName = rawCells[0] || "";
// // // // // //       if (!rawName) continue;
// // // // // //       const rawJoin = rawCells[1] || "";
// // // // // //       const rawExit = rawCells[2] || "";
// // // // // //       const joinMins = rawJoin ? parseTimeToMinutes(rawJoin) : null;
// // // // // //       const exitMins = rawExit ? parseTimeToMinutes(rawExit) : null;
// // // // // //       const pct = computePercent(joinMins, exitMins, classStartMins, classEndMins);
// // // // // //       csvStudents.push({
// // // // // //         student_name: rawName,
// // // // // //         time_joined: rawJoin || null,
// // // // // //         time_exited: rawExit || null,
// // // // // //         _join_mins: joinMins,
// // // // // //         _exit_mins: exitMins,
// // // // // //         attendance_percent: pct,
// // // // // //         status: normalizeStatusFromPercent(pct),
// // // // // //       });
// // // // // //     }

// // // // // //     // optional mapping inputs
// // // // // //     const batchId = req.body.batch_id || req.body.batchId || null;
// // // // // //     const classroomId = req.body.classroom_id || req.body.classroomId || null;
// // // // // //     const sessionDate = req.body.session_date || req.body.date || null;
// // // // // //     const timetableId = req.body.timetable_id || null;

// // // // // //     // if timetable_id is provided, fetch its start/end (server-side)
// // // // // //     let timetableStart = null;
// // // // // //     let timetableEnd = null;
// // // // // //     if (timetableId) {
// // // // // //       try {
// // // // // //         const tq = await pool.query(`SELECT start_time::text AS start_time, end_time::text AS end_time FROM pp.timetable WHERE timetable_id = $1`, [timetableId]);
// // // // // //         if (tq.rows.length > 0) {
// // // // // //           timetableStart = tq.rows[0].start_time;
// // // // // //           timetableEnd = tq.rows[0].end_time;
// // // // // //         }
// // // // // //       } catch (e) {
// // // // // //         // ignore timetable fetch errors (preview still useful)
// // // // // //         console.warn("timetable lookup failed in preview:", e.message || e);
// // // // // //       }
// // // // // //     }

// // // // // //     // determine DB students for mapping
// // // // // //     let dbStudents = [];
// // // // // //     if (batchId) {
// // // // // //       const q = await pool.query(`SELECT student_id, student_name, batch_id FROM pp.student_master WHERE batch_id = $1`, [batchId]);
// // // // // //       dbStudents = q.rows;
// // // // // //     } else if (classroomId) {
// // // // // //       // classroom -> classroom_batch -> batch -> student_master
// // // // // //       const q = await pool.query(
// // // // // //         `SELECT sm.student_id, sm.student_name, sm.batch_id
// // // // // //          FROM pp.student_master sm
// // // // // //          JOIN pp.classroom_batch cb ON sm.batch_id = cb.batch_id
// // // // // //          WHERE cb.classroom_id = $1`,
// // // // // //         [classroomId]
// // // // // //       );
// // // // // //       dbStudents = q.rows;
// // // // // //     }

// // // // // //     // build name -> student lookup (lowercase trimmed)
// // // // // //     const nameToStudent = new Map();
// // // // // //     dbStudents.forEach((s) => {
// // // // // //       if (s.student_name) nameToStudent.set(String(s.student_name).toLowerCase().trim(), s);
// // // // // //     });

// // // // // //     const matched = [];
// // // // // //     const unmatched = [];
// // // // // //     const matchedNamesSet = new Set();

// // // // // //     for (const cs of csvStudents) {
// // // // // //       const key = String(cs.student_name).toLowerCase().trim();
// // // // // //       const lookup = nameToStudent.get(key);
// // // // // //       if (lookup) {
// // // // // //         matched.push({
// // // // // //           student_id: lookup.student_id,
// // // // // //           student_name: lookup.student_name,
// // // // // //           batch_id: lookup.batch_id,
// // // // // //           classroom_id: classroomId || null,
// // // // // //           time_joined: cs.time_joined,
// // // // // //           time_exited: cs.time_exited,
// // // // // //           attendance_percent: cs.attendance_percent,
// // // // // //           status: cs.status,
// // // // // //           matched: true,
// // // // // //         });
// // // // // //         matchedNamesSet.add(key);
// // // // // //       } else {
// // // // // //         unmatched.push({
// // // // // //           student_name: cs.student_name,
// // // // // //           time_joined: cs.time_joined,
// // // // // //           time_exited: cs.time_exited,
// // // // // //           attendance_percent: cs.attendance_percent,
// // // // // //           status: cs.status,
// // // // // //           matched: false,
// // // // // //         });
// // // // // //       }
// // // // // //     }

// // // // // //     // absentees = students in dbStudents not matched
// // // // // //     const absentees = [];
// // // // // //     if (dbStudents.length > 0) {
// // // // // //       for (const s of dbStudents) {
// // // // // //         const k = String(s.student_name).toLowerCase().trim();
// // // // // //         if (!matchedNamesSet.has(k)) {
// // // // // //           absentees.push({
// // // // // //             student_id: s.student_id,
// // // // // //             student_name: s.student_name,
// // // // // //             batch_id: s.batch_id,
// // // // // //             classroom_id: classroomId || null,
// // // // // //             time_joined: null,
// // // // // //             time_exited: null,
// // // // // //             attendance_percent: 0,
// // // // // //             status: "ABSENT",
// // // // // //             matched: false,
// // // // // //           });
// // // // // //         }
// // // // // //       }
// // // // // //     }

// // // // // //     // final preview rows (matched first then absentees)
// // // // // //     const previewRows = [...matched, ...absentees];

// // // // // //     // cleanup uploaded file
// // // // // //     try { fs.unlinkSync(filePath); } catch (e) {}

// // // // // //     // prepare response times: prefer timetable if available
// // // // // //     const respStart = timetableStart || (classStartRaw ? normalizeToTimeString(classStartRaw) : null);
// // // // // //     const respEnd = timetableEnd || (classEndRaw ? normalizeToTimeString(classEndRaw) : null);

// // // // // //     return res.status(200).json({
// // // // // //       classroom_id: classroomId || null,
// // // // // //       session_date: sessionDate || null,
// // // // // //       timetable_id: timetableId || null,
// // // // // //       start_time: respStart,
// // // // // //       end_time: respEnd,
// // // // // //       classDurationMins: (classStartMins !== null && classEndMins !== null) ? (classEndMins - classStartMins) : null,
// // // // // //       previewData: previewRows,
// // // // // //       unmatchedStudents: unmatched,
// // // // // //       absentees,
// // // // // //       matchedCount: matched.length,
// // // // // //       unmatchedCount: unmatched.length,
// // // // // //       absenteeCount: absentees.length,
// // // // // //       message: "Preview generated",
// // // // // //     });
// // // // // //   } catch (err) {
// // // // // //     console.error("previewCSVAttendance error:", err);
// // // // // //     return res.status(500).json({ message: "Error during CSV preview", error: err.message });
// // // // // //   }
// // // // // // };

// // // // // // // ======================= PART 2/3 =======================
// // // // // // // COMMIT CSV ATTENDANCE (STRICT BATCH ISOLATION)


// // // // // // const commitCSVAttendance = async (req, res) => {
// // // // // //   const client = await pool.connect();
// // // // // //   try {
// // // // // //     console.log("🔥 commitCSVAttendance REQ BODY:", req.body);

// // // // // //     const attendanceList =
// // // // // //       req.body.attendanceList || req.body.previewData || null;

// // // // // //     //const sessionDate = req.body.session_date;
// // // // // //     const sessionDate =
// // // // // //     req.body.session_date ||
// // // // // //     req.body.date ||
// // // // // //     req.body.attendanceDate ||
// // // // // //     null;

// // // // // //     const classroomId = req.body.classroom_id;
// // // // // //     const batchId = req.body.batch_id || req.body.batchId; // REQUIRED for isolation
// // // // // //     let startTimeRaw = req.body.start_time;
// // // // // //     let endTimeRaw = req.body.end_time;
// // // // // //     const timetableId = req.body.timetable_id || null;

// // // // // //     if (!attendanceList || attendanceList.length === 0)
// // // // // //       return res.status(400).json({ message: "No attendance data provided" });

// // // // // //     if (!sessionDate || !classroomId)
// // // // // //       return res
// // // // // //         .status(400)
// // // // // //         .json({ message: "Missing session_date or classroom_id" });

// // // // // //     if (!batchId)
// // // // // //       return res.status(400).json({
// // // // // //         message:
// // // // // //           "batch_id is required. Coordinators must upload only their batch.",
// // // // // //       });

// // // // // //     // ------------------------------------------
// // // // // //     // 1) If timetable is provided → override times
// // // // // //     // ------------------------------------------
// // // // // //     if (timetableId) {
// // // // // //       const tq = await client.query(
// // // // // //         `SELECT start_time::text, end_time::text 
// // // // // //          FROM pp.timetable 
// // // // // //          WHERE timetable_id = $1`,
// // // // // //         [timetableId]
// // // // // //       );
// // // // // //       if (tq.rows.length > 0) {
// // // // // //         startTimeRaw = tq.rows[0].start_time;
// // // // // //         endTimeRaw = tq.rows[0].end_time;
// // // // // //       }
// // // // // //     }

// // // // // //     // Normalize times (convert to HH:MM:SS)
// // // // // //     const start_ts = normalizeToTimeString(startTimeRaw);
// // // // // //     const end_ts = normalizeToTimeString(endTimeRaw);

// // // // // //     if (!start_ts || !end_ts) {
// // // // // //       return res.status(400).json({
// // // // // //         message: "Invalid start_time/end_time. Cannot commit.",
// // // // // //       });
// // // // // //     }

// // // // // //     // ------------------------------------------
// // // // // //     // 2) Find/create SESSION (NO CROSS-BATCH OVERLAP CHECK)
// // // // // //     // ------------------------------------------
// // // // // //     await client.query("BEGIN");

// // // // // //     const sesQ = await client.query(
// // // // // //       `
// // // // // //       SELECT session_id 
// // // // // //       FROM pp.class_session 
// // // // // //       WHERE classroom_id=$1 
// // // // // //         AND session_date=$2
// // // // // //         AND to_char(start_time,'HH24:MI') = to_char($3::time,'HH24:MI')
// // // // // //         AND to_char(end_time,'HH24:MI') = to_char($4::time,'HH24:MI')
// // // // // //       LIMIT 1
// // // // // //     `,
// // // // // //       [classroomId, sessionDate, start_ts, end_ts]
// // // // // //     );

// // // // // //     let sessionId = null;

// // // // // //     if (sesQ.rows.length > 0) {
// // // // // //       sessionId = sesQ.rows[0].session_id;
// // // // // //       console.log("🟢 Existing session reused:", sessionId);
// // // // // //     } else {
// // // // // //       // No conflict check → allowed for parallel batches
// // // // // //       const ins = await client.query(
// // // // // //         `
// // // // // //         INSERT INTO pp.class_session 
// // // // // //           (classroom_id, session_date, start_time, end_time, created_by)
// // // // // //         VALUES ($1,$2,$3,$4,$5)
// // // // // //         RETURNING session_id
// // // // // //       `,
// // // // // //         [classroomId, sessionDate, start_ts, end_ts, req.user?.user_id || null]
// // // // // //       );
// // // // // //       sessionId = ins.rows[0].session_id;
// // // // // //       console.log("🟢 Created new session:", sessionId);
// // // // // //     }

// // // // // //     // ------------------------------------------
// // // // // //     // 3) Normalize attendance rows
// // // // // //     // ------------------------------------------
// // // // // //     const normalized = attendanceList
// // // // // //       .map((r) => {
// // // // // //         if (!r.student_id) return null;

// // // // // //         // Only accept students belonging to this coordinator's batch
// // // // // //         if (Number(r.batch_id) !== Number(batchId)) return null;

// // // // // //         return {
// // // // // //           student_id: Number(r.student_id),
// // // // // //           status: (r.status || "ABSENT").toUpperCase(),
// // // // // //           time_joined: normalizeToTimeString(r.time_joined),
// // // // // //           time_exited: normalizeToTimeString(r.time_exited),
// // // // // //           attendance_percent: r.attendance_percent ?? 0,
// // // // // //           remarks: r.remarks || null,
// // // // // //         };
// // // // // //       })
// // // // // //       .filter(Boolean);

// // // // // //     if (normalized.length === 0)
// // // // // //       return res.status(400).json({
// // // // // //         message: "No valid students for this batch. Nothing to commit.",
// // // // // //       });

// // // // // //     // ------------------------------------------
// // // // // //     // 4) UPSERT attendance rows
// // // // // //     // ------------------------------------------
// // // // // //     const values = [];
// // // // // //     const placeholders = normalized.map((r, i) => {
// // // // // //       const off = i * 7;
// // // // // //       values.push(
// // // // // //         sessionId,
// // // // // //         r.student_id,
// // // // // //         r.status,
// // // // // //         r.time_joined,
// // // // // //         r.time_exited,
// // // // // //         r.attendance_percent,
// // // // // //         r.remarks
// // // // // //       );
// // // // // //       return `($${off + 1},$${off + 2},$${off + 3},$${off + 4}::time,$${
// // // // // //         off + 5
// // // // // //       }::time,$${off + 6},$${off + 7})`;
// // // // // //     });

// // // // // //     const upsertQuery = `
// // // // // //       INSERT INTO pp.student_attendance
// // // // // //         (session_id, student_id, status, time_joined, time_exited, attendance_percent, remarks)
// // // // // //       VALUES ${placeholders.join(",")}
// // // // // //       ON CONFLICT (session_id, student_id)
// // // // // //       DO UPDATE SET 
// // // // // //         status = EXCLUDED.status,
// // // // // //         time_joined = EXCLUDED.time_joined,
// // // // // //         time_exited = EXCLUDED.time_exited,
// // // // // //         attendance_percent = EXCLUDED.attendance_percent,
// // // // // //         remarks = EXCLUDED.remarks,
// // // // // //         updated_at = NOW()
// // // // // //     `;

// // // // // //     await client.query(upsertQuery, values);

// // // // // //     // ------------------------------------------
// // // // // //     // 5) ABSENTEES — ONLY FOR THE COORDINATOR’S BATCH
// // // // // //     // ------------------------------------------

// // // // // //     const dbStudents = await client.query(
// // // // // //       `SELECT student_id 
// // // // // //        FROM pp.student_master 
// // // // // //        WHERE batch_id=$1`,
// // // // // //       [batchId]
// // // // // //     );

// // // // // //     const batchStudentIds = dbStudents.rows.map((r) => Number(r.student_id));

// // // // // //     const submittedIds = new Set(normalized.map((r) => Number(r.student_id)));

// // // // // //     const absentIds = batchStudentIds.filter((id) => !submittedIds.has(id));

// // // // // //     if (absentIds.length > 0) {
// // // // // //       const vals = [];
// // // // // //       const rows = absentIds.map((sid, i) => {
// // // // // //         const off = i * 6;
// // // // // //         vals.push(sessionId, sid, "ABSENT", null, null, 0);
// // // // // //         return `($${off + 1},$${off + 2},$${off + 3},$${off + 4}::time,$${
// // // // // //           off + 5
// // // // // //         }::time,$${off + 6})`;
// // // // // //       });

// // // // // //       await client.query(
// // // // // //         `
// // // // // //         INSERT INTO pp.student_attendance
// // // // // //           (session_id, student_id, status, time_joined, time_exited, attendance_percent)
// // // // // //         VALUES ${rows.join(",")}
// // // // // //         ON CONFLICT (session_id, student_id) DO NOTHING
// // // // // //       `,
// // // // // //         vals
// // // // // //       );
// // // // // //     }

// // // // // //     await client.query("COMMIT");

// // // // // //     return res.status(200).json({
// // // // // //       message: "Attendance committed successfully",
// // // // // //       session_id: sessionId,
// // // // // //       committedCount: normalized.length,
// // // // // //       absentInserted: absentIds.length,
// // // // // //     });
// // // // // //   } catch (err) {
// // // // // //     console.error("❌ commitCSVAttendance ERROR:", err);
// // // // // //     try {
// // // // // //       await client.query("ROLLBACK");
// // // // // //     } catch (e) {}
// // // // // //     return res.status(500).json({ message: err.message });
// // // // // //   } finally {
// // // // // //     client.release();
// // // // // //   }
// // // // // // };

// // // // // // // --------------------------------------------------
// // // // // // // UNDO LAST COMMIT
// // // // // // // --------------------------------------------------

// // // // // // const undoLastAttendanceCommit = async (req, res) => {
// // // // // //   const client = await pool.connect();
// // // // // //   try {
// // // // // //     let sessionId = req.body.session_id || global.lastCommit?.session_id;

// // // // // //     if (!sessionId)
// // // // // //       return res.status(400).json({ message: "Missing session_id to undo" });

// // // // // //     await client.query("BEGIN");

// // // // // //     await client.query(
// // // // // //       `DELETE FROM pp.student_attendance WHERE session_id=$1`,
// // // // // //       [sessionId]
// // // // // //     );

// // // // // //     await client.query(
// // // // // //       `DELETE FROM pp.class_session WHERE session_id=$1`,
// // // // // //       [sessionId]
// // // // // //     );

// // // // // //     await client.query("COMMIT");

// // // // // //     global.lastCommit = null;

// // // // // //     return res.status(200).json({ message: "Undo successful" });
// // // // // //   } catch (err) {
// // // // // //     try {
// // // // // //       await client.query("ROLLBACK");
// // // // // //     } catch (e) {}
// // // // // //     return res.status(500).json({ message: "Undo failed", error: err });
// // // // // //   } finally {
// // // // // //     client.release();
// // // // // //   }
// // // // // // };

// // // // // // // ======================= PART 3/3 =======================

// // // // // // // ---------------------- ROUTE: GET /attendance (by session_id or filters) ----------------------
// // // // // // /**
// // // // // //  * fetchAttendance
// // // // // //  * Query params:
// // // // // //  * - session_id  -> returns attendance rows for that session, joined with student_master (preferred)
// // // // // //  * - fallback: cohortNumber, batchId, classroomId, date, startTime, endTime -> returns students + attendance (if sessions found)
// // // // // //  */
// // // // // // const fetchAttendance = async (req, res) => {
// // // // // //   try {
// // // // // //     const session_id = req.query.session_id || req.query.sessionId || null;
// // // // // //     if (session_id) {
// // // // // //       // Fetch attendance rows for that session and include student metadata.
// // // // // //       // Restrict students to those belonging to batches linked to the session's classroom (so coordinator sees only their batch's students).
// // // // // //       const q = `
// // // // // //         SELECT
// // // // // //           sm.student_id,
// // // // // //           sm.student_name,
// // // // // //           sm.enr_id,
// // // // // //           sm.contact_no1,
// // // // // //           sm.student_email,
// // // // // //           sa.status,
// // // // // //           sa.time_joined,
// // // // // //           sa.time_exited,
// // // // // //           sa.attendance_percent
// // // // // //         FROM pp.student_master sm
// // // // // //         LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1
// // // // // //         WHERE sm.batch_id IN (
// // // // // //           SELECT cb.batch_id FROM pp.classroom_batch cb
// // // // // //           JOIN pp.class_session cs ON cs.classroom_id = cb.classroom_id
// // // // // //           WHERE cs.session_id = $1
// // // // // //         )
// // // // // //         ORDER BY sm.student_name;
// // // // // //       `;
// // // // // //       const r = await pool.query(q, [session_id]);
// // // // // //       return res.status(200).json(r.rows || []);
// // // // // //     }

// // // // // //     // Fallback filters approach (find a matching session and return students + attendance)
// // // // // //     const cohortNumber = req.query.cohortNumber ? parseInt(req.query.cohortNumber) : null;
// // // // // //     const batchId = req.query.batchId ? parseInt(req.query.batchId) : null;
// // // // // //     const classroomId = req.query.classroomId ? parseInt(req.query.classroomId) : null;
// // // // // //     const date = req.query.date || null;
// // // // // //     const startTime = req.query.startTime || null;
// // // // // //     const endTime = req.query.endTime || null;

// // // // // //     // Normalize times to HH:MM if supplied
// // // // // //     const normalize = (t) => {
// // // // // //       if (!t) return null;
// // // // // //       if (t.length === 5) return t + ":00";
// // // // // //       return t;
// // // // // //     };
// // // // // //     const st = normalize(startTime);
// // // // // //     const et = normalize(endTime);

// // // // // //     // Find ONE session matching the classroom+date+time (if classroom given) using HH:MM comparison,
// // // // // //     // then return students for the requested batch/cohort and left-join attendance for that session.
// // // // // //     // If no session found, attendance fields will be NULL.
// // // // // //     let sessionRow = null;
// // // // // //     if (classroomId && date) {
// // // // // //       // Try exact session first
// // // // // //       if (st && et) {
// // // // // //         const q = `
// // // // // //           SELECT session_id, start_time::text as start_time, end_time::text as end_time
// // // // // //           FROM pp.class_session
// // // // // //           WHERE classroom_id = $1
// // // // // //             AND session_date = $2
// // // // // //             AND to_char(start_time,'HH24:MI') = to_char($3::time,'HH24:MI')
// // // // // //             AND to_char(end_time,'HH24:MI') = to_char($4::time,'HH24:MI')
// // // // // //           LIMIT 1
// // // // // //         `;
// // // // // //         const r = await pool.query(q, [classroomId, date, st, et]);
// // // // // //         if (r.rows.length > 0) sessionRow = r.rows[0];
// // // // // //       }
// // // // // //       // Fallback: pick first session on that date for classroom
// // // // // //       if (!sessionRow) {
// // // // // //         const r2 = await pool.query(
// // // // // //           `SELECT session_id, start_time::text as start_time, end_time::text as end_time FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 ORDER BY start_time LIMIT 1`,
// // // // // //           [classroomId, date]
// // // // // //         );
// // // // // //         if (r2.rows.length > 0) sessionRow = r2.rows[0];
// // // // // //       }
// // // // // //     }

// // // // // //     // Now fetch students for the given cohort/batch and left-join attendance for found session (if any)
// // // // // //     const sessionIdForJoin = sessionRow ? sessionRow.session_id : null;

// // // // // //     const qStudents = `
// // // // // //       SELECT
// // // // // //         sm.student_id,
// // // // // //         sm.student_name,
// // // // // //         sm.enr_id,
// // // // // //         sm.contact_no1,
// // // // // //         sm.student_email,
// // // // // //         COALESCE(sa.status, NULL) AS status,
// // // // // //         sa.time_joined,
// // // // // //         sa.time_exited,
// // // // // //         sa.attendance_percent,
// // // // // //         ${sessionIdForJoin ? `${sessionIdForJoin} AS session_id` : "NULL AS session_id"},
// // // // // //         ${sessionRow ? `'${sessionRow.start_time}'::text AS session_start_time` : "NULL AS session_start_time"},
// // // // // //         ${sessionRow ? `'${sessionRow.end_time}'::text AS session_end_time` : "NULL AS session_end_time"}
// // // // // //       FROM pp.student_master sm
// // // // // //       JOIN pp.batch b ON sm.batch_id = b.batch_id
// // // // // //       JOIN pp.cohort c ON b.cohort_number = c.cohort_number
// // // // // //       LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1
// // // // // //       WHERE ($2::int IS NULL OR c.cohort_number = $2)
// // // // // //         AND ($3::int IS NULL OR b.batch_id = $3)
// // // // // //       ORDER BY sm.student_name;
// // // // // //     `;

// // // // // //     const vals = [sessionIdForJoin || null, cohortNumber || null, batchId || null];
// // // // // //     const resStudents = await pool.query(qStudents, vals);
// // // // // //     return res.status(200).json(resStudents.rows || []);
// // // // // //   } catch (err) {
// // // // // //     console.error("fetchAttendance error:", err);
// // // // // //     return res.status(500).json({ message: "Error fetching attendance", error: err.message });
// // // // // //   }
// // // // // // };

// // // // // // // ---------------------- ROUTE: GET /attendance/csv/reference ----------------------
// // // // // // const downloadSampleCSV = (req, res) => {
// // // // // //   const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
// // // // // //   if (!fs.existsSync(filePath)) {
// // // // // //     return res.status(404).send("Sample CSV not found on server.");
// // // // // //   }
// // // // // //   res.download(filePath, "sample_attendance.csv", (err) => {
// // // // // //     if (err) {
// // // // // //       console.error("downloadSampleCSV error:", err);
// // // // // //       res.status(500).send("Could not download sample CSV");
// // // // // //     }
// // // // // //   });
// // // // // // };

// // // // // // // ---------------------- Bulk JSON upload helper & route ----------------------
// // // // // // /**
// // // // // //  * createBulkAttendance expects records with: session_id, student_id, status, time_joined, time_exited, attendance_percent, remarks
// // // // // //  */
// // // // // // async function createBulkAttendance(records) {
// // // // // //   if (!records || !records.length) return [];
// // // // // //   const values = [];
// // // // // //   const parts = records.map((r, i) => {
// // // // // //     const off = i * 7;
// // // // // //     values.push(r.session_id, r.student_id, r.status, r.time_joined, r.time_exited, r.attendance_percent, r.remarks || "");
// // // // // //     return `($${off + 1}, $${off + 2}, $${off + 3}, $${off + 4}::time, $${off + 5}::time, $${off + 6}::numeric, $${off + 7})`;
// // // // // //   });

// // // // // //   const q = `
// // // // // //     INSERT INTO pp.student_attendance
// // // // // //       (session_id, student_id, status, time_joined, time_exited, attendance_percent, remarks)
// // // // // //     VALUES ${parts.join(", ")}
// // // // // //     ON CONFLICT (session_id, student_id)
// // // // // //     DO UPDATE SET
// // // // // //       status = EXCLUDED.status,
// // // // // //       time_joined = EXCLUDED.time_joined,
// // // // // //       time_exited = EXCLUDED.time_exited,
// // // // // //       attendance_percent = EXCLUDED.attendance_percent,
// // // // // //       remarks = EXCLUDED.remarks,
// // // // // //       updated_at = NOW()
// // // // // //     RETURNING *;
// // // // // //   `;

// // // // // //   const r = await pool.query(q, values);
// // // // // //   return r.rows;
// // // // // // }

// // // // // // const submitBulkAttendance = async (req, res) => {
// // // // // //   try {
// // // // // //     const { attendanceRecords } = req.body;
// // // // // //     if (!attendanceRecords || !attendanceRecords.length) {
// // // // // //       return res.status(400).json({ message: "No attendance records provided" });
// // // // // //     }
// // // // // //     const inserted = await createBulkAttendance(attendanceRecords);
// // // // // //     return res.status(201).json({ message: "Attendance uploaded", inserted });
// // // // // //   } catch (err) {
// // // // // //     console.error("submitBulkAttendance error:", err);
// // // // // //     return res.status(500).json({ message: "Error uploading attendance", error: err.message });
// // // // // //   }
// // // // // // };

// // // // // // const uploadCSVAttendance = async (req, res) => {
// // // // // //   // placeholder endpoint (kept for compatibility)
// // // // // //   return res.status(200).json({ message: "CSV upload endpoint active (use /attendance/csv/preview for preview + commit)" });
// // // // // // };

// // // // // // // ---------------------- ROUTE: GET /attendance/check-overlap ----------------------
// // // // // // /**
// // // // // //  * checkOverlap
// // // // // //  * Query params: classroom_id, session_date, start_time, end_time
// // // // // //  * Returns overlap:true + conflict session if overlapping session exists
// // // // // //  */
// // // // // // // ---------------- CHECK OVERLAP (SAFE FOR BOTH PARAM NAMES) ----------------
// // // // // // const checkOverlap = async (req, res) => {
// // // // // //   try {
// // // // // //     const classroom_id =
// // // // // //       req.query.classroom_id ||
// // // // // //       req.query.classroomId;

// // // // // //     const session_date =
// // // // // //       req.query.session_date ||
// // // // // //       req.query.date;

// // // // // //     const start_time =
// // // // // //       req.query.start_time ||
// // // // // //       req.query.startTime;

// // // // // //     const end_time =
// // // // // //       req.query.end_time ||
// // // // // //       req.query.endTime;

// // // // // //     // If ANY important param missing → simply return NO OVERLAP
// // // // // //     if (!classroom_id || !session_date || !start_time || !end_time) {
// // // // // //       return res.status(200).json({ overlap: false });
// // // // // //     }

// // // // // //     const normalize = (t) => (t.length === 5 ? t + ":00" : t);

// // // // // //     const s = normalize(start_time);
// // // // // //     const e = normalize(end_time);

// // // // // //     // ⭐⭐ ALLOW SAME EXACT SESSION WITHOUT ERROR ⭐⭐
// // // // // //     const same = await pool.query(
// // // // // //       `SELECT session_id FROM pp.class_session 
// // // // // //        WHERE classroom_id=$1 AND session_date=$2 
// // // // // //        AND start_time=$3::time AND end_time=$4::time
// // // // // //        LIMIT 1`,
// // // // // //       [classroom_id, session_date, s, e]
// // // // // //     );

// // // // // //     if (same.rows.length > 0) {
// // // // // //       return res.status(200).json({ overlap: false });
// // // // // //     }

// // // // // //     // OTHER overlaps (only block different times)
// // // // // //     const r = await pool.query(
// // // // // //       `SELECT session_id, start_time, end_time
// // // // // //        FROM pp.class_session
// // // // // //        WHERE classroom_id=$1 AND session_date=$2
// // // // // //          AND (
// // // // // //             (start_time <= $3 AND end_time >= $3) OR
// // // // // //             (start_time <= $4 AND end_time >= $4) OR
// // // // // //             ($3 <= start_time AND $4 >= end_time)
// // // // // //          )
// // // // // //        LIMIT 1`,
// // // // // //       [classroom_id, session_date, s, e]
// // // // // //     );

// // // // // //     if (r.rows.length > 0) {
// // // // // //       return res.status(200).json({ overlap: true, conflict: r.rows[0] });
// // // // // //     }

// // // // // //     return res.status(200).json({ overlap: false });

// // // // // //   } catch (err) {
// // // // // //     console.error("checkOverlap error:", err);
// // // // // //     return res.status(200).json({ overlap: false }); // fail-open
// // // // // //   }
// // // // // // };


// // // // // // // ---------------------- Exports ----------------------
// // // // // // module.exports = {
// // // // // //   getOrFindSession,
// // // // // //   previewCSVAttendance,
// // // // // //   commitCSVAttendance,
// // // // // //   undoLastAttendanceCommit,
// // // // // //   fetchAttendance,
// // // // // //   downloadSampleCSV,
// // // // // //   submitBulkAttendance,
// // // // // //   uploadCSVAttendance,
// // // // // //   checkOverlap,
// // // // // // };



// // // // // const fs = require("fs");
// // // // // const path = require("path");
// // // // // const Papa = require("papaparse");
// // // // // const pool = require("../../config/db");

// // // // // // --- Helper: Duration Parser (Matches your Excel formula logic) ---
// // // // // const parseDurationToMinutes = (raw) => {
// // // // //     if (!raw) return 0;
// // // // //     const s = String(raw).toLowerCase();
// // // // //     let totalMinutes = 0;
// // // // //     const hrMatch = s.match(/(\d+)\s*hr/);
// // // // //     const minMatch = s.match(/(\d+)\s*min/);
// // // // //     const secMatch = s.match(/(\d+)\s*sec/);
    
// // // // //     if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
// // // // //     if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
// // // // //     if (secMatch) totalMinutes += (parseInt(secMatch[1], 10) / 60);
    
// // // // //     return Math.round(totalMinutes);
// // // // // };

// // // // // const normalizeTimeToDB = (raw) => {
// // // // //     if (!raw) return null;
// // // // //     const s = String(raw).trim();
// // // // //     if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? s + ":00" : s;
// // // // //     return s;
// // // // // };

// // // // // // 1. getOrFindSession
// // // // // const getOrFindSession = async (req, res) => {
// // // // //     try {
// // // // //         const { classroom_id, session_date, start_time } = req.query;
// // // // //         const q = `SELECT session_id, start_time::text, end_time::text, duration_minutes 
// // // // //                    FROM pp.class_session 
// // // // //                    WHERE classroom_id = $1 AND session_date = $2 
// // // // //                    AND to_char(start_time, 'HH24:MI') = to_char($3::time, 'HH24:MI') LIMIT 1`;
// // // // //         const r = await pool.query(q, [classroom_id, session_date, start_time]);
// // // // //         return res.status(200).json(r.rows[0] || { session_id: null });
// // // // //     } catch (err) { return res.status(500).json({ message: err.message }); }
// // // // // };

// // // // // // 2. fetchAttendance (Returns DB status if exists)
// // // // // const fetchAttendance = async (req, res) => {
// // // // //     try {
// // // // //         const { session_id, batchId } = req.query;
// // // // //         const q = `
// // // // //             SELECT sm.student_id, sm.student_name, sm.enr_id, sm.contact_no1, sm.student_email, sa.status as db_status 
// // // // //             FROM pp.student_master sm 
// // // // //             LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1 
// // // // //             WHERE sm.batch_id = $2 ORDER BY sm.student_name`;
// // // // //         const r = await pool.query(q, [session_id || null, batchId]);
// // // // //         res.status(200).json(r.rows);
// // // // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // // // };

// // // // // // 3. previewCSVAttendance (Matches ENTIRE string in Index 0 + Max Duration logic)
// // // // // const previewCSVAttendance = async (req, res) => {
// // // // //     try {
// // // // //         if (!req.file) return res.status(400).json({ message: "No file uploaded" });
// // // // //         const results = await new Promise((resolve, reject) => {
// // // // //             const stream = fs.createReadStream(req.file.path);
// // // // //             Papa.parse(stream, { skipEmptyLines: true, complete: (r) => resolve(r.data), error: (e) => reject(e) });
// // // // //         });

// // // // //         const batchId = req.body.batch_id;
// // // // //         const dbStudents = await pool.query(`SELECT student_id, student_name, enr_id, active_yn FROM pp.student_master WHERE batch_id = $1`, [batchId]);
        
// // // // //         // Group by Index 0 (Full String) - Keep MAX duration
// // // // //         const csvMap = new Map();
// // // // //         for (let i = 1; i < results.length; i++) {
// // // // //             const row = results[i];
// // // // //             if (!row[0]) continue;
// // // // //             const fullString = String(row[0]).trim();
// // // // //             const duration = parseDurationToMinutes(row[3]); 
// // // // //             if (!csvMap.has(fullString.toLowerCase()) || csvMap.get(fullString.toLowerCase()).duration_minutes < duration) {
// // // // //                 csvMap.set(fullString.toLowerCase(), { originalName: fullString, duration_minutes: duration, time_joined: row[4], time_exited: row[5] });
// // // // //             }
// // // // //         }

// // // // //         const previewData = [];
// // // // //         const unmatchedStudents = [];
// // // // //         const matchedIds = new Set();

// // // // //         for (let [key, data] of csvMap) {
// // // // //             const student = dbStudents.rows.find(s => s.student_name.trim().toLowerCase() === key);
// // // // //             if (student) {
// // // // //                 previewData.push({ student_id: student.student_id, student_name: student.student_name, enr_id: student.enr_id, duration_minutes: data.duration_minutes, time_joined: data.time_joined, time_exited: data.time_exited, status: data.duration_minutes >= 75 ? "PRESENT" : (data.duration_minutes >= 40 ? "LATE JOINED" : "ABSENT"), active_yn: student.active_yn });
// // // // //                 matchedIds.add(String(student.student_id));
// // // // //             } else {
// // // // //                 unmatchedStudents.push({ student_name: data.originalName });
// // // // //             }
// // // // //         }

// // // // //         const absentees = dbStudents.rows.filter(s => s.active_yn === 'ACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
// // // // //         const removed = dbStudents.rows.filter(s => s.active_yn === 'INACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));

// // // // //         fs.unlinkSync(req.file.path);
// // // // //         res.status(200).json({ previewData, unmatchedStudents, absentees, removed });
// // // // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // // // };

// // // // // // 4. commitCSVAttendance
// // // // // const commitCSVAttendance = async (req, res) => {
// // // // //     const client = await pool.connect();
// // // // //     try {
// // // // //         const { previewData, session_date, classroom_id, start_time, end_time } = req.body;
// // // // //         await client.query("BEGIN");
// // // // //         const sRes = await client.query(`INSERT INTO pp.class_session (classroom_id, session_date, start_time, end_time, duration_minutes) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (classroom_id, session_date, start_time, end_time) DO UPDATE SET updated_at = NOW() RETURNING session_id`, [classroom_id, session_date, start_time, end_time, 0]);
// // // // //         const sid = sRes.rows[0].session_id;
// // // // //         for (const r of previewData) {
// // // // //             if (!r.student_id) continue;
// // // // //             await client.query(`INSERT INTO pp.student_attendance (session_id, student_id, status, time_joined, time_exited, duration_minutes) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, duration_minutes = EXCLUDED.duration_minutes, time_joined = EXCLUDED.time_joined, time_exited = EXCLUDED.time_exited`, [sid, r.student_id, r.status, normalizeTimeToDB(r.time_joined), normalizeTimeToDB(r.time_exited), r.duration_minutes]);
// // // // //         }
// // // // //         await client.query("COMMIT");
// // // // //         res.status(200).json({ session_id: sid });
// // // // //     } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ message: err.message }); } 
// // // // //     finally { client.release(); }
// // // // // };

// // // // // const undoLastAttendanceCommit = async (req, res) => {
// // // // //     try { await pool.query(`DELETE FROM pp.student_attendance WHERE session_id = $1`, [req.body.session_id]); await pool.query(`DELETE FROM pp.class_session WHERE session_id = $1`, [req.body.session_id]); res.status(200).json({ message: "Undo Successful" }); } catch (err) { res.status(500).json({ message: err.message }); }
// // // // // };

// // // // // const checkOverlap = async (req, res) => {
// // // // //     const { classroomId, date, startTime, endTime } = req.query;
// // // // //     const r = await pool.query(`SELECT session_id FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`, [classroomId, date, startTime, endTime]);
// // // // //     res.json({ overlap: r.rows.length > 0 });
// // // // // };

// // // // // const downloadSampleCSV = (req, res) => { res.download(path.join(__dirname, "../../uploads/sample_attendance.csv")); };
// // // // // const submitBulkAttendance = async (req, res) => { res.status(200).json({ message: "Bulk submission logic active" }); };

// // // // // module.exports = { getOrFindSession, previewCSVAttendance, commitCSVAttendance, undoLastAttendanceCommit, fetchAttendance, downloadSampleCSV, submitBulkAttendance, checkOverlap };



// // // // const fs = require("fs");
// // // // const path = require("path");
// // // // const Papa = require("papaparse");
// // // // const pool = require("../../config/db");

// // // // // --- Helper: Your Exact Excel Logic for Duration ---
// // // // const parseDurationToMinutes = (raw) => {
// // // //     if (!raw) return 0;
// // // //     const s = String(raw).toLowerCase();
// // // //     let totalMinutes = 0;
// // // //     const hrMatch = s.match(/(\d+)\s*hr/);
// // // //     const minMatch = s.match(/(\d+)\s*min/);
// // // //     const secMatch = s.match(/(\d+)\s*sec/);
    
// // // //     if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
// // // //     if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
// // // //     if (secMatch) totalMinutes += (parseInt(secMatch[1], 10) / 60);
    
// // // //     return Math.round(totalMinutes);
// // // // };

// // // // // --- Helper: Convert Time string to Minutes from Midnight ---
// // // // const timeToMinutes = (raw) => {
// // // //     if (!raw) return 0;
// // // //     let s = String(raw).trim().toUpperCase();
// // // //     const match = s.match(/(\d+):(\d+)\s*(AM|PM)?/);
// // // //     if (!match) return 0;
// // // //     let hrs = parseInt(match[1], 10);
// // // //     let mins = parseInt(match[2], 10);
// // // //     const ampm = match[3];
// // // //     if (ampm === "PM" && hrs < 12) hrs += 12;
// // // //     if (ampm === "AM" && hrs === 12) hrs = 0;
// // // //     return hrs * 60 + mins;
// // // // };

// // // // const normalizeTimeToDB = (raw) => {
// // // //     if (!raw) return "00:00:00";
// // // //     const s = String(raw).trim();
// // // //     if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? s + ":00" : s;
// // // //     const match = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
// // // //     if (match) {
// // // //         let h = parseInt(match[1], 10);
// // // //         let m = parseInt(match[2], 10);
// // // //         const ampm = match[3].toUpperCase();
// // // //         if (ampm === "PM" && h < 12) h += 12;
// // // //         if (ampm === "AM" && h === 12) h = 0;
// // // //         return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
// // // //     }
// // // //     return s;
// // // // };

// // // // // 1. getOrFindSession
// // // // const getOrFindSession = async (req, res) => {
// // // //     try {
// // // //         const { classroom_id, session_date, start_time } = req.query;
// // // //         const normalizedStart = normalizeTimeToDB(start_time);
// // // //         const q = `SELECT session_id, start_time::text, end_time::text, duration_minutes FROM pp.class_session WHERE classroom_id = $1 AND session_date = $2 AND to_char(start_time, 'HH24:MI:SS') = $3 LIMIT 1`;
// // // //         const r = await pool.query(q, [classroom_id, session_date, normalizedStart]);
// // // //         return res.status(200).json(r.rows[0] || { session_id: null });
// // // //     } catch (err) { return res.status(500).json({ message: err.message }); }
// // // // };

// // // // // 2. fetchAttendance
// // // // const fetchAttendance = async (req, res) => {
// // // //     try {
// // // //         const { session_id, batchId } = req.query;
// // // //         const q = `SELECT sm.student_id, sm.student_name, sm.enr_id, sm.contact_no1, sm.student_email, sa.status as db_status FROM pp.student_master sm LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1 WHERE sm.batch_id = $2 ORDER BY sm.student_name`;
// // // //         const r = await pool.query(q, [session_id || null, batchId]);
// // // //         res.status(200).json(r.rows);
// // // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // // };

// // // // // 3. previewCSVAttendance (Groups by Full String Index 0 + Picks Max Duration)
// // // // const previewCSVAttendance = async (req, res) => {
// // // //     try {
// // // //         if (!req.file) return res.status(400).json({ message: "No file uploaded" });
// // // //         const results = await new Promise((resolve, reject) => {
// // // //             const stream = fs.createReadStream(req.file.path);
// // // //             Papa.parse(stream, { skipEmptyLines: true, complete: (r) => resolve(r.data), error: (e) => reject(e) });
// // // //         });

// // // //         const batchId = req.body.batch_id;
// // // //         const dbStudents = await pool.query(`SELECT student_id, student_name, enr_id, active_yn FROM pp.student_master WHERE batch_id = $1`, [batchId]);
        
// // // //         const csvMap = new Map();
// // // //         for (let i = 1; i < results.length; i++) {
// // // //             const row = results[i];
// // // //             if (!row[0]) continue;
// // // //             const fullStringInIndex0 = String(row[0]).trim();
// // // //             const duration = parseDurationToMinutes(row[3]); 
// // // //             if (!csvMap.has(fullStringInIndex0.toLowerCase()) || csvMap.get(fullStringInIndex0.toLowerCase()).duration_minutes < duration) {
// // // //                 csvMap.set(fullStringInIndex0.toLowerCase(), { originalName: fullStringInIndex0, duration_minutes: duration, time_joined: row[4], time_exited: row[5] });
// // // //             }
// // // //         }

// // // //         const previewData = [];
// // // //         const unmatchedStudents = [];
// // // //         const matchedIds = new Set();

// // // //         for (let [key, data] of csvMap) {
// // // //             const student = dbStudents.rows.find(s => s.student_name.trim().toLowerCase() === key);
// // // //             if (student) {
// // // //                 previewData.push({ student_id: student.student_id, student_name: student.student_name, enr_id: student.enr_id, duration_minutes: data.duration_minutes, time_joined: data.time_joined, time_exited: data.time_exited, status: data.duration_minutes >= 75 ? "PRESENT" : (data.duration_minutes >= 40 ? "LATE JOINED" : "ABSENT") });
// // // //                 matchedIds.add(String(student.student_id));
// // // //             } else {
// // // //                 unmatchedStudents.push({ student_name: data.originalName });
// // // //             }
// // // //         }

// // // //         const absentees = dbStudents.rows.filter(s => s.active_yn === 'ACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
// // // //         const removed = dbStudents.rows.filter(s => s.active_yn === 'INACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));

// // // //         fs.unlinkSync(req.file.path);
// // // //         res.status(200).json({ previewData, unmatchedStudents, absentees, removed });
// // // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // // };

// // // // // 4. commitCSVAttendance
// // // // const commitCSVAttendance = async (req, res) => {
// // // //     const client = await pool.connect();
// // // //     try {
// // // //         const { previewData, session_date, classroom_id, start_time, end_time } = req.body;
// // // //         await client.query("BEGIN");
        
// // // //         const sMins = timeToMinutes(start_time);
// // // //         const eMins = timeToMinutes(end_time);
// // // //         const totalSessionMins = (eMins > sMins) ? (eMins - sMins) : 0;

// // // //         const sRes = await client.query(`INSERT INTO pp.class_session (classroom_id, session_date, start_time, end_time, duration_minutes) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (classroom_id, session_date, start_time, end_time) DO UPDATE SET duration_minutes = EXCLUDED.duration_minutes, updated_at = NOW() RETURNING session_id`, [classroom_id, session_date, normalizeTimeToDB(start_time), normalizeTimeToDB(end_time), totalSessionMins]);
// // // //         const sid = sRes.rows[0].session_id;

// // // //         for (const r of previewData) {
// // // //             if (!r.student_id) continue;
// // // //             const attPct = totalSessionMins > 0 ? (r.duration_minutes / totalSessionMins) * 100 : 0;
// // // //             await client.query(`INSERT INTO pp.student_attendance (session_id, student_id, status, time_joined, time_exited, duration_minutes, attendance_percent) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, duration_minutes = EXCLUDED.duration_minutes, time_joined = EXCLUDED.time_joined, time_exited = EXCLUDED.time_exited, attendance_percent = EXCLUDED.attendance_percent`, [sid, r.student_id, r.status, normalizeTimeToDB(r.time_joined), normalizeTimeToDB(r.time_exited), r.duration_minutes, parseFloat(attPct.toFixed(2))]);
// // // //         }
// // // //         await client.query("COMMIT");
// // // //         res.status(200).json({ session_id: sid });
// // // //     } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ message: err.message }); } finally { client.release(); }
// // // // };

// // // // const undoLastAttendanceCommit = async (req, res) => {
// // // //     try { await pool.query(`DELETE FROM pp.student_attendance WHERE session_id = $1`, [req.body.session_id]); await pool.query(`DELETE FROM pp.class_session WHERE session_id = $1`, [req.body.session_id]); res.status(200).json({ message: "Undo Successful" }); } catch (err) { res.status(500).json({ message: err.message }); }
// // // // };

// // // // const checkOverlap = async (req, res) => {
// // // //     const { classroomId, date, startTime, endTime } = req.query;
// // // //     const r = await pool.query(`SELECT session_id FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`, [classroomId, date, startTime, endTime]);
// // // //     res.json({ overlap: r.rows.length > 0 });
// // // // };

// // // // const downloadSampleCSV = (req, res) => { res.download(path.join(__dirname, "../../uploads/sample_attendance.csv")); };
// // // // const submitBulkAttendance = async (req, res) => { res.status(200).json({ message: "Bulk submission logic active" }); };

// // // // module.exports = { getOrFindSession, previewCSVAttendance, commitCSVAttendance, undoLastAttendanceCommit, fetchAttendance, downloadSampleCSV, submitBulkAttendance, checkOverlap };



// // // const fs = require("fs");
// // // const path = require("path");
// // // const Papa = require("papaparse");
// // // const pool = require("../../config/db");

// // // // --- Helper: Exact Excel Logic for Duration ---
// // // const parseDurationToMinutes = (raw) => {
// // //     if (!raw) return 0;
// // //     const s = String(raw).toLowerCase();
// // //     let totalMinutes = 0;
// // //     const hrMatch = s.match(/(\d+)\s*hr/);
// // //     const minMatch = s.match(/(\d+)\s*min/);
// // //     const secMatch = s.match(/(\d+)\s*sec/);
    
// // //     if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
// // //     if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
// // //     if (secMatch) totalMinutes += (parseInt(secMatch[1], 10) / 60);
    
// // //     return Math.round(totalMinutes);
// // // };

// // // const timeToMinutes = (raw) => {
// // //     if (!raw) return 0;
// // //     let s = String(raw).trim().toUpperCase();
// // //     const match = s.match(/(\d+):(\d+)\s*(AM|PM)?/);
// // //     if (!match) return 0;
// // //     let h = parseInt(match[1], 10);
// // //     let m = parseInt(match[2], 10);
// // //     const ampm = match[3];
// // //     if (ampm === "PM" && h < 12) h += 12;
// // //     if (ampm === "AM" && h === 12) h = 0;
// // //     return h * 60 + m;
// // // };

// // // const normalizeTimeToDB = (raw) => {
// // //     if (!raw) return "00:00:00";
// // //     const s = String(raw).trim();
// // //     if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? s + ":00" : s;
// // //     const match = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
// // //     if (match) {
// // //         let h = parseInt(match[1], 10);
// // //         let m = parseInt(match[2], 10);
// // //         const ampm = match[3].toUpperCase();
// // //         if (ampm === "PM" && h < 12) h += 12;
// // //         if (ampm === "AM" && h === 12) h = 0;
// // //         return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
// // //     }
// // //     return s;
// // // };

// // // exports.getOrFindSession = async (req, res) => {
// // //     try {
// // //         const { classroom_id, session_date, start_time } = req.query;
// // //         const q = `SELECT session_id, start_time::text, end_time::text, duration_minutes FROM pp.class_session WHERE classroom_id = $1 AND session_date = $2 AND to_char(start_time, 'HH24:MI:SS') = $3 LIMIT 1`;
// // //         const r = await pool.query(q, [classroom_id, session_date, normalizeTimeToDB(start_time)]);
// // //         res.status(200).json(r.rows[0] || { session_id: null });
// // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // };

// // // exports.fetchAttendance = async (req, res) => {
// // //     try {
// // //         const { session_id, batchId } = req.query;
// // //         const q = `SELECT sm.student_id, sm.student_name, sm.enr_id, sm.contact_no1, sm.student_email, sa.status as db_status FROM pp.student_master sm LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1 WHERE sm.batch_id = $2 ORDER BY sm.student_name`;
// // //         const r = await pool.query(q, [session_id || null, batchId]);
// // //         res.status(200).json(r.rows);
// // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // };

// // // exports.previewCSVAttendance = async (req, res) => {
// // //     try {
// // //         if (!req.file) return res.status(400).json({ message: "No file" });
// // //         const results = await new Promise((resolve, reject) => {
// // //             const stream = fs.createReadStream(req.file.path);
// // //             Papa.parse(stream, { skipEmptyLines: true, complete: (r) => resolve(r.data), error: (e) => reject(e) });
// // //         });
// // //         const batchId = req.body.batch_id;
// // //         const dbStudents = await pool.query(`SELECT student_id, student_name, enr_id, active_yn FROM pp.student_master WHERE batch_id = $1`, [batchId]);
// // //         const csvMap = new Map();
// // //         for (let i = 1; i < results.length; i++) {
// // //             const row = results[i];
// // //             if (!row[0]) continue;
// // //             const fullString = String(row[0]).trim();
// // //             const duration = parseDurationToMinutes(row[3]); 
// // //             if (!csvMap.has(fullString.toLowerCase()) || csvMap.get(fullString.toLowerCase()).duration_minutes < duration) {
// // //                 csvMap.set(fullString.toLowerCase(), { originalName: fullString, duration_minutes: duration, time_joined: row[4], time_exited: row[5] });
// // //             }
// // //         }
// // //         const previewData = []; const unmatchedStudents = []; const matchedIds = new Set();
// // //         for (let [key, data] of csvMap) {
// // //             const student = dbStudents.rows.find(s => s.student_name.trim().toLowerCase() === key);
// // //             if (student) {
// // //                 previewData.push({ student_id: student.student_id, student_name: student.student_name, enr_id: student.enr_id, duration_minutes: data.duration_minutes, time_joined: data.time_joined, time_exited: data.time_exited, status: data.duration_minutes >= 75 ? "PRESENT" : (data.duration_minutes >= 40 ? "LATE JOINED" : "ABSENT") });
// // //                 matchedIds.add(String(student.student_id));
// // //             } else { unmatchedStudents.push({ student_name: data.originalName }); }
// // //         }
// // //         const absentees = dbStudents.rows.filter(s => s.active_yn === 'ACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
// // //         const removed = dbStudents.rows.filter(s => s.active_yn === 'INACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
// // //         fs.unlinkSync(req.file.path);
// // //         res.status(200).json({ previewData, unmatchedStudents, absentees, removed });
// // //     } catch (err) { res.status(500).json({ message: err.message }); }
// // // };

// // // exports.commitCSVAttendance = async (req, res) => {
// // //     const client = await pool.connect();
// // //     try {
// // //         const { previewData, session_date, classroom_id, start_time, end_time } = req.body;
// // //         await client.query("BEGIN");
// // //         const sMins = timeToMinutes(start_time); const eMins = timeToMinutes(end_time);
// // //         const totalSessionMins = (eMins > sMins) ? (eMins - sMins) : 0;
// // //         const sRes = await client.query(`INSERT INTO pp.class_session (classroom_id, session_date, start_time, end_time, duration_minutes) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (classroom_id, session_date, start_time, end_time) DO UPDATE SET duration_minutes = EXCLUDED.duration_minutes, updated_at = NOW() RETURNING session_id`, [classroom_id, session_date, normalizeTimeToDB(start_time), normalizeTimeToDB(end_time), totalSessionMins]);
// // //         const sid = sRes.rows[0].session_id;
// // //         for (const r of previewData) {
// // //             if (!r.student_id) continue;
// // //             const attPct = totalSessionMins > 0 ? (r.duration_minutes / totalSessionMins) * 100 : 0;
// // //             await client.query(`INSERT INTO pp.student_attendance (session_id, student_id, status, time_joined, time_exited, duration_minutes, attendance_percent) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, duration_minutes = EXCLUDED.duration_minutes, time_joined = EXCLUDED.time_joined, time_exited = EXCLUDED.time_exited, attendance_percent = EXCLUDED.attendance_percent`, [sid, r.student_id, r.status, normalizeTimeToDB(r.time_joined), normalizeTimeToDB(r.time_exited), r.duration_minutes, parseFloat(attPct.toFixed(2))]);
// // //         }
// // //         await client.query("COMMIT");
// // //         res.status(200).json({ session_id: sid });
// // //     } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ message: err.message }); } finally { client.release(); }
// // // };

// // // exports.undoLastAttendanceCommit = async (req, res) => {
// // //     try { await pool.query(`DELETE FROM pp.student_attendance WHERE session_id = $1`, [req.body.session_id]); await pool.query(`DELETE FROM pp.class_session WHERE session_id = $1`, [req.body.session_id]); res.status(200).json({ message: "Undo Successful" }); } catch (err) { res.status(500).json({ message: err.message }); }
// // // };

// // // exports.checkOverlap = async (req, res) => {
// // //     const { classroomId, date, startTime, endTime } = req.query;
// // //     const r = await pool.query(`SELECT session_id FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`, [classroomId, date, startTime, endTime]);
// // //     res.json({ overlap: r.rows.length > 0 });
// // // };

// // // exports.downloadSampleCSV = (req, res) => { res.download(path.join(__dirname, "../../uploads/sample_attendance.csv")); };
// // // exports.submitBulkAttendance = async (req, res) => { res.status(200).json({ message: "Bulk submission logic active" }); };



// // const fs = require("fs");
// // const path = require("path");
// // const Papa = require("papaparse");
// // const pool = require("../../config/db");

// // // --- Helper: Exact Excel Logic for Duration ---
// // const parseDurationToMinutes = (raw) => {
// //     if (!raw) return 0;
// //     const s = String(raw).toLowerCase();
// //     let totalMinutes = 0;
// //     const hrMatch = s.match(/(\d+)\s*hr/);
// //     const minMatch = s.match(/(\d+)\s*min/);
// //     const secMatch = s.match(/(\d+)\s*sec/);
// //     if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
// //     if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
// //     if (secMatch) totalMinutes += (parseInt(secMatch[1], 10) / 60);
// //     return Math.round(totalMinutes);
// // };

// // const normalizeTimeToDB = (raw) => {
// //     if (!raw) return "00:00:00";
// //     const s = String(raw).trim();
// //     if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? s + ":00" : s;
// //     return s;
// // };

// // exports.getOrFindSession = async (req, res) => {
// //     try {
// //         const { classroom_id, session_date, start_time } = req.query;
// //         const q = `SELECT session_id, start_time::text, end_time::text, duration_minutes FROM pp.class_session WHERE classroom_id = $1 AND session_date = $2 AND to_char(start_time, 'HH24:MI') = to_char($3::time, 'HH24:MI') LIMIT 1`;
// //         const r = await pool.query(q, [classroom_id, session_date, start_time]);
// //         res.status(200).json(r.rows[0] || { session_id: null });
// //     } catch (err) { res.status(500).json({ message: err.message }); }
// // };

// // exports.fetchAttendance = async (req, res) => {
// //     try {
// //         const { session_id, batchId } = req.query;
// //         const q = `SELECT sm.student_id, sm.student_name, sm.enr_id, sm.contact_no1, sm.student_email, sa.status as db_status FROM pp.student_master sm LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1 WHERE sm.batch_id = $2 ORDER BY sm.student_name`;
// //         const r = await pool.query(q, [session_id || null, batchId]);
// //         res.status(200).json(r.rows);
// //     } catch (err) { res.status(500).json({ message: err.message }); }
// // };

// // exports.previewCSVAttendance = async (req, res) => {
// //     try {
// //         if (!req.file) return res.status(400).json({ message: "No file" });
// //         const results = await new Promise((resolve, reject) => {
// //             const stream = fs.createReadStream(req.file.path);
// //             Papa.parse(stream, { skipEmptyLines: true, complete: (r) => resolve(r.data), error: (e) => reject(e) });
// //         });
// //         const batchId = req.body.batch_id;
// //         const dbStudents = await pool.query(`SELECT student_id, student_name, enr_id, active_yn FROM pp.student_master WHERE batch_id = $1`, [batchId]);
// //         const csvMap = new Map();
// //         for (let i = 1; i < results.length; i++) {
// //             const row = results[i];
// //             if (!row[0]) continue;
// //             const fullString = String(row[0]).trim();
// //             const duration = parseDurationToMinutes(row[3]); 
// //             if (!csvMap.has(fullString.toLowerCase()) || csvMap.get(fullString.toLowerCase()).duration_minutes < duration) {
// //                 csvMap.set(fullString.toLowerCase(), { originalName: fullString, duration_minutes: duration, time_joined: row[4], time_exited: row[5] });
// //             }
// //         }
// //         const previewData = []; const unmatchedStudents = []; const matchedIds = new Set();
// //         for (let [key, data] of csvMap) {
// //             const student = dbStudents.rows.find(s => s.student_name.trim().toLowerCase() === key);
// //             if (student) {
// //                 previewData.push({ student_id: student.student_id, student_name: student.student_name, enr_id: student.enr_id, duration_minutes: data.duration_minutes, time_joined: data.time_joined, time_exited: data.time_exited, status: data.duration_minutes >= 75 ? "PRESENT" : (data.duration_minutes >= 40 ? "LATE JOINED" : "ABSENT") });
// //                 matchedIds.add(String(student.student_id));
// //             } else { unmatchedStudents.push({ student_name: data.originalName }); }
// //         }
// //         const absentees = dbStudents.rows.filter(s => s.active_yn === 'ACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
// //         const removed = dbStudents.rows.filter(s => s.active_yn === 'INACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
// //         fs.unlinkSync(req.file.path);
// //         res.status(200).json({ previewData, unmatchedStudents, absentees, removed });
// //     } catch (err) { res.status(500).json({ message: err.message }); }
// // };

// // exports.commitCSVAttendance = async (req, res) => {
// //     const client = await pool.connect();
// //     try {
// //         const { previewData, session_date, classroom_id, start_time, end_time } = req.body;
// //         await client.query("BEGIN");
// //         const sRes = await client.query(`INSERT INTO pp.class_session (classroom_id, session_date, start_time, end_time, duration_minutes) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (classroom_id, session_date, start_time, end_time) DO UPDATE SET updated_at = NOW() RETURNING session_id`, [classroom_id, session_date, normalizeTimeToDB(start_time), normalizeTimeToDB(end_time), 0]);
// //         const sid = sRes.rows[0].session_id;
// //         for (const r of previewData) {
// //             if (!r.student_id) continue;
// //             await client.query(`INSERT INTO pp.student_attendance (session_id, student_id, status, time_joined, time_exited, duration_minutes) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, duration_minutes = EXCLUDED.duration_minutes, time_joined = EXCLUDED.time_joined, time_exited = EXCLUDED.time_exited`, [sid, r.student_id, r.status, normalizeTimeToDB(r.time_joined), normalizeTimeToDB(r.time_exited), r.duration_minutes]);
// //         }
// //         await client.query("COMMIT");
// //         res.status(200).json({ session_id: sid });
// //     } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ message: err.message }); } finally { client.release(); }
// // };

// // exports.undoLastAttendanceCommit = async (req, res) => {
// //     try { await pool.query(`DELETE FROM pp.student_attendance WHERE session_id = $1`, [req.body.session_id]); await pool.query(`DELETE FROM pp.class_session WHERE session_id = $1`, [req.body.session_id]); res.status(200).json({ message: "Undo Successful" }); } catch (err) { res.status(500).json({ message: err.message }); }
// // };

// // exports.checkOverlap = async (req, res) => {
// //     const { classroomId, date, startTime, endTime } = req.query;
// //     const r = await pool.query(`SELECT session_id FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`, [classroomId, date, startTime, endTime]);
// //     res.json({ overlap: r.rows.length > 0 });
// // };

// // exports.downloadSampleCSV = (req, res) => { res.download(path.join(__dirname, "../../uploads/sample_attendance.csv")); };
// // exports.submitBulkAttendance = async (req, res) => { res.status(200).json({ message: "Bulk submission logic active" }); };



// const fs = require("fs");
// const path = require("path");
// const Papa = require("papaparse");
// const pool = require("../../config/db");

// // --- Helper 1: Your Exact Excel Logic for Duration (hr/min/sec) ---
// const parseDurationToMinutes = (raw) => {
//     if (!raw || String(raw).toLowerCase() === "null") return 0;
//     const s = String(raw).toLowerCase();
//     let totalMinutes = 0;
//     const hrMatch = s.match(/(\d+)\s*hr/);
//     const minMatch = s.match(/(\d+)\s*min/);
//     const secMatch = s.match(/(\d+)\s*sec/);
//     if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
//     if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
//     if (secMatch) totalMinutes += (parseInt(secMatch[1], 10) / 60);
//     return Math.round(totalMinutes);
// };

// // --- Helper 2: Convert time string to minutes for Duration Calculations ---
// const timeToMinutes = (raw) => {
//     const timeStr = normalizeTimeToDB(raw);
//     if (!timeStr || timeStr === "00:00:00") return 0;
//     const [h, m] = timeStr.split(':').map(Number);
//     return h * 60 + m;
// };

// // --- Helper 3: Robust Normalization (Handles AM/PM and Unicode Spaces) ---
// const normalizeTimeToDB = (raw) => {
//     if (!raw || String(raw).trim() === "" || String(raw).toLowerCase() === "null") return "00:00:00";
    
//     // Remove narrow non-breaking spaces (\u202f) often found in CSVs
//     let s = String(raw).replace(/\u202f|\u00a0/g, " ").trim();

//     // 1. Check if it's already HH:MM or HH:MM:SS
//     if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
//         return s.length === 5 ? s + ":00" : s;
//     }

//     // 2. Check if it's 12-hour format with AM/PM
//     const ampmMatch = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
//     if (ampmMatch) {
//         let hrs = parseInt(ampmMatch[1], 10);
//         let mins = parseInt(ampmMatch[2], 10);
//         const ampm = ampmMatch[3].toUpperCase();
//         if (ampm === "PM" && hrs < 12) hrs += 12;
//         if (ampm === "AM" && hrs === 12) hrs = 0;
//         return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
//     }
//     return "00:00:00";
// };

// // 1. getOrFindSession
// exports.getOrFindSession = async (req, res) => {
//     try {
//         const { classroom_id, session_date, start_time } = req.query;
//         const normalizedStart = normalizeTimeToDB(start_time);
//         const q = `SELECT session_id, start_time::text, end_time::text, duration_minutes 
//                    FROM pp.class_session 
//                    WHERE classroom_id = $1 AND session_date = $2 
//                    AND to_char(start_time, 'HH24:MI:SS') = $3 LIMIT 1`;
//         const r = await pool.query(q, [classroom_id, session_date, normalizedStart]);
//         res.status(200).json(r.rows[0] || { session_id: null });
//     } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 2. fetchAttendance
// exports.fetchAttendance = async (req, res) => {
//     try {
//         const { session_id, batchId } = req.query;
//         const q = `SELECT sm.student_id, sm.student_name, sm.enr_id, sm.contact_no1, sm.student_email, sa.status as db_status 
//                    FROM pp.student_master sm 
//                    LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1 
//                    WHERE sm.batch_id = $2 ORDER BY sm.student_name`;
//         const r = await pool.query(q, [session_id || null, batchId]);
//         res.status(200).json(r.rows);
//     } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 3. previewCSVAttendance (Strict Index 0 Match + Max Duration logic)
// exports.previewCSVAttendance = async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "No file uploaded" });
//         const results = await new Promise((resolve, reject) => {
//             const stream = fs.createReadStream(req.file.path);
//             Papa.parse(stream, { skipEmptyLines: true, complete: (r) => resolve(r.data), error: (e) => reject(e) });
//         });

//         const batchId = req.body.batch_id;
//         const dbStudents = await pool.query(`SELECT student_id, student_name, enr_id, active_yn FROM pp.student_master WHERE batch_id = $1`, [batchId]);
        
//         // Group by Index 0 (Full Name) - Store max duration
//         const csvMap = new Map();
//         for (let i = 1; i < results.length; i++) {
//             const row = results[i];
//             if (!row[0]) continue;
//             const fullString = String(row[0]).trim();
//             const duration = parseDurationToMinutes(row[3]); // Index 3
//             if (!csvMap.has(fullString.toLowerCase()) || csvMap.get(fullString.toLowerCase()).duration_minutes < duration) {
//                 csvMap.set(fullString.toLowerCase(), { 
//                     originalName: fullString, 
//                     duration_minutes: duration, 
//                     time_joined: row[4], 
//                     time_exited: row[5] 
//                 });
//             }
//         }

//         const previewData = []; const unmatchedStudents = []; const matchedIds = new Set();
//         for (let [key, data] of csvMap) {
//             const student = dbStudents.rows.find(s => s.student_name.trim().toLowerCase() === key);
//             if (student) {
//                 previewData.push({ 
//                     student_id: student.student_id, 
//                     student_name: student.student_name, 
//                     enr_id: student.enr_id, 
//                     duration_minutes: data.duration_minutes, 
//                     time_joined: data.time_joined, 
//                     time_exited: data.time_exited, 
//                     status: data.duration_minutes >= 75 ? "PRESENT" : (data.duration_minutes >= 40 ? "LATE JOINED" : "ABSENT") 
//                 });
//                 matchedIds.add(String(student.student_id));
//             } else { 
//                 unmatchedStudents.push({ student_name: data.originalName }); 
//             }
//         }

//         const absentees = dbStudents.rows.filter(s => s.active_yn === 'ACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));
//         const removed = dbStudents.rows.filter(s => s.active_yn === 'INACTIVE' && !matchedIds.has(String(s.student_id))).map(s => ({ student_name: s.student_name }));

//         fs.unlinkSync(req.file.path);
//         res.status(200).json({ previewData, unmatchedStudents, absentees, removed });
//     } catch (err) { 
//         console.error("Preview Logic Error:", err);
//         res.status(500).json({ message: err.message }); 
//     }
// };

// // 4. commitCSVAttendance (FIXED: Calculates totals and percentages)
// exports.commitCSVAttendance = async (req, res) => {
//     const client = await pool.connect();
//     try {
//         const { previewData, session_date, classroom_id, start_time, end_time } = req.body;
//         await client.query("BEGIN");
        
//         // Calculate Total Session Duration
//         const startMins = timeToMinutes(start_time);
//         const endMins = timeToMinutes(end_time);
//         const totalSessionMins = (endMins > startMins) ? (endMins - startMins) : 0;

//         // 1. UPSERT Session
//         const sRes = await client.query(
//             `INSERT INTO pp.class_session (classroom_id, session_date, start_time, end_time, duration_minutes) 
//              VALUES ($1,$2,$3,$4,$5) 
//              ON CONFLICT (classroom_id, session_date, start_time, end_time) 
//              DO UPDATE SET duration_minutes = EXCLUDED.duration_minutes, updated_at = NOW() RETURNING session_id`, 
//             [classroom_id, session_date, normalizeTimeToDB(start_time), normalizeTimeToDB(end_time), totalSessionMins]
//         );
//         const sid = sRes.rows[0].session_id;

//         // 2. UPSERT Student Attendance
//         for (const r of previewData) {
//             if (!r.student_id) continue;
            
//             // Calculate percentage based on total session time vs student's attended time
//             const attPct = totalSessionMins > 0 ? (r.duration_minutes / totalSessionMins) * 100 : 0;

//             await client.query(
//                 `INSERT INTO pp.student_attendance 
//                     (session_id, student_id, status, time_joined, time_exited, duration_minutes, attendance_percent) 
//                  VALUES ($1,$2,$3,$4,$5,$6,$7) 
//                  ON CONFLICT (session_id, student_id) 
//                  DO UPDATE SET 
//                     status = EXCLUDED.status, 
//                     duration_minutes = EXCLUDED.duration_minutes, 
//                     time_joined = EXCLUDED.time_joined, 
//                     time_exited = EXCLUDED.time_exited,
//                     attendance_percent = EXCLUDED.attendance_percent,
//                     updated_at = NOW()`, 
//                 [
//                     sid, 
//                     r.student_id, 
//                     r.status, 
//                     normalizeTimeToDB(r.time_joined), 
//                     normalizeTimeToDB(r.time_exited), 
//                     r.duration_minutes || 0,
//                     Math.min(100, parseFloat(attPct.toFixed(2)))
//                 ]
//             );
//         }
//         await client.query("COMMIT");
//         res.status(200).json({ session_id: sid });
//     } catch (err) { 
//         await client.query("ROLLBACK"); 
//         console.error("COMMIT DATABASE FATAL ERROR:", err.message);
//         res.status(500).json({ message: "Commit failed: " + err.message }); 
//     } finally { client.release(); }
// };

// exports.undoLastAttendanceCommit = async (req, res) => {
//     try { 
//         await pool.query(`DELETE FROM pp.student_attendance WHERE session_id = $1`, [req.body.session_id]); 
//         await pool.query(`DELETE FROM pp.class_session WHERE session_id = $1`, [req.body.session_id]); 
//         res.status(200).json({ message: "Undo Successful" }); 
//     } catch (err) { res.status(500).json({ message: err.message }); }
// };

// exports.checkOverlap = async (req, res) => {
//     const { classroomId, date, startTime, endTime } = req.query;
//     const r = await pool.query(`SELECT session_id FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`, [classroomId, date, startTime, endTime]);
//     res.json({ overlap: r.rows.length > 0 });
// };

// exports.downloadSampleCSV = (req, res) => { 
//     const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
//     res.download(filePath); 
// };

// exports.submitBulkAttendance = async (req, res) => { res.status(200).json({ message: "Bulk logic active" }); };



const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const pool = require("../../config/db");

// --- Helper 1: Parse "1 hr 25 min" into Total Minutes ---
const parseDurationToMinutes = (raw) => {
    if (!raw || String(raw).toLowerCase() === "null") return 0;
    const s = String(raw).toLowerCase();
    let totalMinutes = 0;
    const hrMatch = s.match(/(\d+)\s*hr/);
    const minMatch = s.match(/(\d+)\s*min/);
    const secMatch = s.match(/(\d+)\s*sec/);
    if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    if (secMatch) totalMinutes += (parseInt(secMatch[1], 10) / 60);
    return Math.round(totalMinutes);
};

// --- Helper 2: Convert time string to minutes ---
const timeToMinutes = (raw) => {
    const timeStr = normalizeTimeToDB(raw);
    if (!timeStr || timeStr === "00:00:00") return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// --- Helper 3: Robust Normalization for Postgres TIME ---
const normalizeTimeToDB = (raw) => {
    if (!raw || String(raw).trim() === "" || String(raw).toLowerCase() === "null") return "00:00:00";
    let s = String(raw).replace(/\u202f|\u00a0/g, " ").trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? s + ":00" : s;
    const ampmMatch = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampmMatch) {
        let hrs = parseInt(ampmMatch[1], 10);
        let mins = parseInt(ampmMatch[2], 10);
        const ampm = ampmMatch[3].toUpperCase();
        if (ampm === "PM" && hrs < 12) hrs += 12;
        if (ampm === "AM" && hrs === 12) hrs = 0;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
    }
    return "00:00:00";
};

// 1. getOrFindSession (Find existing session based on filters)
exports.getOrFindSession = async (req, res) => {
    try {
        const { classroom_id, session_date, start_time } = req.query;
        const normalizedStart = normalizeTimeToDB(start_time);
        const q = `SELECT session_id, start_time::text, end_time::text, duration_minutes 
                   FROM pp.class_session 
                   WHERE classroom_id = $1 AND session_date = $2 
                   AND to_char(start_time, 'HH24:MI:SS') = $3 LIMIT 1`;
        const r = await pool.query(q, [classroom_id, session_date, normalizedStart]);
        res.status(200).json(r.rows[0] || { session_id: null });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. fetchAttendance (Manual Tab)
// Shows Active students OR anyone who was previously marked for this session
exports.fetchAttendance = async (req, res) => {
    try {
        const { session_id, batchId } = req.query;
        const q = `
            SELECT sm.student_id, sm.student_name, sm.enr_id, sm.contact_no1, sm.student_email, sm.active_yn, sa.status as db_status 
            FROM pp.student_master sm 
            LEFT JOIN pp.student_attendance sa ON sa.student_id = sm.student_id AND sa.session_id = $1 
            WHERE sm.batch_id = $2 
            AND (sm.active_yn = 'ACTIVE' OR sa.session_id IS NOT NULL)
            ORDER BY sm.student_name`;
        const r = await pool.query(q, [session_id || null, batchId]);
        res.status(200).json(r.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 3. previewCSVAttendance (Bulk Upload Logic)
exports.previewCSVAttendance = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        const results = await new Promise((resolve, reject) => {
            const stream = fs.createReadStream(req.file.path);
            Papa.parse(stream, { skipEmptyLines: true, complete: (r) => resolve(r.data), error: (e) => reject(e) });
        });

        if (results.length < 2) return res.status(400).json({ message: "CSV missing data rows." });

        // Total Duration from Row 2 (Index 1), Column D (Index 3)
        const summaryDurationRaw = results[1][3]; 
        const totalCSVDurationMins = parseDurationToMinutes(summaryDurationRaw);

        const batchId = req.body.batch_id;
        const dbStudentsRes = await pool.query(
            `SELECT student_id, student_name, enr_id, active_yn FROM pp.student_master WHERE batch_id = $1`, 
            [batchId]
        );
        const dbStudents = dbStudentsRes.rows;
        
        // Map CSV data - STRICTLY COLUMN A (Index 0)
        const csvMap = new Map();
        for (let i = 2; i < results.length; i++) {
            const row = results[i];
            const rawNameColumnA = String(row[0] || "").trim();
            if (!rawNameColumnA) continue;

            const nameKey = rawNameColumnA.toLowerCase();
            const duration = parseDurationToMinutes(row[3]); 

            if (!csvMap.has(nameKey) || csvMap.get(nameKey).duration_minutes < duration) {
                csvMap.set(nameKey, { 
                    originalName: rawNameColumnA, 
                    duration_minutes: duration, 
                    time_joined: row[4], 
                    time_exited: row[5] 
                });
            }
        }

        const previewData = []; 
        const unmatchedStudents = []; 
        const inactiveStudents = [];
        const matchedCSVKeys = new Set();

        for (const student of dbStudents) {
            const dbNameClean = student.student_name.trim().toLowerCase();
            let matchedCsvData = null;
            let matchedKey = null;

            // FUZZY SEARCH: DB name inside CSV Column A
            for (let [csvKey, data] of csvMap) {
                if (csvKey.includes(dbNameClean)) {
                    matchedCsvData = data;
                    matchedKey = csvKey;
                    break; 
                }
            }

            // Categorize Inactive Students separately
            if (student.active_yn !== 'ACTIVE') {
                if (matchedCsvData) {
                    inactiveStudents.push({ 
                        student_name: student.student_name, 
                        duration_minutes: matchedCsvData.duration_minutes 
                    });
                    matchedCSVKeys.add(matchedKey);
                }
                continue;
            }

            if (matchedCsvData) {
                const pct = totalCSVDurationMins > 0 ? (matchedCsvData.duration_minutes / totalCSVDurationMins) * 100 : 0;
                previewData.push({ 
                    student_id: student.student_id, 
                    student_name: student.student_name, 
                    enr_id: student.enr_id, 
                    duration_minutes: matchedCsvData.duration_minutes, 
                    time_joined: matchedCsvData.time_joined, 
                    time_exited: matchedCsvData.time_exited, 
                    status: pct >= 75 ? "PRESENT" : (pct >= 40 ? "LATE JOINED" : "ABSENT")
                });
                matchedCSVKeys.add(matchedKey);
            } else {
                // Active but missing in CSV = ABSENT
                previewData.push({ 
                    student_id: student.student_id, student_name: student.student_name, enr_id: student.enr_id, 
                    duration_minutes: 0, time_joined: "N/A", time_exited: "N/A", status: "ABSENT"
                });
            }
        }

        // CSV rows that matched nothing
        for (let [key, data] of csvMap) {
            if (!matchedCSVKeys.has(key)) {
                unmatchedStudents.push({ student_name: data.originalName, duration_minutes: data.duration_minutes });
            }
        }

        previewData.sort((a, b) => a.student_name.localeCompare(b.student_name));
        fs.unlinkSync(req.file.path);
        res.status(200).json({ previewData, unmatchedStudents, inactiveStudents });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 4. commitCSVAttendance
exports.commitCSVAttendance = async (req, res) => {
    const client = await pool.connect();
    try {
        const { previewData, session_date, classroom_id, start_time, end_time } = req.body;
        await client.query("BEGIN");
        const startMins = timeToMinutes(start_time);
        const endMins = timeToMinutes(end_time);
        const totalSessionMins = (endMins > startMins) ? (endMins - startMins) : 0;

        const sRes = await client.query(
            `INSERT INTO pp.class_session (classroom_id, session_date, start_time, end_time, duration_minutes) 
             VALUES ($1,$2,$3,$4,$5) 
             ON CONFLICT (classroom_id, session_date, start_time, end_time) 
             DO UPDATE SET duration_minutes = EXCLUDED.duration_minutes, updated_at = NOW() RETURNING session_id`, 
            [classroom_id, session_date, normalizeTimeToDB(start_time), normalizeTimeToDB(end_time), totalSessionMins]
        );
        const sid = sRes.rows[0].session_id;

        for (const r of previewData) {
            if (!r.student_id) continue;
            const attPct = totalSessionMins > 0 ? (r.duration_minutes / totalSessionMins) * 100 : 0;
            await client.query(
                `INSERT INTO pp.student_attendance 
                    (session_id, student_id, status, time_joined, time_exited, duration_minutes, attendance_percent) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7) 
                 ON CONFLICT (session_id, student_id) 
                 DO UPDATE SET 
                    status = EXCLUDED.status, duration_minutes = EXCLUDED.duration_minutes, 
                    time_joined = EXCLUDED.time_joined, time_exited = EXCLUDED.time_exited,
                    attendance_percent = EXCLUDED.attendance_percent, updated_at = NOW()`, 
                [sid, r.student_id, r.status, normalizeTimeToDB(r.time_joined), normalizeTimeToDB(r.time_exited), r.duration_minutes || 0, Math.min(100, parseFloat(attPct.toFixed(2)))]
            );
        }
        await client.query("COMMIT");
        res.status(200).json({ session_id: sid });
    } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ message: "Commit failed: " + err.message }); } 
    finally { client.release(); }
};

exports.undoLastAttendanceCommit = async (req, res) => {
    try { 
        await pool.query(`DELETE FROM pp.student_attendance WHERE session_id = $1`, [req.body.session_id]); 
        await pool.query(`DELETE FROM pp.class_session WHERE session_id = $1`, [req.body.session_id]); 
        res.status(200).json({ message: "Undo Successful" }); 
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.checkOverlap = async (req, res) => {
    const { classroomId, date, startTime, endTime } = req.query;
    const r = await pool.query(`SELECT session_id FROM pp.class_session WHERE classroom_id=$1 AND session_date=$2 AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`, [classroomId, date, startTime, endTime]);
    res.json({ overlap: r.rows.length > 0 });
};

exports.downloadSampleCSV = (req, res) => { 
    const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
    res.download(filePath); 
};

exports.submitBulkAttendance = async (req, res) => { res.status(200).json({ message: "Bulk submission logic active" }); };