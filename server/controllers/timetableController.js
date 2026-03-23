const pool = require("../config/db");

// ======================================================
// GET ACTIVE COHORTS
// ======================================================
const getActiveCohorts = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT *
            FROM pp.cohort
            WHERE end_date IS NULL
            ORDER BY start_date DESC
        `);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error fetching active cohorts:", error);
        res.status(500).json({ message: "Server error while fetching cohorts." });
    }
};

// ======================================================
// GET TIMETABLE BY BATCH
// ======================================================
const getTimeTableByBatch = async (req, res) => {
    const { batchId } = req.params;

    try {
        const { rows } = await pool.query(`
            SELECT 
                tt.timetable_id AS id,
                tt.day_of_week,
                tt.start_time,
                tt.end_time,

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
                CASE tt.day_of_week
                    WHEN 'SUNDAY' THEN 1
                    WHEN 'MONDAY' THEN 2
                    WHEN 'TUESDAY' THEN 3
                    WHEN 'WEDNESDAY' THEN 4
                    WHEN 'THURSDAY' THEN 5
                    WHEN 'FRIDAY' THEN 6
                    WHEN 'SATURDAY' THEN 7
                END,
                tt.start_time
        `, [batchId]);

        const timetable = rows.reduce((acc, slot) => {
            if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
            acc[slot.day_of_week].push(slot);
            return acc;
        }, {});

        res.status(200).json(timetable);

    } catch (error) {
        console.error("Error fetching timetable:", error);
        res.status(500).json({ message: "Server error while fetching timetable." });
    }
};

// ======================================================
// ADD TIMETABLE SLOT
// ======================================================
const addTimetableSlot = async (req, res) => {

    const {
        batchId,
        subjectId,
        teacherId,
        platformId,
        dayOfWeek,
        startTime,
        endTime
    } = req.body;

    const createdBy = req.user?.user_id || 1;

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // normalize day value to match DB check constraint (e.g. 'MONDAY')
        const mappedDay = typeof dayOfWeek === 'string' ? dayOfWeek.toUpperCase() : dayOfWeek;

        // create classroom
        const classroom = await client.query(
            `INSERT INTO pp.classroom
            (classroom_name, subject_id, teacher_id, platform_id)
            VALUES ($1,$2,$3,$4)
            RETURNING classroom_id`,
            [`AUTO-${subjectId}-${teacherId}`, subjectId, teacherId, platformId]
        );

        const classroomId = classroom.rows[0].classroom_id;

        // map classroom to batch
        await client.query(
            `INSERT INTO pp.classroom_batch (classroom_id, batch_id)
             VALUES ($1,$2)
             ON CONFLICT DO NOTHING`,
            [classroomId, batchId]
        );

        // insert timetable
        const timetable = await client.query(
            `INSERT INTO pp.timetable
            (classroom_id, day_of_week, start_time, end_time, created_by)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [classroomId, mappedDay, startTime, endTime, createdBy]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Timetable slot added successfully",
            slot: timetable.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(400).json({
                message: "Timetable already exists for this classroom and day"
            });
        }

        console.error("Error adding timetable:", error);
        res.status(500).json({ message: "Server error while adding timetable." });

    } finally {
        client.release();
    }
};

// ======================================================
// UPDATE TIMETABLE SLOT
// ======================================================
const updateTimetableSlot = async (req, res) => {

    const { slotId } = req.params;
    const { dayOfWeek, startTime, endTime, subjectId, teacherId, platformId } = req.body;

    const updatedBy = req.user?.user_id || 1;

    // normalize day value to match DB check constraint (e.g. 'MONDAY')
    const mappedDay = typeof dayOfWeek === 'string' ? dayOfWeek.toUpperCase() : dayOfWeek;

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const timetable = await client.query(
            `SELECT classroom_id FROM pp.timetable WHERE timetable_id = $1`,
            [slotId]
        );

        if (timetable.rows.length === 0) {
            return res.status(404).json({ message: "Timetable slot not found." });
        }

        const classroomId = timetable.rows[0].classroom_id;

        // update classroom
        await client.query(
            `UPDATE pp.classroom
             SET subject_id = $1,
                 teacher_id = $2,
                 platform_id = $3
             WHERE classroom_id = $4`,
            [subjectId, teacherId, platformId, classroomId]
        );

        // update timetable
        const updated = await client.query(
            `UPDATE pp.timetable
             SET day_of_week = $1,
                 start_time = $2,
                 end_time = $3,
                 updated_by = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE timetable_id = $5
             RETURNING *`,
            [mappedDay, startTime, endTime, updatedBy, slotId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Timetable updated successfully",
            slot: updated.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error updating timetable:", error);
        res.status(500).json({ message: "Server error while updating timetable." });

    } finally {
        client.release();
    }
};

// ======================================================
// DELETE TIMETABLE SLOT
// ======================================================
const deleteTimetableSlot = async (req, res) => {

    const { slotId } = req.params;

    try {

        const result = await pool.query(
            `DELETE FROM pp.timetable WHERE timetable_id = $1`,
            [slotId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Slot not found." });
        }

        res.status(200).json({
            message: "Timetable slot deleted successfully"
        });

    } catch (error) {

        console.error("Error deleting timetable:", error);
        res.status(500).json({ message: "Server error while deleting timetable." });
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
