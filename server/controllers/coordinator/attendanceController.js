// // const {
// //   getAttendanceByFilters,
// //   createBulkAttendance,
// //   processCSVAttendance,
// // } = require("../../models/coordinator/attendanceModel");
// // const fs = require("fs");
// // const path = require("path");

// // // ----------------------------
// // // Fetch attendance (by cohort, batch, classroom, date, time)
// // // ----------------------------
// // const fetchAttendance = async (req, res) => {
// //   try {
// //     // ✅ Use query params from the frontend request
// //     // Fix: Changed cohortId to cohortNumber to match the model
// //     const { cohortNumber, batchId, classroomId, date, startTime, endTime } = req.query;

// //     if (!cohortNumber && !batchId && !classroomId && !date) {
// //       return res.status(400).json({
// //         message: "At least one filter (cohortNumber, batchId, classroomId, date) is required",
// //       });
// //     }

// //     // Corrected: Create a single filters object to pass to the model function
// //     const filters = {
// //       // Fix: Use cohortNumber here
// //       cohortNumber: cohortNumber ? parseInt(cohortNumber) : null,
// //       batchId: batchId ? parseInt(batchId) : null,
// //       classroomId: classroomId ? parseInt(classroomId) : null,
// //       date: date || null,
// //       startTime: startTime || null,
// //       endTime: endTime || null,
// //     };

// //     const data = await getAttendanceByFilters(filters);

// //     res.status(200).json(data || []);
// //   } catch (err) {
// //     console.error("Error fetching attendance:", err);
// //     res.status(500).json({ message: "Error fetching attendance", error: err.message });
// //   }
// // };

// // // ----------------------------
// // // Bulk attendance upload via JSON
// // // ----------------------------
// // const submitBulkAttendance = async (req, res) => {
// //   try {
// //     const { attendanceRecords } = req.body;

// //     if (!attendanceRecords || !attendanceRecords.length) {
// //       return res.status(400).json({ message: "No attendance records provided" });
// //     }

// //     const inserted = await createBulkAttendance(attendanceRecords);
// //     res.status(201).json({ message: "Attendance uploaded", inserted });
// //   } catch (err) {
// //     console.error("Error uploading attendance:", err);
// //     res.status(500).json({ message: "Error uploading attendance", error: err.message });
// //   }
// // };

// // // ----------------------------
// // // Bulk attendance upload via CSV
// // // ----------------------------
// // const uploadCSVAttendance = async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({ message: "CSV file not provided" });
// //     }

// //     const { classroom_id, date, teacherStartTime, teacherEndTime } = req.body;

// //     if (!classroom_id || !date || !teacherStartTime || !teacherEndTime) {
// //       return res.status(400).json({ message: "Required form data missing" });
// //     }

// //     const filePath = path.join(__dirname, "../../uploads", req.file.filename);

// //     const { inserted, errors } = await processCSVAttendance(
// //       filePath,
// //       parseInt(classroom_id),
// //       date,
// //       teacherStartTime,
// //       teacherEndTime
// //     );

// //     // Delete uploaded CSV after processing
// //     fs.unlinkSync(filePath);

// //     res.status(201).json({ message: "CSV attendance processed", inserted, errors });
// //   } catch (err) {
// //     console.error("Error processing CSV attendance:", err);
// //     res.status(500).json({ message: "Error processing CSV attendance", error: err.message });
// //   }
// // };

// // // ----------------------------
// // // Download sample CSV
// // // ----------------------------
// // const downloadSampleCSV = (req, res) => {
// //   const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
// //   res.download(filePath, "sample_attendance.csv", (err) => {
// //     if (err) {
// //       console.error("Error sending sample CSV:", err);
// //       res.status(500).send("Could not download sample CSV");
// //     }
// //   });
// // };

// // module.exports = {
// //   fetchAttendance,
// //   submitBulkAttendance,
// //   uploadCSVAttendance,
// //   downloadSampleCSV,
// // };


// const {
//   getAttendanceByFilters,
//   createBulkAttendance,
//   processCSVAttendance,
//   getStudentsByClassroom, // 👈 new model function: fetch students
// } = require("../../models/coordinator/attendanceModel");
// const fs = require("fs");
// const path = require("path");
// const { Parser } = require("json2csv");

// // ----------------------------
// // Fetch attendance (by cohort, batch, classroom, date, time)
// // ----------------------------
// const fetchAttendance = async (req, res) => {
//   try {
//     const { cohortNumber, batchId, classroomId, date, startTime, endTime } = req.query;

//     if (!cohortNumber && !batchId && !classroomId && !date) {
//       return res.status(400).json({
//         message:
//           "At least one filter (cohortNumber, batchId, classroomId, date) is required",
//       });
//     }

//     const filters = {
//       cohortNumber: cohortNumber ? parseInt(cohortNumber) : null,
//       batchId: batchId ? parseInt(batchId) : null,
//       classroomId: classroomId ? parseInt(classroomId) : null,
//       date: date || null,
//       startTime: startTime || null,
//       endTime: endTime || null,
//     };

//     const data = await getAttendanceByFilters(filters);

//     res.status(200).json(data || []);
//   } catch (err) {
//     console.error("Error fetching attendance:", err);
//     res
//       .status(500)
//       .json({ message: "Error fetching attendance", error: err.message });
//   }
// };

// // ----------------------------
// // Bulk attendance upload via JSON (manual + bulk submit)
// // ----------------------------
// const submitBulkAttendance = async (req, res) => {
//   try {
//     const { attendanceRecords } = req.body;

//     if (!attendanceRecords || !attendanceRecords.length) {
//       return res.status(400).json({ message: "No attendance records provided" });
//     }

//     const inserted = await createBulkAttendance(attendanceRecords);
//     res.status(201).json({ message: "Attendance uploaded", inserted });
//   } catch (err) {
//     console.error("Error uploading attendance:", err);
//     res
//       .status(500)
//       .json({ message: "Error uploading attendance", error: err.message });
//   }
// };

// // ----------------------------
// // CSV Upload → Preview only (no DB insert yet)
// // ----------------------------
// const previewCSVAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "CSV file not provided" });
//     }

//     const { classroom_id, date, teacherStartTime, teacherEndTime } = req.body;

//     if (!classroom_id || !date || !teacherStartTime || !teacherEndTime) {
//       return res.status(400).json({ message: "Required form data missing" });
//     }

//     const filePath = path.join(__dirname, "../../uploads", req.file.filename);

//     const { inserted, errors } = await processCSVAttendance(
//       filePath,
//       parseInt(classroom_id),
//       date,
//       teacherStartTime,
//       teacherEndTime
//     );

//     fs.unlinkSync(filePath);

//     res.status(200).json({ preview: inserted, errors });
//   } catch (err) {
//     console.error("Error previewing CSV attendance:", err);
//     res
//       .status(500)
//       .json({ message: "Error previewing CSV attendance", error: err.message });
//   }
// };

// // ----------------------------
// // Old CSV upload → auto insert (direct commit)
// // ----------------------------
// const uploadCSVAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "CSV file not provided" });
//     }

//     const { classroom_id, date, teacherStartTime, teacherEndTime } = req.body;

//     if (!classroom_id || !date || !teacherStartTime || !teacherEndTime) {
//       return res.status(400).json({ message: "Required form data missing" });
//     }

//     const filePath = path.join(__dirname, "../../uploads", req.file.filename);

//     const { inserted, errors } = await processCSVAttendance(
//       filePath,
//       parseInt(classroom_id),
//       date,
//       teacherStartTime,
//       teacherEndTime
//     );

//     fs.unlinkSync(filePath);

//     res.status(201).json({ message: "CSV attendance processed", inserted, errors });
//   } catch (err) {
//     console.error("Error processing CSV attendance:", err);
//     res
//       .status(500)
//       .json({ message: "Error processing CSV attendance", error: err.message });
//   }
// };

// // ----------------------------
// // Download Reference CSV with student names
// // ----------------------------
// const downloadReferenceCSV = async (req, res) => {
//   try {
//     const { classroomId } = req.query;

//     if (!classroomId) {
//       return res.status(400).json({ message: "classroomId is required" });
//     }

//     const students = await getStudentsByClassroom(parseInt(classroomId));

//     const fields = ["STUDENT NAME", "TIME JOINED", "TIME EXITED"];
//     const data = students.map((s) => ({
//       "STUDENT NAME": s.name,
//       "TIME JOINED": "",
//       "TIME EXITED": "",
//     }));

//     const parser = new Parser({ fields });
//     const csvData = parser.parse(data);

//     res.header("Content-Type", "text/csv");
//     res.attachment("reference_attendance.csv");
//     return res.send(csvData);
//   } catch (err) {
//     console.error("Error generating reference CSV:", err);
//     res.status(500).json({ message: "Failed to generate reference CSV" });
//   }
// };

// // ----------------------------
// // Download processed report (after upload)
// // ----------------------------
// const downloadAttendanceReport = async (req, res) => {
//   try {
//     const reportPath = path.join(__dirname, "../../uploads/attendance_report.json");

//     if (!fs.existsSync(reportPath)) {
//       return res.status(404).json({ message: "No report found. Upload attendance first." });
//     }

//     const report = JSON.parse(fs.readFileSync(reportPath));

//     const fields = ["STUDENT NAME", "TIME JOINED", "TIME EXITED", "STATUS"];
//     const data = report.map((r) => ({
//       "STUDENT NAME": r.name,
//       "TIME JOINED": r.joined,
//       "TIME EXITED": r.exited,
//       STATUS: r.status,
//     }));

//     const parser = new Parser({ fields });
//     const csvData = parser.parse(data);

//     res.header("Content-Type", "text/csv");
//     res.attachment("attendance_report.csv");
//     return res.send(csvData);
//   } catch (err) {
//     console.error("Error downloading attendance report:", err);
//     res.status(500).json({ message: "Failed to download report" });
//   }
// };

// module.exports = {
//   fetchAttendance,
//   submitBulkAttendance,
//   previewCSVAttendance,
//   uploadCSVAttendance,
//   downloadReferenceCSV,      // 👈 generate reference file
//   downloadAttendanceReport,  // 👈 download processed report
// };


// ---------------------------------------------
// ATTENDANCE CONTROLLER (Coordinator)
// ---------------------------------------------
/**
 * attendanceController.js
 * Handles attendance upload, preview, and processing
 */

// ==========================================================
//  server/controllers/coordinator/attendanceController.js
//  ✅ FINAL VERIFIED VERSION (CommonJS + Logs + Alerts)
// ==========================================================
// controllers/attendanceController.js

// controllers/AttendanceController.js
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const pool = require("../../config/db"); // keep your existing db config import

// === Helper: Parse CSV (no header expected) ===
const parseCSV = async (filePath) =>
  new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    Papa.parse(stream, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });

// === Helper: robust time parsing to minutes from midnight
// Supports "18:30", "6:42PM", "6:42?PM", "06:42 PM", "6:42 pm", etc.
// Returns minutes since 00:00 (integer) or null on failure.
const parseTimeToMinutes = (raw) => {
  if (!raw && raw !== 0) return null;
  const s = String(raw).trim();

  // Remove stray characters except digits, colon, space, AM/PM letters
  const cleaned = s.replace(/[^\d:apmAPM ]/g, "").replace(/\s+/g, " ").trim();

  // Try 24-hour HH:MM first
  const hhmm24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm24) {
    const h = parseInt(hhmm24[1], 10);
    const m = parseInt(hhmm24[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
    return null;
  }

  // Try 12-hour with AM/PM
  const hhmm12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])$/);
  if (hhmm12) {
    let h = parseInt(hhmm12[1], 10);
    const m = parseInt(hhmm12[2], 10);
    const ampm = hhmm12[3].toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
    return null;
  }

  // Try something like "6PM" or "6 PM"
  const hhOnly = cleaned.match(/^(\d{1,2})\s*([aApP][mM])$/);
  if (hhOnly) {
    let h = parseInt(hhOnly[1], 10);
    const ampm = hhOnly[2].toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    if (h >= 0 && h < 24) return h * 60;
    return null;
  }

  // Last resort: extract first HH:MM-looking substring
  const anyHHMM = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (anyHHMM) {
    const h = parseInt(anyHHMM[1], 10);
    const m = parseInt(anyHHMM[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
  }

  return null;
};

// compute percent of attendance given joinmins/exitmins and classStart/classEnd minutes
const computePercent = (joinMins, exitMins, classStartMins, classEndMins) => {
  if (
    joinMins === null ||
    exitMins === null ||
    classStartMins === null ||
    classEndMins === null
  )
    return 0;
  const classDuration = classEndMins - classStartMins;
  if (!classDuration || classDuration <= 0) return 0;
  const attended = Math.max(0, Math.min(exitMins, classEndMins) - Math.max(joinMins, classStartMins));
  const pct = (attended / classDuration) * 100;
  if (isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
};

// normalize status text to DB allowed values
const normalizeStatus = (pct) => {
  if (pct >= 75) return "PRESENT";
  if (pct >= 40) return "LATE JOINED";
  return "ABSENT";
};

// ========================= PREVIEW =========================
const previewCSVAttendance = async (req, res) => {
  try {
    console.log("======================================================");
    console.log("[Route] 🟢 /attendance/csv/preview called");
    console.log("======================================================");

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = req.file.path;
    console.log("[previewCSVAttendance] 📂 File path:", filePath);

    const rows = await parseCSV(filePath);
    console.log(`[previewCSVAttendance] ✅ Parsed ${rows.length} rows`);

    if (rows.length < 3) {
      // keep the uploaded file around for debugging in dev, but still respond error
      return res.status(400).json({ message: "Invalid CSV format. Needs header, class-time row and at least one student row." });
    }

    // Row 0 = header (ignored for parsing)
    // Row 1 = class times: [, classStart, classEnd]
    const classStartRaw = rows[1][1];
    const classEndRaw = rows[1][2];
    const classStartMins = parseTimeToMinutes(classStartRaw);
    const classEndMins = parseTimeToMinutes(classEndRaw);

    const classDuration = (classStartMins !== null && classEndMins !== null) ? (classEndMins - classStartMins) : null;
    console.log(`🕒 Class Start raw: ${classStartRaw}, End raw: ${classEndRaw}, duration mins: ${classDuration}`);

    // Build student rows from row 2 onwards
    const csvStudents = [];
    for (let i = 2; i < rows.length; i++) {
      const [rawName, rawJoin, rawExit] = rows[i];
      const name = rawName ? String(rawName).trim() : null;
      if (!name) continue;
      const joinRaw = rawJoin ? String(rawJoin).trim() : null;
      const exitRaw = rawExit ? String(rawExit).trim() : null;

      const joinMins = parseTimeToMinutes(joinRaw);
      const exitMins = parseTimeToMinutes(exitRaw);
      const pct = computePercent(joinMins, exitMins, classStartMins, classEndMins);
      const pctFixed = Math.round(pct * 100) / 100; // 2 decimal-ish
      const status = normalizeStatus(pctFixed);

      csvStudents.push({
        name,
        raw_join: joinRaw || null,
        raw_exit: exitRaw || null,
        join_mins: joinMins,
        exit_mins: exitMins,
        percent: pctFixed,
        status,
      });
    }

    // We expect caller to pass batch_id OR classroom_id to map students to DB
    const batchId = req.body.batch_id || null;
    const classroomId = req.body.classroom_id || null;

    if (!batchId && !classroomId) {
      // attempt to read batch_id from form (older clients send batch)
      // but if missing, we still produce a preview with unmatched = all
      console.warn("[previewCSVAttendance] ⚠️ batch_id and classroom_id not provided. Preview will not map to DB students.");
    }

    // Query DB students for mapping (prefer classroom->batch mapping if classroom given)
    let dbStudents = [];
    if (batchId) {
      const q = await pool.query(
        `SELECT student_id, student_name, batch_id FROM pp.student_master WHERE batch_id = $1`,
        [batchId]
      );
      dbStudents = q.rows;
    } else if (classroomId) {
      // if you maintain classroom_batch table linking classroom<->batch, pick those batches (or students linked directly)
      // We'll fetch students by batch via classroom_batch -> batch -> student_master
      const q = await pool.query(
        `SELECT sm.student_id, sm.student_name, sm.batch_id
         FROM pp.student_master sm
         JOIN pp.classroom_batch cb ON sm.batch_id = cb.batch_id
         WHERE cb.classroom_id = $1`,
        [classroomId]
      );
      dbStudents = q.rows;
    }

    // build quick lookup maps (lowercase names)
    const nameToStudent = new Map();
    dbStudents.forEach((s) => {
      if (s.student_name) nameToStudent.set(String(s.student_name).toLowerCase().trim(), s);
    });

    const matched = [];
    const unmatched = [];
    const matchedNamesSet = new Set();

    for (const cs of csvStudents) {
      const lookup = nameToStudent.get(String(cs.name).toLowerCase().trim());
      if (lookup) {
        matched.push({
          student_id: lookup.student_id,
          student_name: lookup.student_name,
          classroom_id: classroomId || null,
          batch_id: lookup.batch_id || null,
          time_joined: cs.raw_join,
          time_exited: cs.raw_exit,
          attendance_percent: cs.percent,
          status: cs.status,
        });
        matchedNamesSet.add(String(lookup.student_name).toLowerCase().trim());
      } else {
        unmatched.push({
          student_name: cs.name,
          time_joined: cs.raw_join,
          time_exited: cs.raw_exit,
          attendance_percent: cs.percent,
          status: cs.status,
        });
      }
    }

    // absentees = DB students in class/batch who were NOT matched
    const absentees = [];
    if (dbStudents.length > 0) {
      for (const s of dbStudents) {
        const nm = String(s.student_name).toLowerCase().trim();
        if (!matchedNamesSet.has(nm)) {
          absentees.push({
            student_id: s.student_id,
            student_name: s.student_name,
            classroom_id: classroomId || null,
            batch_id: s.batch_id,
            time_joined: null,
            time_exited: null,
            attendance_percent: 0,
            status: "ABSENT",
          });
        }
      }
    }

    // final preview rows: matched then absentees
    const previewRows = [...matched, ...absentees];

    // Persist preview server-side (optional) but safer: return preview rows in response and allow commit with attendanceList in body.
    // remove uploaded file to keep uploads folder tidy
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // ignore remove errors
    }

    console.log("------------------------------------------------------");
    console.log("✅ Matched:", matched.length);
    console.log("⚠️ Unmatched:", unmatched.length);
    console.log("❌ Absentees:", absentees.length);
    console.log("------------------------------------------------------");

    return res.status(200).json({
      classStart: classStartRaw,
      classEnd: classEndRaw,
      classDurationMins: classDuration,
      previewData: previewRows,
      unmatchedStudents: unmatched,
      absentees,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      absenteeCount: absentees.length,
      message: "Preview generated",
    });
  } catch (err) {
    console.error("❌ Error in previewCSVAttendance:", err);
    return res.status(500).json({ message: "Error during CSV preview", error: err.message });
  }
};

// ========================= COMMIT =========================
// Accepts either:
// - req.body.attendanceList (array of rows returned by preview) [recommended]
// - or server-side cached preview if you have such mechanism (not required here)
const commitCSVAttendance = async (req, res) => {
  const client = await pool.connect();
  try {
    const attendanceList = req.body.attendanceList || req.body.previewData || null;
    const attendanceDate = req.body.attendanceDate || req.body.date || new Date().toISOString().split("T")[0];
    const classroomId = req.body.classroom_id || req.body.classroomId || null;
    if (!attendanceList || attendanceList.length === 0) {
      return res.status(400).json({ message: "No attendance list provided for commit" });
    }

    await client.query("BEGIN");
    const insertedIds = [];

    for (const r of attendanceList) {
      // r should contain student_id, classroom_id or batch_id, time_joined, time_exited, attendance_percent, status
      const student_id = r.student_id;
      const classroom_id = r.classroom_id || classroomId || null;
      const start_time = r.time_joined || r.time_joined || r.joined || null;
      const end_time = r.time_exited || r.time_exited || r.exited || null;

      // If start_time/end_time are text like "6:42PM", attempt to normalize to hh:mm:ss for DB time
      // POSTGRES accepts 'HH:MM:SS' or 'HH:MM'
      const normalizeToTimeString = (raw) => {
        if (!raw) return null;
        // parse to minutes
        const mins = parseTimeToMinutes(raw);
        if (mins === null) return null;
        const hh = Math.floor(mins / 60).toString().padStart(2, "0");
        const mm = (mins % 60).toString().padStart(2, "0");
        return `${hh}:${mm}:00`;
      };

      const start_ts = normalizeToTimeString(start_time);
      const end_ts = normalizeToTimeString(end_time);

      const status = (r.status || r.attendance_status || "ABSENT").toString().toUpperCase();

      // Insert with ON CONFLICT on unique(student_id, date, classroom_id, start_time, end_time)
      await client.query(
        `INSERT INTO pp.student_attendance
          (student_id, classroom_id, date, start_time, end_time, status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (student_id, date, classroom_id, start_time, end_time)
         DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = NOW()`,
        [student_id, classroom_id, attendanceDate, start_ts || "00:00:00", end_ts || "00:00:00", status, null]
      );

      insertedIds.push(student_id);
    }

    await client.query("COMMIT");
    // cache last commit metadata so undo can use it (optional)
    global.lastCommit = {
      ids: insertedIds,
      date: attendanceDate,
      classroom_id: classroomId,
    };

    return res.status(200).json({
      message: "Attendance committed",
      insertedCount: insertedIds.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error committing attendance:", err);
    return res.status(500).json({ message: "Error committing attendance", error: err.message });
  } finally {
    client.release();
  }
};

// ========================= UNDO =========================
// expects { classroom_id, date } OR uses global.lastCommit if present
const undoLastAttendanceCommit = async (req, res) => {
  try {
    let classroomId = req.body.classroom_id || req.body.classroomId || null;
    let date = req.body.date || req.body.attendanceDate || null;

    // fallback to global cached commit data
    if ((!classroomId || !date) && global.lastCommit) {
      classroomId = classroomId || global.lastCommit.classroom_id;
      date = date || global.lastCommit.date;
    }

    if (!classroomId || !date) {
      return res.status(400).json({ message: "Missing classroom_id or date for undo" });
    }

    const result = await pool.query(
      `DELETE FROM pp.student_attendance WHERE classroom_id = $1 AND date = $2 RETURNING student_id`,
      [classroomId, date]
    );

    // clear cached lastCommit
    if (global.lastCommit) global.lastCommit = null;

    return res.status(200).json({
      message: "Undo successful",
      deleted: result.rowCount,
      deletedIds: result.rows.map((r) => r.student_id),
    });
  } catch (err) {
    console.error("❌ Error undoing last attendance commit:", err);
    return res.status(500).json({ message: "Undo failed", error: err.message });
  }
};

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


// Fetch attendance (by cohort, batch, classroom, date, time)
// ----------------------------
const fetchAttendance = async (req, res) => {
  try {
    // ✅ Use query params from the frontend request
    // Fix: Changed cohortId to cohortNumber to match the model
    const { cohortNumber, batchId, classroomId, date, startTime, endTime } = req.query;

    if (!cohortNumber && !batchId && !classroomId && !date) {
      return res.status(400).json({
        message: "At least one filter (cohortNumber, batchId, classroomId, date) is required",
      });
    }

    // Corrected: Create a single filters object to pass to the model function
    const filters = {
      // Fix: Use cohortNumber here
      cohortNumber: cohortNumber ? parseInt(cohortNumber) : null,
      batchId: batchId ? parseInt(batchId) : null,
      classroomId: classroomId ? parseInt(classroomId) : null,
      date: date || null,
      startTime: startTime || null,
      endTime: endTime || null,
    };

    const data = await getAttendanceByFilters(filters);

    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
};

// Download sample CSV
const downloadSampleCSV = (req, res) => {
  const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
  res.download(filePath, "sample_attendance.csv", (err) => {
    if (err) {
      console.error("Error sending sample CSV:", err);
      res.status(500).send("Could not download sample CSV");
    }
  });
};

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
// Bulk attendance upload via JSON (manual + bulk submit)
// ----------------------------
const submitBulkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!attendanceRecords || !attendanceRecords.length) {
      return res.status(400).json({ message: "No attendance records provided" });
    }

    const inserted = await createBulkAttendance(attendanceRecords);
    res.status(201).json({ message: "Attendance uploaded", inserted });
  } catch (err) {
    console.error("Error uploading attendance:", err);
    res
      .status(500)
      .json({ message: "Error uploading attendance", error: err.message });
  }
};

module.exports = {
  previewCSVAttendance,
  commitCSVAttendance,
  undoLastAttendanceCommit,
  fetchAttendance,
  downloadSampleCSV,
  submitBulkAttendance,
};
