// // const { ReportsModel } = require("../../models/coordinator/reportsModel");
// // const pool = require("../../config/db");

// // // ========================
// // // Middleware (temporary placeholder)
// // // ========================
// // const requireAuth = (req, res, next) => {
// //   const auth = req.headers.authorization;
// //   if (!auth) return res.status(401).json({ error: "Missing authorization" });
// //   next();
// // };

// // // ===================================================
// // // 1️⃣ ATTENDANCE REPORT (Subject-wise actual conducted count, no "Total" column)
// // // ===================================================
// // const getAttendanceReport = async (req, res) => {
// //   console.log("📥 [getAttendanceReport] Incoming Query Params:", req.query);
// //   const { batchId, fromDate, toDate } = req.query;
// //   const batch_id = batchId;

// //   if (!batch_id || !fromDate || !toDate)
// //     return res
// //       .status(400)
// //       .json({ error: "batch_id, fromDate, and toDate required" });

// //   try {
// //     // ---------------------- 1️⃣ Batch & Cohort Info ----------------------
// //     const batchInfoQuery = `
// //       SELECT b.batch_name, c.cohort_name
// //       FROM pp.batch b
// //       JOIN pp.cohort c ON c.cohort_number = b.cohort_number
// //       WHERE b.batch_id = $1;
// //     `;
// //     const batchInfoRes = await ReportsModel.query(batchInfoQuery, [batch_id]);
// //     const batch_name = batchInfoRes.rows[0]?.batch_name || "Unknown Batch";
// //     const cohort_name = batchInfoRes.rows[0]?.cohort_name || "Unknown Cohort";

// //     // ---------------------- 2️⃣ Subjectwise Actual Conducted (distinct classroom+date) ----------------------
// //     const actualConductedQuery = `
// //       WITH batch_classrooms AS (
// //         SELECT cb.classroom_id
// //         FROM pp.classroom_batch cb
// //         WHERE cb.batch_id = $1
// //       ),
// //       subject_conducted AS (
// //         SELECT s.subject_name,
// //                COUNT(DISTINCT sa.date || '-' || sa.classroom_id) AS conducted_classes
// //         FROM pp.student_attendance sa
// //         JOIN batch_classrooms bc ON bc.classroom_id = sa.classroom_id
// //         JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
// //         JOIN pp.subject s ON s.subject_id = c.subject_id
// //         WHERE sa.date BETWEEN $2::date AND $3::date
// //         GROUP BY s.subject_name
// //       )
// //       SELECT jsonb_object_agg(subject_name, conducted_classes) AS by_subject
// //       FROM subject_conducted;
// //     `;

// //     const conductedRes = await ReportsModel.query(actualConductedQuery, [
// //       batch_id,
// //       fromDate,
// //       toDate,
// //     ]);

// //     const bySubject = conductedRes.rows[0]?.by_subject || {};
// //     console.log("📚 [Actual Conducted Classes by Subject]:", bySubject);

// //     // ---------------------- 3️⃣ Student Attendance (subjectwise) ----------------------
// //     const studentAttendanceQuery = `
// //       WITH batch_students AS (
// //         SELECT sm.student_id, sm.student_name
// //         FROM pp.student_master sm
// //         WHERE sm.batch_id = $1
// //       ),
// //       attend AS (
// //         SELECT sm.student_id,
// //                sub.subject_name,
// //                SUM(CASE WHEN sa.status IN ('PRESENT','LATE JOINED','LEAVE') THEN 1 ELSE 0 END) AS attended_count
// //         FROM pp.student_attendance sa
// //         JOIN batch_students sm ON sm.student_id = sa.student_id
// //         JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
// //         JOIN pp.subject sub ON sub.subject_id = c.subject_id
// //         WHERE sa.date BETWEEN $2::date AND $3::date
// //         GROUP BY sm.student_id, sub.subject_name
// //       ),
// //       summary AS (
// //         SELECT bs.student_id,
// //                bs.student_name,
// //                jsonb_object_agg(att.subject_name, COALESCE(att.attended_count,0))
// //                  FILTER (WHERE att.subject_name IS NOT NULL) AS attended_by_subject,
// //                SUM(COALESCE(att.attended_count,0)) AS total_attended
// //         FROM batch_students bs
// //         LEFT JOIN attend att ON att.student_id = bs.student_id
// //         GROUP BY bs.student_id, bs.student_name
// //       )
// //       SELECT * FROM summary ORDER BY student_name;
// //     `;
// //     const stRes = await ReportsModel.query(studentAttendanceQuery, [
// //       batch_id,
// //       fromDate,
// //       toDate,
// //     ]);

// //     console.log("👩‍🎓 [Raw Student Attendance Rows]:", stRes.rows.length);

// //     // ---------------------- 4️⃣ Transform for UI ----------------------
// //     const students = stRes.rows.map((r) => {
// //       const attendedBySubject = r.attended_by_subject || {};
// //       Object.keys(bySubject).forEach((subj) => {
// //         if (!(subj in attendedBySubject)) attendedBySubject[subj] = 0;
// //       });

// //       // Total = sum of all subjects' conducted classes
// //       const totalConducted = Object.values(bySubject).reduce(
// //         (a, b) => a + (b || 0),
// //         0
// //       );
// //       const totalAttended = parseInt(r.total_attended || 0, 10);
// //       const attendancePercent =
// //         totalConducted > 0
// //           ? +((totalAttended / totalConducted) * 100).toFixed(2)
// //           : 0;

// //       return {
// //         id: r.student_id,
// //         name: r.student_name,
// //         attended: attendedBySubject,
// //         attended_classes: totalAttended,
// //         attendance_percent: attendancePercent,
// //       };
// //     });

// //     console.log("✅ [Transformed Students for UI]:", students.slice(0, 5));

// //     const batchAverageAttendance =
// //       students.length > 0
// //         ? (
// //             students.reduce((sum, s) => sum + s.attendance_percent, 0) /
// //             students.length
// //           ).toFixed(2)
// //         : "0.00";

// //     // ---------------------- 5️⃣ Final Response ----------------------
// //     res.json({
// //       reportId: `ATT-${batch_id}-${fromDate}-${toDate}`,
// //       cohort_name,
// //       batch_name,
// //       totalConductedBySubject: bySubject,
// //       students,
// //       batchAverageAttendance,
// //     });
// //   } catch (err) {
// //     console.error("❌ attendance report error", err);
// //     res.status(500).json({ error: "Server error generating attendance report" });
// //   }
// // };

// // module.exports = {
// //   requireAuth,
// //   getAttendanceReport,
// // };


// // // ===================================================
// // // 2️⃣ ABSENTEES REPORT (unchanged)
// // // ===================================================
// // const getAbsenteesReport = async (req, res) => {
// //   const { batch_id, fromDate, toDate } = req.query;
// //   if (!batch_id || !fromDate || !toDate)
// //     return res
// //       .status(400)
// //       .json({ error: "batch_id, fromDate, and toDate required" });

// //   try {
// //     const missedQuery = `
// //       WITH dates AS (
// //         SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
// //       ),
// //       batch_classrooms AS (
// //         SELECT cb.classroom_id FROM pp.classroom_batch cb WHERE cb.batch_id = $1
// //       ),
// //       scheduled AS (
// //         SELECT c.subject_id, s.subject_name, d.dt
// //         FROM pp.classroom c
// //         JOIN batch_classrooms bc ON bc.classroom_id = c.classroom_id
// //         JOIN pp.timetable t ON t.classroom_id = c.classroom_id
// //         JOIN dates d ON trim(upper(t.day_of_week)) = trim(to_char(d.dt, 'DAY'))
// //         JOIN pp.subject s ON s.subject_id = c.subject_id
// //       ),
// //       attended AS (
// //         SELECT sa.student_id, c.subject_id, sa.date, sa.status
// //         FROM pp.student_attendance sa
// //         JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
// //         WHERE sa.date BETWEEN $2::date AND $3::date
// //       ),
// //       compare AS (
// //         SELECT bs.student_id, bs.student_name, sch.subject_name,
// //                COUNT(*) AS scheduled_count,
// //                COUNT(att.*) FILTER (WHERE att.status IN ('PRESENT','LATE JOINED','LEAVE')) AS attended_count,
// //                ARRAY_AGG(CASE WHEN att.status = 'ABSENT' THEN att.date END)
// //                  FILTER (WHERE att.status = 'ABSENT') AS absent_dates
// //         FROM (SELECT sm.student_id, sm.student_name FROM pp.student_master sm WHERE sm.batch_id = $1) bs
// //         JOIN scheduled sch ON TRUE
// //         LEFT JOIN attended att
// //           ON att.student_id = bs.student_id
// //          AND att.subject_id = sch.subject_id
// //          AND att.date = sch.dt
// //         GROUP BY bs.student_id, bs.student_name, sch.subject_name
// //       )
// //       SELECT student_id, student_name, subject_name, scheduled_count, attended_count,
// //              (scheduled_count - attended_count) AS missed_count,
// //              COALESCE(absent_dates, '{}') AS missed_dates
// //       FROM compare
// //       WHERE (scheduled_count - attended_count) > 0
// //       ORDER BY missed_count DESC;
// //     `;
// //     const missedRes = await ReportsModel.query(missedQuery, [
// //       batch_id,
// //       fromDate,
// //       toDate,
// //     ]);

// //     const grouped = {};
// //     for (const r of missedRes.rows) {
// //       const sid = r.student_id;
// //       if (!grouped[sid])
// //         grouped[sid] = {
// //           id: sid,
// //           name: r.student_name,
// //           missedClasses: [],
// //           totalMissed: 0,
// //         };
// //       grouped[sid].missedClasses.push({
// //         subject: r.subject_name,
// //         count: parseInt(r.missed_count, 10),
// //         dates: (r.missed_dates || []).filter(Boolean),
// //       });
// //       grouped[sid].totalMissed += parseInt(r.missed_count, 10);
// //     }

// //     res.json({
// //       reportId: `ABS-${batch_id}-${fromDate}-${toDate}`,
// //       students: Object.values(grouped),
// //     });
// //   } catch (err) {
// //     console.error("❌ absentees report error", err);
// //     res.status(500).json({ error: "Server error generating absentees report" });
// //   }
// // };



// // //3 PHASE

// // const getTeacherLoad = async (req, res) => {
// //   try {
// //     const { fromDate, toDate } = req.query;
// //     console.log("📅 Received Teacher Load request:", { fromDate, toDate });

// //     let query = `
// //       SELECT 
// //           t.teacher_name AS teacher,
// //           b.cohort_number AS cohort,
// //           c.classroom_name AS classroom,
// //           s.subject_name AS subject,
// //           COUNT(DISTINCT sa.date || '-' || sa.start_time || '-' || sa.end_time) AS total_classes_taken
// //       FROM 
// //           pp.student_attendance sa
// //       JOIN 
// //           pp.classroom c ON sa.classroom_id = c.classroom_id
// //       JOIN 
// //           pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
// //       JOIN 
// //           pp.batch b ON cb.batch_id = b.batch_id
// //       JOIN 
// //           pp.teacher t ON c.teacher_id = t.teacher_id
// //       JOIN 
// //           pp.subject s ON c.subject_id = s.subject_id
// //     `;

// //     const params = [];

// //     if (fromDate && toDate) {
// //       query += ` WHERE sa.date BETWEEN $1 AND $2 `;
// //       params.push(fromDate, toDate);
// //     }

// //     query += `
// //       GROUP BY 
// //           t.teacher_name, b.cohort_number, c.classroom_name, s.subject_name
// //       ORDER BY 
// //           t.teacher_name, b.cohort_number, c.classroom_name
// //     `;

// //     console.log("🟢 Executing Query:\n", query);
// //     const { rows } = await pool.query(query, params);

// //     console.log(`✅ Query executed. Rows fetched: ${rows.length}`);
// //     if (rows.length === 0) console.warn("⚠️ No teacher load data found.");

// //     res.status(200).json({ teacherClassCounts: rows });
// //   } catch (error) {
// //     console.error("❌ Error fetching teacher load data:", error);
// //     res.status(500).json({ message: "Internal server error", error: error.message });
// //   }
// // };

// // // ===================================================
// // // 4️⃣ TEACHER PERFORMANCE REPORT (unchanged)
// // // ===================================================
// // const getTeacherPerformance = async (req, res) => {
// //   const { teacherId, fromDate, toDate } = req.query;
// //   if (!teacherId || !fromDate || !toDate)
// //     return res
// //       .status(400)
// //       .json({ error: "teacherId, fromDate, and toDate required" });

// //   try {
// //     const scheduledQuery = `
// //       WITH dates AS (
// //         SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
// //       ),
// //       teacher_classrooms AS (
// //         SELECT classroom_id FROM pp.classroom WHERE teacher_id = $1
// //       ),
// //       scheduled AS (
// //         SELECT c.classroom_id, s.subject_name, d.dt
// //         FROM teacher_classrooms tc
// //         JOIN pp.classroom c ON c.classroom_id = tc.classroom_id
// //         JOIN pp.timetable t ON t.classroom_id = c.classroom_id
// //         JOIN dates d ON trim(upper(t.day_of_week)) = trim(to_char(d.dt, 'DAY'))
// //         JOIN pp.subject s ON s.subject_id = c.subject_id
// //       )
// //       SELECT s.subject_name, COUNT(*) AS scheduled
// //       FROM scheduled s
// //       GROUP BY s.subject_name;
// //     `;
// //     const scheduledRes = await ReportsModel.query(scheduledQuery, [
// //       teacherId,
// //       fromDate,
// //       toDate,
// //     ]);

// //     const conductedQuery = `
// //       SELECT subj.subject_name,
// //              COUNT(DISTINCT (sa.classroom_id, sa.date, sa.start_time, sa.end_time)) AS conducted
// //       FROM pp.student_attendance sa
// //       JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
// //       JOIN pp.subject subj ON subj.subject_id = c.subject_id
// //       WHERE c.teacher_id = $1
// //         AND sa.date BETWEEN $2::date AND $3::date
// //       GROUP BY subj.subject_name;
// //     `;
// //     const conductedRes = await ReportsModel.query(conductedQuery, [
// //       teacherId,
// //       fromDate,
// //       toDate,
// //     ]);

// //     const subjectsMap = {};
// //     scheduledRes.rows.forEach((r) => {
// //       subjectsMap[r.subject_name] = { scheduled: +r.scheduled, conducted: 0 };
// //     });
// //     conductedRes.rows.forEach((r) => {
// //       if (!subjectsMap[r.subject_name])
// //         subjectsMap[r.subject_name] = { scheduled: 0, conducted: +r.conducted };
// //       else subjectsMap[r.subject_name].conducted = +r.conducted;
// //     });

// //     const subjects = Object.keys(subjectsMap).map((subj) => {
// //       const s = subjectsMap[subj];
// //       const completion =
// //         s.scheduled > 0
// //           ? +((s.conducted / s.scheduled) * 100).toFixed(1)
// //           : 0;
// //       return { subject: subj, ...s, completion };
// //     });

// //     const tRes = await ReportsModel.query(
// //       "SELECT teacher_name FROM pp.teacher WHERE teacher_id = $1",
// //       [teacherId]
// //     );
// //     const teacherName = tRes.rows[0]?.teacher_name || null;

// //     const totalScheduled = subjects.reduce((s, x) => s + x.scheduled, 0);
// //     const totalConducted = subjects.reduce((s, x) => s + x.conducted, 0);
// //     const overallCompletion =
// //       totalScheduled > 0
// //         ? +((totalConducted / totalScheduled) * 100).toFixed(2)
// //         : 0;

// //     res.json({
// //       reportId: `TP-${teacherId}-${fromDate}-${toDate}`,
// //       teacher: teacherName,
// //       totalScheduled,
// //       totalConducted,
// //       overallCompletion,
// //       subjects,
// //     });
// //   } catch (err) {
// //     console.error("❌ teacher-performance error", err);
// //     res.status(500).json({
// //       error: "Server error generating teacher performance",
// //     });
// //   }
// // };

// // module.exports = {
// //   requireAuth,
// //   getAttendanceReport,
// //   getAbsenteesReport,
// //   getTeacherLoad,
// //   getTeacherPerformance,
// // };


// // backend/controllers/coordinator/reportsController.js
// const { ReportsModel } = require("../../models/coordinator/reportsModel");
// const pool = require("../../config/db");

// // ========================
// // Middleware (temporary placeholder)
// // ========================
// const requireAuth = (req, res, next) => {
//   const auth = req.headers.authorization;
//   if (!auth) return res.status(401).json({ error: "Missing authorization" });
//   next();
// };

// // ===================================================
// // 1️⃣ ATTENDANCE REPORT (Subject-wise actual conducted count, no "Total" column)
// //    NOTE: changed all subject_name -> subject_code
// // ===================================================
// const getAttendanceReport = async (req, res) => {
//   console.log("📥 [getAttendanceReport] Incoming Query Params:", req.query);
//   const { batchId, fromDate, toDate } = req.query;
//   const batch_id = batchId;

//   if (!batch_id || !fromDate || !toDate)
//     return res
//       .status(400)
//       .json({ error: "batch_id, fromDate, and toDate required" });

//   try {
//     // ---------------------- 1️⃣ Batch & Cohort Info ----------------------
//     const batchInfoQuery = `
//       SELECT b.batch_name, c.cohort_name
//       FROM pp.batch b
//       JOIN pp.cohort c ON c.cohort_number = b.cohort_number
//       WHERE b.batch_id = $1;
//     `;
//     const batchInfoRes = await ReportsModel.query(batchInfoQuery, [batch_id]);
//     const batch_name = batchInfoRes.rows[0]?.batch_name || "Unknown Batch";
//     const cohort_name = batchInfoRes.rows[0]?.cohort_name || "Unknown Cohort";

//     // ---------------------- 2️⃣ Subjectwise Actual Conducted (distinct classroom+date) ----------------------
//     // NOTE: use subject_code here (s.subject_code)
//     const actualConductedQuery = `
//       WITH batch_classrooms AS (
//         SELECT cb.classroom_id
//         FROM pp.classroom_batch cb
//         WHERE cb.batch_id = $1
//       ),
//       subject_conducted AS (
//         SELECT s.subject_code,
//                COUNT(DISTINCT sa.date || '-' || sa.classroom_id) AS conducted_classes
//         FROM pp.student_attendance sa
//         JOIN batch_classrooms bc ON bc.classroom_id = sa.classroom_id
//         JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
//         JOIN pp.subject s ON s.subject_id = c.subject_id
//         WHERE sa.date BETWEEN $2::date AND $3::date
//         GROUP BY s.subject_code
//       )
//       SELECT COALESCE(jsonb_object_agg(subject_code, conducted_classes), '{}'::jsonb) AS by_subject
//       FROM subject_conducted;
//     `;

//     const conductedRes = await ReportsModel.query(actualConductedQuery, [
//       batch_id,
//       fromDate,
//       toDate,
//     ]);

//     const bySubject = conductedRes.rows[0]?.by_subject || {};
//     console.log("📚 [Actual Conducted Classes by Subject]:", bySubject);

//     // ---------------------- 3️⃣ Student Attendance (subjectwise) ----------------------
//     // NOTE: use subject_code here and aggregate by subject_code
//     const studentAttendanceQuery = `
//       WITH batch_students AS (
//         SELECT sm.student_id, sm.student_name
//         FROM pp.student_master sm
//         WHERE sm.batch_id = $1
//       ),
//       attend AS (
//         SELECT sm.student_id,
//                sub.subject_code,
//                SUM(CASE WHEN sa.status IN ('PRESENT','LATE JOINED','LEAVE') THEN 1 ELSE 0 END) AS attended_count
//         FROM pp.student_attendance sa
//         JOIN batch_students sm ON sm.student_id = sa.student_id
//         JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
//         JOIN pp.subject sub ON sub.subject_id = c.subject_id
//         WHERE sa.date BETWEEN $2::date AND $3::date
//         GROUP BY sm.student_id, sub.subject_code
//       ),
//       summary AS (
//         SELECT bs.student_id,
//                bs.student_name,
//                jsonb_object_agg(att.subject_code, COALESCE(att.attended_count,0))
//                  FILTER (WHERE att.subject_code IS NOT NULL) AS attended_by_subject,
//                SUM(COALESCE(att.attended_count,0)) AS total_attended
//         FROM batch_students bs
//         LEFT JOIN attend att ON att.student_id = bs.student_id
//         GROUP BY bs.student_id, bs.student_name
//       )
//       SELECT * FROM summary ORDER BY student_name;
//     `;
//     const stRes = await ReportsModel.query(studentAttendanceQuery, [
//       batch_id,
//       fromDate,
//       toDate,
//     ]);

//     console.log("👩‍🎓 [Raw Student Attendance Rows]:", stRes.rows.length);

//     // ---------------------- 4️⃣ Transform for UI ----------------------
//     const students = stRes.rows.map((r) => {
//       const attendedBySubject = r.attended_by_subject || {};
//       // Ensure all subjects in bySubject appear in each student's attended map (defaults 0)
//       Object.keys(bySubject).forEach((subjCode) => {
//         if (!(subjCode in attendedBySubject)) attendedBySubject[subjCode] = 0;
//       });

//       // Total = sum of all subjects' conducted classes (sum of bySubject values)
//       const totalConducted = Object.values(bySubject).reduce(
//         (a, b) => a + (b || 0),
//         0
//       );
//       const totalAttended = parseInt(r.total_attended || 0, 10);
//       const attendancePercent =
//         totalConducted > 0
//           ? +((totalAttended / totalConducted) * 100).toFixed(2)
//           : 0;

//       return {
//         id: r.student_id,
//         name: r.student_name,
//         attended: attendedBySubject,
//         attended_classes: totalAttended,
//         attendance_percent: attendancePercent,
//       };
//     });

//     console.log("✅ [Transformed Students for UI]:", students.slice(0, 5));

//     const batchAverageAttendance =
//       students.length > 0
//         ? (
//             students.reduce((sum, s) => sum + s.attendance_percent, 0) /
//             students.length
//           ).toFixed(2)
//         : "0.00";

//     // ---------------------- 5️⃣ Final Response ----------------------
//     res.json({
//       reportId: `ATT-${batch_id}-${fromDate}-${toDate}`,
//       cohort_name,
//       batch_name,
//       totalConductedBySubject: bySubject, // keys are subject_code now
//       students,
//       batchAverageAttendance,
//     });
//   } catch (err) {
//     console.error("❌ attendance report error", err);
//     res.status(500).json({ error: "Server error generating attendance report" });
//   }
// };

// // ===================================================
// // 2️⃣ ABSENTEES REPORT (updated to use subject_code)
// // ===================================================
// const getAbsenteesReport = async (req, res) => {
//   const { batch_id, fromDate, toDate } = req.query;
//   if (!batch_id || !fromDate || !toDate)
//     return res
//       .status(400)
//       .json({ error: "batch_id, fromDate, and toDate required" });

//   try {
//     const missedQuery = `
//       WITH dates AS (
//         SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
//       ),
//       batch_classrooms AS (
//         SELECT cb.classroom_id FROM pp.classroom_batch cb WHERE cb.batch_id = $1
//       ),
//       scheduled AS (
//         SELECT c.subject_id, s.subject_code, d.dt
//         FROM pp.classroom c
//         JOIN batch_classrooms bc ON bc.classroom_id = c.classroom_id
//         JOIN pp.timetable t ON t.classroom_id = c.classroom_id
//         JOIN dates d ON trim(upper(t.day_of_week)) = trim(to_char(d.dt, 'DAY'))
//         JOIN pp.subject s ON s.subject_id = c.subject_id
//       ),
//       attended AS (
//         SELECT sa.student_id, c.subject_id, sa.date, sa.status
//         FROM pp.student_attendance sa
//         JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
//         WHERE sa.date BETWEEN $2::date AND $3::date
//       ),
//       compare AS (
//         SELECT bs.student_id, bs.student_name, sch.subject_code,
//                COUNT(*) AS scheduled_count,
//                COUNT(att.*) FILTER (WHERE att.status IN ('PRESENT','LATE JOINED','LEAVE')) AS attended_count,
//                ARRAY_AGG(CASE WHEN att.status = 'ABSENT' THEN att.date END)
//                  FILTER (WHERE att.status = 'ABSENT') AS absent_dates
//         FROM (SELECT sm.student_id, sm.student_name FROM pp.student_master sm WHERE sm.batch_id = $1) bs
//         JOIN scheduled sch ON TRUE
//         LEFT JOIN attended att
//           ON att.student_id = bs.student_id
//          AND att.subject_id = sch.subject_id
//          AND att.date = sch.dt
//         GROUP BY bs.student_id, bs.student_name, sch.subject_code
//       )
//       SELECT student_id, student_name, subject_code AS subject, scheduled_count, attended_count,
//              (scheduled_count - attended_count) AS missed_count,
//              COALESCE(absent_dates, '{}') AS missed_dates
//       FROM compare
//       WHERE (scheduled_count - attended_count) > 0
//       ORDER BY missed_count DESC;
//     `;
//     const missedRes = await ReportsModel.query(missedQuery, [
//       batch_id,
//       fromDate,
//       toDate,
//     ]);

//     const grouped = {};
//     for (const r of missedRes.rows) {
//       const sid = r.student_id;
//       if (!grouped[sid])
//         grouped[sid] = {
//           id: sid,
//           name: r.student_name,
//           missedClasses: [],
//           totalMissed: 0,
//         };
//       grouped[sid].missedClasses.push({
//         subject: r.subject,
//         count: parseInt(r.missed_count, 10),
//         dates: (r.missed_dates || []).filter(Boolean),
//       });
//       grouped[sid].totalMissed += parseInt(r.missed_count, 10);
//     }

//     res.json({
//       reportId: `ABS-${batch_id}-${fromDate}-${toDate}`,
//       students: Object.values(grouped),
//     });
//   } catch (err) {
//     console.error("❌ absentees report error", err);
//     res.status(500).json({ error: "Server error generating absentees report" });
//   }
// };

// // ===================================================
// // 3️⃣ TEACHER LOAD (updated to use subject_code)
// // ===================================================
// const getTeacherLoad = async (req, res) => {
//   try {
//     const { fromDate, toDate } = req.query;
//     console.log("📅 Received Teacher Load request:", { fromDate, toDate });

//     let query = `
//       SELECT 
//           t.teacher_name AS teacher,
//           b.cohort_number AS cohort,
//           c.classroom_name AS classroom,
//           s.subject_code AS subject,
//           COUNT(DISTINCT sa.date || '-' || sa.start_time || '-' || sa.end_time) AS total_classes_taken
//       FROM 
//           pp.student_attendance sa
//       JOIN 
//           pp.classroom c ON sa.classroom_id = c.classroom_id
//       JOIN 
//           pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
//       JOIN 
//           pp.batch b ON cb.batch_id = b.batch_id
//       JOIN 
//           pp.teacher t ON c.teacher_id = t.teacher_id
//       JOIN 
//           pp.subject s ON c.subject_id = s.subject_id
//     `;

//     const params = [];

//     if (fromDate && toDate) {
//       query += ` WHERE sa.date BETWEEN $1 AND $2 `;
//       params.push(fromDate, toDate);
//     }

//     query += `
//       GROUP BY 
//           t.teacher_name, b.cohort_number, c.classroom_name, s.subject_code
//       ORDER BY 
//           t.teacher_name, b.cohort_number, c.classroom_name
//     `;

//     console.log("🟢 Executing Query:\n", query);
//     const { rows } = await pool.query(query, params);

//     console.log(`✅ Query executed. Rows fetched: ${rows.length}`);
//     if (rows.length === 0) console.warn("⚠️ No teacher load data found.");

//     res.status(200).json({ teacherClassCounts: rows });
//   } catch (error) {
//     console.error("❌ Error fetching teacher load data:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// // ===================================================
// // 4️⃣ TEACHER PERFORMANCE REPORT (updated subject -> subject_code)
// // ===================================================
// const getTeacherPerformance = async (req, res) => {
//   const { teacherId, fromDate, toDate } = req.query;
//   if (!teacherId || !fromDate || !toDate)
//     return res
//       .status(400)
//       .json({ error: "teacherId, fromDate, and toDate required" });

//   try {
//     const scheduledQuery = `
//       WITH dates AS (
//         SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
//       ),
//       teacher_classrooms AS (
//         SELECT classroom_id FROM pp.classroom WHERE teacher_id = $1
//       ),
//       scheduled AS (
//         SELECT c.classroom_id, s.subject_code, d.dt
//         FROM teacher_classrooms tc
//         JOIN pp.classroom c ON c.classroom_id = tc.classroom_id
//         JOIN pp.timetable t ON t.classroom_id = c.classroom_id
//         JOIN dates d ON trim(upper(t.day_of_week)) = trim(to_char(d.dt, 'DAY'))
//         JOIN pp.subject s ON s.subject_id = c.subject_id
//       )
//       SELECT s.subject_code AS subject, COUNT(*) AS scheduled
//       FROM scheduled s
//       GROUP BY s.subject_code;
//     `;
//     const scheduledRes = await ReportsModel.query(scheduledQuery, [
//       teacherId,
//       fromDate,
//       toDate,
//     ]);

//     const conductedQuery = `
//       SELECT subj.subject_code AS subject,
//              COUNT(DISTINCT (sa.classroom_id, sa.date, sa.start_time, sa.end_time)) AS conducted
//       FROM pp.student_attendance sa
//       JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
//       JOIN pp.subject subj ON subj.subject_id = c.subject_id
//       WHERE c.teacher_id = $1
//         AND sa.date BETWEEN $2::date AND $3::date
//       GROUP BY subj.subject_code;
//     `;
//     const conductedRes = await ReportsModel.query(conductedQuery, [
//       teacherId,
//       fromDate,
//       toDate,
//     ]);

//     const subjectsMap = {};
//     scheduledRes.rows.forEach((r) => {
//       subjectsMap[r.subject] = { scheduled: +r.scheduled, conducted: 0 };
//     });
//     conductedRes.rows.forEach((r) => {
//       if (!subjectsMap[r.subject])
//         subjectsMap[r.subject] = { scheduled: 0, conducted: +r.conducted };
//       else subjectsMap[r.subject].conducted = +r.conducted;
//     });

//     const subjects = Object.keys(subjectsMap).map((subj) => {
//       const s = subjectsMap[subj];
//       const completion =
//         s.scheduled > 0
//           ? +((s.conducted / s.scheduled) * 100).toFixed(1)
//           : 0;
//       return { subject: subj, ...s, completion };
//     });

//     const tRes = await ReportsModel.query(
//       "SELECT teacher_name FROM pp.teacher WHERE teacher_id = $1",
//       [teacherId]
//     );
//     const teacherName = tRes.rows[0]?.teacher_name || null;

//     const totalScheduled = subjects.reduce((s, x) => s + x.scheduled, 0);
//     const totalConducted = subjects.reduce((s, x) => s + x.conducted, 0);
//     const overallCompletion =
//       totalScheduled > 0
//         ? +((totalConducted / totalScheduled) * 100).toFixed(2)
//         : 0;

//     res.json({
//       reportId: `TP-${teacherId}-${fromDate}-${toDate}`,
//       teacher: teacherName,
//       totalScheduled,
//       totalConducted,
//       overallCompletion,
//       subjects,
//     });
//   } catch (err) {
//     console.error("❌ teacher-performance error", err);
//     res.status(500).json({
//       error: "Server error generating teacher performance",
//     });
//   }
// };

// module.exports = {
//   requireAuth,
//   getAttendanceReport,
//   getAbsenteesReport,
//   getTeacherLoad,
//   getTeacherPerformance,
// };
// backend/controllers/coordinator/reportsController.js
const { ReportsModel } = require("../../models/coordinator/reportsModel");
const pool = require("../../config/db");

// ========================
// Middleware (temporary placeholder)
// ========================
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing authorization" });
  next();
};

// ===================================================
// 1️⃣ ATTENDANCE REPORT (Subject-wise actual conducted count, no "Total" column)
//    NOTE: switched to use class_session + student_attendance
// ===================================================
const getAttendanceReport = async (req, res) => {
  console.log("📥 [getAttendanceReport] Incoming Query Params:", req.query);
  const { batchId, fromDate, toDate } = req.query;
  const batch_id = batchId;

  if (!batch_id || !fromDate || !toDate)
    return res
      .status(400)
      .json({ error: "batch_id, fromDate, and toDate required" });

  try {
    // ---------------------- 1️⃣ Batch & Cohort Info ----------------------
    const batchInfoQuery = `
      SELECT b.batch_name, c.cohort_name
      FROM pp.batch b
      JOIN pp.cohort c ON c.cohort_number = b.cohort_number
      WHERE b.batch_id = $1;
    `;
    const batchInfoRes = await ReportsModel.query(batchInfoQuery, [batch_id]);
    const batch_name = batchInfoRes.rows[0]?.batch_name || "Unknown Batch";
    const cohort_name = batchInfoRes.rows[0]?.cohort_name || "Unknown Cohort";

    // ---------------------- 2️⃣ Subjectwise Actual Conducted (distinct classroom+date) ----------------------
    // Use class_session table to count conducted sessions for classrooms mapped to the batch
    const actualConductedQuery = `
      WITH batch_classrooms AS (
        SELECT cb.classroom_id
        FROM pp.classroom_batch cb
        WHERE cb.batch_id = $1
      ),
      subject_conducted AS (
        SELECT subj.subject_code,
               COUNT(DISTINCT (cs.classroom_id, cs.session_date)) AS conducted_classes
        FROM pp.class_session cs
        JOIN batch_classrooms bc ON bc.classroom_id = cs.classroom_id
        JOIN pp.classroom c ON c.classroom_id = cs.classroom_id
        JOIN pp.subject subj ON subj.subject_id = c.subject_id
        WHERE cs.session_date BETWEEN $2::date AND $3::date
        GROUP BY subj.subject_code
      )
      SELECT COALESCE(jsonb_object_agg(subject_code, conducted_classes), '{}'::jsonb) AS by_subject
      FROM subject_conducted;
    `;

    const conductedRes = await ReportsModel.query(actualConductedQuery, [
      batch_id,
      fromDate,
      toDate,
    ]);

    const bySubject = conductedRes.rows[0]?.by_subject || {};
    console.log("📚 [Actual Conducted Classes by Subject]:", bySubject);

    // ---------------------- 3️⃣ Student Attendance (subjectwise) ----------------------
    // Sum attendance per student per subject by joining student_attendance -> class_session -> classroom -> subject
    const studentAttendanceQuery = `
      WITH batch_students AS (
        SELECT sm.student_id, sm.student_name
        FROM pp.student_master sm
        WHERE sm.batch_id = $1
      ),
      attend AS (
        SELECT sm.student_id,
               subj.subject_code,
               SUM(CASE WHEN sa.status IN ('PRESENT','LATE JOINED','LEAVE') THEN 1 ELSE 0 END) AS attended_count
        FROM pp.student_attendance sa
        JOIN pp.class_session cs ON cs.session_id = sa.session_id
        JOIN pp.classroom c ON c.classroom_id = cs.classroom_id
        JOIN pp.subject subj ON subj.subject_id = c.subject_id
        JOIN batch_students sm ON sm.student_id = sa.student_id
        WHERE cs.session_date BETWEEN $2::date AND $3::date
        GROUP BY sm.student_id, subj.subject_code
      ),
      summary AS (
        SELECT bs.student_id,
               bs.student_name,
               jsonb_object_agg(att.subject_code, COALESCE(att.attended_count,0))
                 FILTER (WHERE att.subject_code IS NOT NULL) AS attended_by_subject,
               SUM(COALESCE(att.attended_count,0)) AS total_attended
        FROM batch_students bs
        LEFT JOIN attend att ON att.student_id = bs.student_id
        GROUP BY bs.student_id, bs.student_name
      )
      SELECT * FROM summary ORDER BY student_name;
    `;
    const stRes = await ReportsModel.query(studentAttendanceQuery, [
      batch_id,
      fromDate,
      toDate,
    ]);

    console.log("👩‍🎓 [Raw Student Attendance Rows]:", stRes.rows.length);

    // ---------------------- 4️⃣ Transform for UI ----------------------
    const students = stRes.rows.map((r) => {
      const attendedBySubject = r.attended_by_subject || {};
      // Ensure all subjects in bySubject appear in each student's attended map (defaults 0)
      Object.keys(bySubject).forEach((subjCode) => {
        if (!(subjCode in attendedBySubject)) attendedBySubject[subjCode] = 0;
      });

      // Total = sum of all subjects' conducted classes (sum of bySubject values)
      const totalConducted = Object.values(bySubject).reduce(
        (a, b) => a + (b || 0),
        0
      );
      const totalAttended = parseInt(r.total_attended || 0, 10);
      const attendancePercent =
        totalConducted > 0
          ? +((totalAttended / totalConducted) * 100).toFixed(2)
          : 0;

      return {
        id: r.student_id,
        name: r.student_name,
        attended: attendedBySubject,
        attended_classes: totalAttended,
        attendance_percent: attendancePercent,
      };
    });

    console.log("✅ [Transformed Students for UI]:", students.slice(0, 5));

    const batchAverageAttendance =
      students.length > 0
        ? (
            students.reduce((sum, s) => sum + s.attendance_percent, 0) /
            students.length
          ).toFixed(2)
        : "0.00";

    // ---------------------- 5️⃣ Final Response ----------------------
    res.json({
      reportId: `ATT-${batch_id}-${fromDate}-${toDate}`,
      cohort_name,
      batch_name,
      totalConductedBySubject: bySubject, // keys are subject_code now
      students,
      batchAverageAttendance,
    });
  } catch (err) {
    console.error("❌ attendance report error", err);
    res.status(500).json({ error: "Server error generating attendance report" });
  }
};

// ===================================================
// 2️⃣ ABSENTEES REPORT (updated to use class_session + timetable scheduled generation)
// ===================================================
const getAbsenteesReport = async (req, res) => {
  const { batch_id, fromDate, toDate } = req.query;
  if (!batch_id || !fromDate || !toDate)
    return res
      .status(400)
      .json({ error: "batch_id, fromDate, and toDate required" });

  try {
    const missedQuery = `
      WITH dates AS (
        SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
      ),
      batch_classrooms AS (
        SELECT cb.classroom_id FROM pp.classroom_batch cb WHERE cb.batch_id = $1
      ),
      scheduled AS (
        SELECT c.classroom_id, s.subject_code, d.dt
        FROM pp.classroom c
        JOIN batch_classrooms bc ON bc.classroom_id = c.classroom_id
        JOIN pp.timetable t ON t.classroom_id = c.classroom_id
        JOIN dates d ON trim(upper(t.day_of_week)) = trim(upper(to_char(d.dt, 'DAY')))
        JOIN pp.subject s ON s.subject_id = c.subject_id
      ),
      attended AS (
        SELECT sa.student_id, c.subject_id, cs.session_date AS date, sa.status
        FROM pp.student_attendance sa
        JOIN pp.class_session cs ON cs.session_id = sa.session_id
        JOIN pp.classroom c ON c.classroom_id = cs.classroom_id
        WHERE cs.session_date BETWEEN $2::date AND $3::date
      ),
      compare AS (
        SELECT bs.student_id, bs.student_name, sch.subject_code,
               COUNT(*) AS scheduled_count,
               COUNT(att.*) FILTER (WHERE att.status IN ('PRESENT','LATE JOINED','LEAVE')) AS attended_count,
               ARRAY_AGG(CASE WHEN att.status = 'ABSENT' THEN att.date END)
                 FILTER (WHERE att.status = 'ABSENT') AS absent_dates
        FROM (SELECT sm.student_id, sm.student_name FROM pp.student_master sm WHERE sm.batch_id = $1) bs
        JOIN scheduled sch ON TRUE
        LEFT JOIN attended att
          ON att.student_id = bs.student_id
         AND att.subject_id = (SELECT subject_id FROM pp.subject WHERE subject_code = sch.subject_code LIMIT 1)
         AND att.date = sch.dt
        GROUP BY bs.student_id, bs.student_name, sch.subject_code
      )
      SELECT student_id, student_name, subject_code AS subject, scheduled_count, attended_count,
             (scheduled_count - attended_count) AS missed_count,
             COALESCE(absent_dates, '{}') AS missed_dates
      FROM compare
      WHERE (scheduled_count - attended_count) > 0
      ORDER BY missed_count DESC;
    `;

    const missedRes = await ReportsModel.query(missedQuery, [
      batch_id,
      fromDate,
      toDate,
    ]);

    const grouped = {};
    for (const r of missedRes.rows) {
      const sid = r.student_id;
      if (!grouped[sid])
        grouped[sid] = {
          id: sid,
          name: r.student_name,
          missedClasses: [],
          totalMissed: 0,
        };
      grouped[sid].missedClasses.push({
        subject: r.subject,
        count: parseInt(r.missed_count, 10),
        dates: (r.missed_dates || []).filter(Boolean),
      });
      grouped[sid].totalMissed += parseInt(r.missed_count, 10);
    }

    res.json({
      reportId: `ABS-${batch_id}-${fromDate}-${toDate}`,
      students: Object.values(grouped),
    });
  } catch (err) {
    console.error("❌ absentees report error", err);
    res.status(500).json({ error: "Server error generating absentees report" });
  }
};

// ===================================================
// 3️⃣ TEACHER LOAD (updated to use class_session table)
// ===================================================
const getTeacherLoad = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    console.log("📅 Received Teacher Load request:", { fromDate, toDate });

    let query = `
      SELECT 
          t.teacher_name AS teacher,
          b.cohort_number AS cohort,
          c.classroom_name AS classroom,
          s.subject_code AS subject,
          COUNT(DISTINCT cs.session_id) AS total_classes_taken
      FROM 
          pp.class_session cs
      JOIN 
          pp.classroom c ON cs.classroom_id = c.classroom_id
      JOIN 
          pp.classroom_batch cb ON c.classroom_id = cb.classroom_id
      JOIN 
          pp.batch b ON cb.batch_id = b.batch_id
      JOIN 
          pp.teacher t ON c.teacher_id = t.teacher_id
      JOIN 
          pp.subject s ON c.subject_id = s.subject_id
    `;

    const params = [];

    if (fromDate && toDate) {
      query += ` WHERE cs.session_date BETWEEN $1::date AND $2::date `;
      params.push(fromDate, toDate);
    }

    query += `
      GROUP BY 
          t.teacher_name, b.cohort_number, c.classroom_name, s.subject_code
      ORDER BY 
          t.teacher_name, b.cohort_number, c.classroom_name
    `;

    console.log("🟢 Executing Query:\n", query);
    const { rows } = await pool.query(query, params);

    console.log(`✅ Query executed. Rows fetched: ${rows.length}`);
    if (rows.length === 0) console.warn("⚠️ No teacher load data found.");

    res.status(200).json({ teacherClassCounts: rows });
  } catch (error) {
    console.error("❌ Error fetching teacher load data:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ===================================================
// 4️⃣ TEACHER PERFORMANCE REPORT (updated subject -> subject_code & uses class_session)
// ===================================================
const getTeacherPerformance = async (req, res) => {
  const { teacherId, fromDate, toDate } = req.query;
  if (!teacherId || !fromDate || !toDate)
    return res
      .status(400)
      .json({ error: "teacherId, fromDate, and toDate required" });

  try {
    const scheduledQuery = `
      WITH dates AS (
        SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
      ),
      teacher_classrooms AS (
        SELECT classroom_id FROM pp.classroom WHERE teacher_id = $1
      ),
      scheduled AS (
        SELECT c.classroom_id, s.subject_code, d.dt
        FROM teacher_classrooms tc
        JOIN pp.classroom c ON c.classroom_id = tc.classroom_id
        JOIN pp.timetable t ON t.classroom_id = c.classroom_id
        JOIN dates d ON trim(upper(t.day_of_week)) = trim(upper(to_char(d.dt, 'DAY')))
        JOIN pp.subject s ON s.subject_id = c.subject_id
      )
      SELECT s.subject_code AS subject, COUNT(*) AS scheduled
      FROM scheduled s
      GROUP BY s.subject_code;
    `;
    const scheduledRes = await ReportsModel.query(scheduledQuery, [
      teacherId,
      fromDate,
      toDate,
    ]);

    const conductedQuery = `
      SELECT subj.subject_code AS subject,
             COUNT(DISTINCT cs.session_id) AS conducted
      FROM pp.class_session cs
      JOIN pp.classroom c ON c.classroom_id = cs.classroom_id
      JOIN pp.subject subj ON subj.subject_id = c.subject_id
      WHERE c.teacher_id = $1
        AND cs.session_date BETWEEN $2::date AND $3::date
      GROUP BY subj.subject_code;
    `;
    const conductedRes = await ReportsModel.query(conductedQuery, [
      teacherId,
      fromDate,
      toDate,
    ]);

    const subjectsMap = {};
    scheduledRes.rows.forEach((r) => {
      subjectsMap[r.subject] = { scheduled: +r.scheduled, conducted: 0 };
    });
    conductedRes.rows.forEach((r) => {
      if (!subjectsMap[r.subject])
        subjectsMap[r.subject] = { scheduled: 0, conducted: +r.conducted };
      else subjectsMap[r.subject].conducted = +r.conducted;
    });

    const subjects = Object.keys(subjectsMap).map((subj) => {
      const s = subjectsMap[subj];
      const completion =
        s.scheduled > 0
          ? +((s.conducted / s.scheduled) * 100).toFixed(1)
          : 0;
      return { subject: subj, ...s, completion };
    });

    const tRes = await ReportsModel.query(
      "SELECT teacher_name FROM pp.teacher WHERE teacher_id = $1",
      [teacherId]
    );
    const teacherName = tRes.rows[0]?.teacher_name || null;

    const totalScheduled = subjects.reduce((s, x) => s + x.scheduled, 0);
    const totalConducted = subjects.reduce((s, x) => s + x.conducted, 0);
    const overallCompletion =
      totalScheduled > 0
        ? +((totalConducted / totalScheduled) * 100).toFixed(2)
        : 0;

    res.json({
      reportId: `TP-${teacherId}-${fromDate}-${toDate}`,
      teacher: teacherName,
      totalScheduled,
      totalConducted,
      overallCompletion,
      subjects,
    });
  } catch (err) {
    console.error("❌ teacher-performance error", err);
    res.status(500).json({
      error: "Server error generating teacher performance",
    });
  }
};

module.exports = {
  requireAuth,
  getAttendanceReport,
  getAbsenteesReport,
  getTeacherLoad,
  getTeacherPerformance,
};
