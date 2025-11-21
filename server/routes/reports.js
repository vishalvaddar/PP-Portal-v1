// routes/reports.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// configure pool (set env vars accordingly)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or host/user/password etc.
});

// Basic auth middleware placeholder - replace with your real auth
const requireAuth = (req, res, next) => {
  // expect Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing authorization" });
  // TODO: validate token here
  next();
};

// Helper to convert day to uppercase weekday names matching timetable.day_of_week
const dayOfWeekName = (d) => {
  const weekday = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  return weekday[d.getUTCDay()];
};

// --- 1) Student Attendance Summary ---
// GET /api/coordinator/reports/attendance?batchId=&fromDate=&toDate
router.get("/attendance", requireAuth, async (req, res) => {
  const { batchId, fromDate, toDate } = req.query;
  if (!batchId || !fromDate || !toDate) return res.status(400).json({ error: "batchId, fromDate and toDate required" });

  try {
    // 1) Compute scheduled classes per subject for that batch during date range.
    // Use generate_series of dates between fromDate and toDate and join timetable by day_of_week
    const scheduledQuery = `
      WITH dates AS (
        SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt
      ),
      batch_classrooms AS (
        SELECT cb.classroom_id
        FROM pp.classroom_batch cb
        WHERE cb.batch_id = $1
      ),
      scheduled AS (
        SELECT s.subject_name,
               count(*) AS scheduled_classes
        FROM pp.timetable t
        JOIN batch_classrooms bc ON bc.classroom_id = t.classroom_id
        JOIN pp.classroom c ON c.classroom_id = t.classroom_id
        JOIN pp.subject s ON s.subject_id = c.subject_id
        JOIN dates d ON upper(t.day_of_week) = upper(to_char(d.dt, 'FMDay'))
        GROUP BY s.subject_name
      )
      SELECT jsonb_object_agg(subject_name, scheduled_classes) AS by_subject,
             COALESCE(SUM(scheduled_classes),0) AS total
      FROM scheduled;
    `;

    const schedRes = await pool.query(scheduledQuery, [batchId, fromDate, toDate]);
    const bySubject = (schedRes.rows[0] && schedRes.rows[0].by_subject) || {};
    const totalScheduled = parseInt((schedRes.rows[0] && schedRes.rows[0].total) || 0, 10);

    // 2) For each student in that batch, compute classes attended per subject and late count
    const studentAttendanceQuery = `
      WITH batch_students AS (
        SELECT sm.student_id, sm.student_name, sm.enr_id
        FROM pp.student_master sm
        WHERE sm.batch_id = $1
      ),
      attend AS (
        SELECT sm.student_id,
               sub.subject_name,
               SUM(CASE WHEN sa.status IN ('PRESENT','LATE JOINED','LEAVE') THEN 1 ELSE 0 END) as attended_count,
               SUM(CASE WHEN sa.status = 'LATE JOINED' THEN 1 ELSE 0 END) as late_count
        FROM pp.student_attendance sa
        JOIN batch_students sm ON sm.student_id = sa.student_id
        JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
        JOIN pp.subject sub ON sub.subject_id = c.subject_id
        WHERE sa.date BETWEEN $2::date AND $3::date
        GROUP BY sm.student_id, sub.subject_name
      ),
      subjects AS (
        SELECT subject_name FROM pp.subject
      ),
      -- pivot attend into JSON structure per student
      student_summary AS (
        SELECT bs.student_id,
               bs.student_name,
               jsonb_object_agg(att.subject_name, COALESCE(att.attended_count,0)) FILTER (WHERE att.subject_name IS NOT NULL) as attended_by_subject,
               SUM(COALESCE(att.attended_count,0)) as classes_attended,
               SUM(COALESCE(att.late_count,0)) as late_count
        FROM batch_students bs
        LEFT JOIN attend att ON att.student_id = bs.student_id
        GROUP BY bs.student_id, bs.student_name
      )
      SELECT ss.student_id, ss.student_name, ss.attended_by_subject, ss.classes_attended, ss.late_count
      FROM student_summary ss
      ORDER BY ss.student_name;
    `;

    const stRes = await pool.query(studentAttendanceQuery, [batchId, fromDate, toDate]);

    // Assemble students and compute percent
    const students = stRes.rows.map((r) => {
      const attendedBySubject = r.attended_by_subject || {};
      const classesAttended = parseInt(r.classes_attended || 0, 10);
      const attendancePercent = totalScheduled > 0 ? +( (classesAttended / totalScheduled) * 100 ).toFixed(2) : 0;
      return {
        id: r.student_id,
        name: r.student_name,
        attended: attendedBySubject,
        classesAttended,
        late: parseInt(r.late_count || 0, 10),
        attendancePercent,
      };
    });

    // return same general shape as frontend expects
    return res.json({
      reportId: `ATT-${batchId}-${fromDate}-${toDate}`,
      actualConducted: { ...bySubject, total: totalScheduled },
      students,
      batchAverageAttendance:
        students.length > 0
          ? (students.reduce((s, a) => s + a.attendancePercent, 0) / students.length).toFixed(2)
          : "0.00",
    });
  } catch (err) {
    console.error("attendance report error", err);
    return res.status(500).json({ error: "Server error generating attendance report" });
  }
});

// --- 2) Absentees report ---
// GET /api/coordinator/reports/absentees?batchId=&fromDate=&toDate
router.get("/absentees", requireAuth, async (req, res) => {
  const { batchId, fromDate, toDate } = req.query;
  if (!batchId || !fromDate || !toDate) return res.status(400).json({ error: "batchId, fromDate and toDate required" });

  try {
    // Find students with missed classes by comparing scheduled classes and attended counts per subject.
    // Reuse scheduled calculation (per subject) for batch between dates
    const scheduledPerSubjectQuery = `
      WITH dates AS ( SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt ),
      batch_classrooms AS ( SELECT cb.classroom_id FROM pp.classroom_batch cb WHERE cb.batch_id = $1 ),
      scheduled AS (
        SELECT s.subject_name,
               t.classroom_id,
               count(*) AS scheduled_classes
        FROM pp.timetable t
        JOIN batch_classrooms bc ON bc.classroom_id = t.classroom_id
        JOIN pp.classroom c ON c.classroom_id = t.classroom_id
        JOIN pp.subject s ON s.subject_id = c.subject_id
        JOIN dates d ON upper(t.day_of_week) = upper(to_char(d.dt, 'FMDay'))
        GROUP BY s.subject_name, t.classroom_id
      )
      SELECT scheduled.*
      FROM scheduled;
    `;

    // Get attendance details per student per subject with missed dates
    const absenteesQuery = `
      WITH batch_students AS (
        SELECT sm.student_id, sm.student_name FROM pp.student_master sm WHERE sm.batch_id = $1
      ),
      scheduled AS (
        SELECT t.classroom_id, c.subject_id, s.subject_name, d.dt
        FROM (SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt) d
        JOIN pp.timetable t ON upper(t.day_of_week) = upper(to_char(d.dt, 'FMDay'))
        JOIN pp.classroom c ON c.classroom_id = t.classroom_id
        JOIN pp.classroom_batch cb ON cb.classroom_id = c.classroom_id AND cb.batch_id = $1
        JOIN pp.subject s ON s.subject_id = c.subject_id
      ),
      attendance AS (
        SELECT sa.student_id, sa.date, c.subject_id, s.subject_name, sa.status
        FROM pp.student_attendance sa
        JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
        JOIN pp.subject s ON s.subject_id = c.subject_id
        WHERE sa.date BETWEEN $2::date AND $3::date
      ),
      missed AS (
        SELECT bs.student_id, bs.student_name, sch.subject_name,
               count(*) FILTER (WHERE (att.status IS NULL OR att.status = 'ABSENT')) as missed_count,
               array_agg(distinct CASE WHEN att.status = 'ABSENT' THEN att.date END) FILTER (WHERE att.status = 'ABSENT') as missed_dates
        FROM batch_students bs
        JOIN scheduled sch ON sch.subject_name = sch.subject_name
        LEFT JOIN attendance att ON att.student_id = bs.student_id AND att.subject_name = sch.subject_name AND att.date = sch.dt
        GROUP BY bs.student_id, bs.student_name, sch.subject_name
      )
      SELECT m.student_id, m.student_name, m.subject_name, m.missed_count, coalesce(m.missed_dates, '{}') as missed_dates
      FROM missed m
      WHERE m.missed_count > 0
      ORDER BY m.student_name, m.missed_count desc;
    `;

    // Simpler approach: we will produce missed classes per student by counting scheduled occurrences and attended occurrences per subject and subtracting
    const missedByStudentQuery = `
      WITH dates AS ( SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt ),
      batch_classrooms AS ( SELECT cb.classroom_id FROM pp.classroom_batch cb WHERE cb.batch_id = $1 ),
      scheduled AS (
        SELECT c.subject_id, s.subject_name, d.dt
        FROM pp.classroom c
        JOIN batch_classrooms bc ON bc.classroom_id = c.classroom_id
        JOIN pp.timetable t ON t.classroom_id = c.classroom_id
        JOIN dates d ON upper(t.day_of_week) = upper(to_char(d.dt, 'FMDay'))
        JOIN pp.subject s ON s.subject_id = c.subject_id
      ),
      attended AS (
        SELECT sa.student_id, c.subject_id, sa.date, sa.status
        FROM pp.student_attendance sa
        JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
        WHERE sa.date BETWEEN $2::date AND $3::date
      ),
      compare AS (
        SELECT bs.student_id, bs.student_name, sch.subject_name,
               COUNT(*) FILTER (WHERE TRUE) AS scheduled_count,
               COUNT(att.*) FILTER (WHERE att.status IN ('PRESENT','LATE JOINED','LEAVE')) AS attended_count,
               ARRAY_AGG(CASE WHEN att.status = 'ABSENT' THEN att.date END) FILTER (WHERE att.status = 'ABSENT') AS absent_dates
        FROM (SELECT sm.student_id, sm.student_name FROM pp.student_master sm WHERE sm.batch_id = $1) bs
        JOIN scheduled sch ON TRUE
        LEFT JOIN attended att ON att.student_id = bs.student_id AND att.subject_id = sch.subject_id AND att.date = sch.dt
        GROUP BY bs.student_id, bs.student_name, sch.subject_name
      )
      SELECT student_id, student_name, subject_name, scheduled_count, attended_count, (scheduled_count - attended_count) as missed_count, coalesce(absent_dates, '{}') as missed_dates
      FROM compare
      WHERE (scheduled_count - attended_count) > 0
      ORDER BY missed_count DESC;
    `;

    const missedRes = await pool.query(missedByStudentQuery, [batchId, fromDate, toDate]);

    // Build grouped response: group rows by student
    const grouped = {};
    for (const r of missedRes.rows) {
      const sid = r.student_id;
      if (!grouped[sid]) grouped[sid] = { id: sid, name: r.student_name, missedClasses: [], totalMissed: 0 };
      grouped[sid].missedClasses.push({
        subject: r.subject_name,
        count: parseInt(r.missed_count, 10),
        dates: (r.missed_dates || []).filter(Boolean),
      });
      grouped[sid].totalMissed += parseInt(r.missed_count, 10);
    }

    const studentAbsentees = Object.values(grouped);

    return res.json({
      reportId: `ABS-${batchId}-${fromDate}-${toDate}`,
      students: studentAbsentees,
    });
  } catch (err) {
    console.error("absentees report error", err);
    return res.status(500).json({ error: "Server error generating absentees report" });
  }
});

// --- 3) Teacher Load (scheduled classes aggregated) ---
// GET /api/coordinator/reports/teacher-load?fromDate=&toDate
router.get("/teacher-load", requireAuth, async (req, res) => {
  const { fromDate, toDate } = req.query;
  if (!fromDate || !toDate) return res.status(400).json({ error: "fromDate and toDate required" });

  try {
    // Count scheduled classes that occur between dates, grouped by teacher and subject
    const query = `
      WITH dates AS ( SELECT generate_series($1::date, $2::date, interval '1 day')::date AS dt ),
      matched AS (
        SELECT t.classroom_id, c.teacher_id, c.subject_id, s.subject_name, to_char(d.dt, 'FMDay') as dayname
        FROM pp.timetable t
        JOIN dates d ON upper(t.day_of_week) = upper(to_char(d.dt, 'FMDay'))
        JOIN pp.classroom c ON c.classroom_id = t.classroom_id
        JOIN pp.subject s ON s.subject_id = c.subject_id
      )
      SELECT tch.teacher_id, tch.teacher_name, sub.subject_name, b.batch_id, b.batch_name, count(*) as scheduled
      FROM matched m
      JOIN pp.teacher tch ON tch.teacher_id = m.teacher_id
      LEFT JOIN pp.classroom_batch cb ON cb.classroom_id = m.classroom_id
      LEFT JOIN pp.batch b ON b.batch_id = cb.batch_id
      JOIN pp.subject sub ON sub.subject_name = m.subject_name
      GROUP BY tch.teacher_id, tch.teacher_name, sub.subject_name, b.batch_id, b.batch_name
      ORDER BY tch.teacher_name;
    `;

    const { rows } = await pool.query(query, [fromDate, toDate]);

    const assignments = rows.map((r) => ({
      teacher: r.teacher_name,
      cohort: null,
      batch: r.batch_name,
      subject: r.subject_name,
      scheduled: parseInt(r.scheduled, 10),
      type: "SCHEDULED",
    }));

    // build some filter options
    const teacherList = [...new Set(rows.map((r) => r.teacher_name || "").filter(Boolean))];
    const cohorts = []; // cohort might require extra joins — skip for brevity
    const batches = [...new Set(rows.map((r) => r.batch_name || "").filter(Boolean))];
    const types = ["SCHEDULED"];

    return res.json({
      reportId: `TEACHER-LOAD-${fromDate}-${toDate}`,
      assignments,
      totalScheduled: assignments.reduce((s, a) => s + a.scheduled, 0),
      teacherList,
      filterOptions: { teachers: teacherList, cohorts, batches, types, scheduled: [] },
    });
  } catch (err) {
    console.error("teacher-load error", err);
    return res.status(500).json({ error: "Server error generating teacher load" });
  }
});

// --- 4) Teacher performance ---
// GET /api/coordinator/reports/teacher-performance?teacherId=&fromDate=&toDate
router.get("/teacher-performance", requireAuth, async (req, res) => {
  const { teacherId, fromDate, toDate } = req.query;
  if (!teacherId || !fromDate || !toDate) return res.status(400).json({ error: "teacherId, fromDate and toDate required" });

  try {
    // Calculate scheduled classes for the teacher based on timetable occurrences between dates
    const scheduledQuery = `
      WITH dates AS ( SELECT generate_series($2::date, $3::date, interval '1 day')::date AS dt ),
      teacher_classrooms AS (
        SELECT classroom_id FROM pp.classroom WHERE teacher_id = $1
      ),
      scheduled AS (
        SELECT c.classroom_id, s.subject_name, d.dt
        FROM teacher_classrooms tc
        JOIN pp.classroom c ON c.classroom_id = tc.classroom_id
        JOIN pp.timetable t ON t.classroom_id = c.classroom_id
        JOIN dates d ON upper(t.day_of_week) = upper(to_char(d.dt, 'FMDay'))
        JOIN pp.subject s ON s.subject_id = c.subject_id
      )
      SELECT s.subject_name, COUNT(*) as scheduled
      FROM scheduled s
      GROUP BY s.subject_name;
    `;

    const scheduledRes = await pool.query(scheduledQuery, [teacherId, fromDate, toDate]);

    // Conducted classes: count distinct classroom/date/start/end combinations where at least one attendance row exists for that classroom and date (teacher delivered)
    const conductedQuery = `
      SELECT subj.subject_name, COUNT(DISTINCT (sa.classroom_id, sa.date, sa.start_time, sa.end_time)) as conducted
      FROM pp.student_attendance sa
      JOIN pp.classroom c ON c.classroom_id = sa.classroom_id
      JOIN pp.subject subj ON subj.subject_id = c.subject_id
      WHERE c.teacher_id = $1
      AND sa.date BETWEEN $2::date AND $3::date
      GROUP BY subj.subject_name;
    `;

    const conductedRes = await pool.query(conductedQuery, [teacherId, fromDate, toDate]);

    // Merge scheduled and conducted by subject
    const subjectsMap = {};
    scheduledRes.rows.forEach((r) => {
      subjectsMap[r.subject_name] = { scheduled: parseInt(r.scheduled, 10), conducted: 0 };
    });
    conductedRes.rows.forEach((r) => {
      if (!subjectsMap[r.subject_name]) subjectsMap[r.subject_name] = { scheduled: 0, conducted: parseInt(r.conducted, 10) };
      else subjectsMap[r.subject_name].conducted = parseInt(r.conducted, 10);
    });

    const subjects = Object.keys(subjectsMap).map((subj) => {
      const s = subjectsMap[subj];
      const completion = s.scheduled > 0 ? +(((s.conducted / s.scheduled) * 100).toFixed(1)) : 0;
      return {
        cohort: null,
        batch: null,
        subject: subj,
        scheduled: s.scheduled,
        conducted: s.conducted,
        completion,
      };
    });

    // fetch teacher name
    const tRes = await pool.query("SELECT teacher_name FROM pp.teacher WHERE teacher_id = $1", [teacherId]);
    const teacherName = (tRes.rows[0] && tRes.rows[0].teacher_name) || null;

    const totalScheduled = subjects.reduce((s, x) => s + x.scheduled, 0);
    const totalConducted = subjects.reduce((s, x) => s + x.conducted, 0);
    const overallCompletion = totalScheduled > 0 ? +(((totalConducted / totalScheduled) * 100).toFixed(2)) : 0;

    return res.json({
      reportId: `TP-${teacherId}-${fromDate}-${toDate}`,
      teacher: teacherName,
      totalScheduled,
      totalConducted,
      overallCompletion,
      subjects,
    });
  } catch (err) {
    console.error("teacher-performance error", err);
    return res.status(500).json({ error: "Server error generating teacher performance" });
  }
});

module.exports = router;
