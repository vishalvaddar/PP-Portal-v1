const pool = require("../config/db");

// ======================================================
//  GET ACTIVE COHORTS
// ======================================================
const getActiveCohorts = async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM pp.cohort
            WHERE end_date IS NULL
            ORDER BY start_date DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching active cohorts:", error);
        res.status(500).json({ message: "Server error while fetching active cohorts." });
    }
};

// ======================================================
//  GET TIMETABLE BY BATCH — USING NEW DB STRUCTURE
// ======================================================
const getTimeTableByBatch = async (req, res) => {
    const { batchId } = req.params;

    if (!batchId) {
        return res.status(400).json({ message: "Batch ID is required." });
    }

    try {
        const query = `
            SELECT 
                tt.timetable_id AS id,
                tt.day_of_week,
                TO_CHAR(tt.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(tt.end_time, 'HH12:MI AM') AS time,

                c.classroom_id,
                c.classroom_name,

                s.subject_name AS subject,
                u.user_name AS teacher,
                p.platform_name AS platform

            FROM pp.timetable tt
            JOIN pp.classroom c ON c.classroom_id = tt.classroom_id
            JOIN pp.classroom_batch cb ON cb.classroom_id = c.classroom_id
            LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
            LEFT JOIN pp.teacher t ON c.teacher_id = t.teacher_id
            LEFT JOIN pp.user u ON t.user_id = u.user_id
            LEFT JOIN pp.teaching_platform p ON c.platform_id = p.platform_id

            WHERE cb.batch_id = $1

            ORDER BY
                CASE UPPER(tt.day_of_week)
                    WHEN 'SUNDAY' THEN 1
                    WHEN 'MONDAY' THEN 2
                    WHEN 'TUESDAY' THEN 3
                    WHEN 'WEDNESDAY' THEN 4
                    WHEN 'THURSDAY' THEN 5
                    WHEN 'FRIDAY' THEN 6
                    WHEN 'SATURDAY' THEN 7
                END,
                tt.start_time;
        `;

        const { rows } = await pool.query(query, [batchId]);

        // Group timetable slots by day
        const timetable = rows.reduce((acc, slot) => {
            const day = slot.day_of_week;
            if (!acc[day]) acc[day] = [];
            acc[day].push(slot);
            return acc;
        }, {});

        res.status(200).json(timetable);

    } catch (error) {
        console.error("Error fetching timetable:", error);
        res.status(500).json({ message: "Server error while fetching timetable." });
    }
};

// ======================================================
//  ADD NEW TIMETABLE SLOT — NEW LOGIC (classroom + timetable)
// ======================================================
const addTimetableSlot = async (req, res) => {
    const { batchId, subjectId, teacherId, platformId, dayOfWeek, startTime, endTime } = req.body;

    if (!batchId || !dayOfWeek || !startTime) {
        return res.status(400).json({ message: "Batch, day, and start time are required." });
    }

    try {
        // 1. Create classroom
        const className = `AUTO-${subjectId}-${teacherId}-${platformId}`;
        const classroomRes = await pool.query(
            `INSERT INTO pp.classroom (classroom_name, subject_id, teacher_id, platform_id)
             VALUES ($1, $2, $3, $4)
             RETURNING classroom_id`,
            [className, subjectId, teacherId, platformId]
        );

        const classroomId = classroomRes.rows[0].classroom_id;

        // 2. Map classroom → batch
        await pool.query(
            `INSERT INTO pp.classroom_batch (classroom_id, batch_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [classroomId, batchId]
        );

        // 3. Add timetable entry
        const ttRes = await pool.query(
            `INSERT INTO pp.timetable (classroom_id, day_of_week, start_time, end_time)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [classroomId, dayOfWeek, startTime, endTime]
        );

        res.status(201).json({ message: "Timetable slot added successfully.", slot: ttRes.rows[0] });

    } catch (error) {
        console.error("Error adding timetable slot:", error);
        res.status(500).json({ message: "Server error while adding slot." });
    }
};

// ======================================================
//  UPDATE TIMETABLE SLOT
// ======================================================
const updateTimetableSlot = async (req, res) => {
    const { slotId } = req.params;
    const { subjectId, teacherId, platformId, dayOfWeek, startTime, endTime } = req.body;

    try {
        // 1. Fetch classroom
        const ttRes = await pool.query(
            `SELECT classroom_id FROM pp.timetable WHERE timetable_id = $1`,
            [slotId]
        );

        if (ttRes.rows.length === 0) {
            return res.status(404).json({ message: "Slot not found." });
        }

        const classroomId = ttRes.rows[0].classroom_id;

        // 2. Update classroom
        await pool.query(
            `UPDATE pp.classroom
             SET subject_id = $1, teacher_id = $2, platform_id = $3
             WHERE classroom_id = $4`,
            [subjectId, teacherId, platformId, classroomId]
        );

        // 3. Update timetable slot
        const updateRes = await pool.query(
            `UPDATE pp.timetable
             SET day_of_week = $1, start_time = $2, end_time = $3
             WHERE timetable_id = $4
             RETURNING *`,
            [dayOfWeek, startTime, endTime, slotId]
        );

        res.status(200).json({ message: "Timetable slot updated successfully.", slot: updateRes.rows[0] });

    } catch (error) {
        console.error("Error updating timetable slot:", error);
        res.status(500).json({ message: "Server error while updating slot." });
    }
};

// ======================================================
//  DELETE TIMETABLE SLOT
// ======================================================
const deleteTimetableSlot = async (req, res) => {
    const { slotId } = req.params;

    try {
        const result = await pool.query("DELETE FROM pp.timetable WHERE timetable_id = $1", [slotId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Slot not found." });
        }

        res.status(200).json({ message: "Timetable slot deleted successfully." });

    } catch (error) {
        console.error("Error deleting timetable slot:", error);
        res.status(500).json({ message: "Server error while deleting slot." });
    }
};

// ======================================================
//  SUBJECT API
// ======================================================
const getSubjects = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT subject_id, subject_name, subject_code
            FROM pp.subject
            ORDER BY subject_name
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ======================================================
//  TEACHER API (NEW TABLE)
// ======================================================
const getTeachers = async (req, res ) => {
    try {
        const { rows } = await pool.query(`
            SELECT teacher_id, user_name
            FROM pp.teacher, pp.user
            WHERE pp.teacher.user_id = pp.user.user_id
            ORDER BY user_name
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ======================================================
//  PLATFORM API (NEW TABLE: teaching_platform)
// ======================================================
const getPlatforms = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT platform_id, platform_name
            FROM pp.teaching_platform
            ORDER BY platform_name
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching platforms:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ======================================================
//  GET BATCHES OF COHORT
// ======================================================
const getBatchesByCohort = async (req, res) => {
    try {
        const { cohortId } = req.params;

        if (!cohortId) {
            return res.status(400).json({ error: "Cohort ID parameter is required" });
        }

        const result = await pool.query(
            `SELECT batch_id, batch_name
             FROM pp.batch
             WHERE cohort_number = $1
             ORDER BY batch_name`,
            [cohortId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching batches by cohort:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ======================================================
//  ADD SUBJECT / PLATFORM
// ======================================================
const addSubject = async (req, res) => {
    const { subject_name, subject_code } = req.body;
    if (!subject_name || !subject_code) {
        return res.status(400).json({ message: "Subject name and code are required." });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO pp.subject (subject_name, subject_code) VALUES ($1, $2) RETURNING *`,
            [subject_name, subject_code]
        );
        res.status(201).json({ message: "Subject added successfully.", subject: rows[0] });
    } catch (error) {
        console.error("Error adding subject:", error);
        res.status(500).json({ message: "Server error while adding subject." });
    }
};

const addPlatform = async (req, res) => {
    const { platform_name } = req.body;
    if (!platform_name) {
        return res.status(400).json({ message: "Platform name is required." });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO pp.teaching_platform (platform_name) VALUES ($1) RETURNING *`,
            [platform_name]
        );
        res.status(201).json({ message: "Platform added successfully.", platform: rows[0] });
    } catch (error) {
        console.error("Error adding platform:", error);
        res.status(500).json({ message: "Server error while adding platform." });
    }
};

// ======================================================
//  DELETE SUBJECT / PLATFORM
// ======================================================
const deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM pp.subject WHERE subject_id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Subject not found." });
        }
        res.status(200).json({ message: "Subject deleted successfully." });
    } catch (error) {
        console.error("Error deleting subject:", error);
        res.status(500).json({ message: "Server error while deleting subject." });
    }
};

const deletePlatform = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM pp.teaching_platform WHERE platform_id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Platform not found." });
        }
        res.status(200).json({ message: "Platform deleted successfully." });
    } catch (error) {
        console.error("Error deleting platform:", error);
        res.status(500).json({ message: "Server error while deleting platform." });
    }
};

// ======================================================
//  EXPORTS
// ======================================================
module.exports = {
    getActiveCohorts,
    getTimeTableByBatch,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,

    getSubjects,
    getTeachers,
    getPlatforms,

    getBatchesByCohort,

    addSubject,
    addPlatform,
    deleteSubject,
    deletePlatform,
};
