const pool = require("../config/db");

// ==========================
// COHORT MODEL
// ==========================
const Cohort = {
    findAllActive: async () => {
        try {
            const query = `
                SELECT *
                FROM pp.cohort
                WHERE end_date IS NULL
                ORDER BY start_date DESC;
            `;
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error("Error fetching active cohorts:", error.message);
            throw new Error("Failed to fetch active cohorts.");
        }
    }
};

// ==========================
// TIMETABLE MODEL (NEW STRUCTURE)
// ==========================

const Timetable = {

    // --------------------------
    // 1. FIND TIMETABLE BY BATCH
    // --------------------------
    findByBatchId: async (batchId) => {
        try {
            const query = `
                SELECT 
                    tt.timetable_id AS id,
                    tt.day_of_week,
                    TO_CHAR(tt.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(tt.end_time, 'HH12:MI AM') AS time,

                    -- classroom level
                    c.classroom_id,
                    c.classroom_name,

                    -- subject
                    s.subject_name AS subject,

                    -- teacher
                    t.teacher_name AS teacher,

                    -- platform
                    p.platform_name AS platform

                FROM pp.timetable tt
                JOIN pp.classroom c ON tt.classroom_id = c.classroom_id
                JOIN pp.classroom_batch cb ON cb.classroom_id = c.classroom_id
                LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
                LEFT JOIN pp.teacher t ON c.teacher_id = t.teacher_id
                LEFT JOIN pp.teaching_platform p ON c.platform_id = p.platform_id

                WHERE cb.batch_id = $1

                ORDER BY
                    CASE tt.day_of_week
                        WHEN 'MONDAY' THEN 1 WHEN 'TUESDAY' THEN 2 WHEN 'WEDNESDAY' THEN 3
                        WHEN 'THURSDAY' THEN 4 WHEN 'FRIDAY' THEN 5 WHEN 'SATURDAY' THEN 6
                        WHEN 'SUNDAY' THEN 7 END,
                    tt.start_time;
            `;

            const { rows } = await pool.query(query, [batchId]);

            const timetable = rows.reduce((acc, slot) => {
                const day = slot.day_of_week;
                if (!acc[day]) acc[day] = [];
                acc[day].push(slot);
                return acc;
            }, {});

            return timetable;

        } catch (error) {
            console.error("Error fetching timetable:", error.message);
            throw new Error("Failed to fetch timetable.");
        }
    },

    // --------------------------
    // 2. CREATE NEW TIMETABLE SLOT
    // --------------------------
    create: async (data) => {
        const { batchId, subjectId, teacherId, platformId, dayOfWeek, startTime, endTime } = data;

        try {
            // 1. Create / reuse classroom
            const classroomQuery = `
                INSERT INTO pp.classroom (classroom_name, subject_id, teacher_id, platform_id, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING classroom_id;
            `;
            const className = `AUTO-${subjectId}-${teacherId}-${platformId}`;
            const classroomRes = await pool.query(classroomQuery, [className, subjectId, teacherId, platformId]);

            const classroomId = classroomRes.rows[0].classroom_id;

            // 2. Link classroom to batch
            await pool.query(
                `INSERT INTO pp.classroom_batch (classroom_id, batch_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [classroomId, batchId]
            );

            // 3. Insert timetable entry
            const ttQuery = `
                INSERT INTO pp.timetable (classroom_id, day_of_week, start_time, end_time)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const { rows } = await pool.query(ttQuery, [classroomId, dayOfWeek, startTime, endTime]);

            return rows[0];

        } catch (error) {
            console.error("Error creating timetable slot:", error.message);
            throw new Error("Failed to create timetable slot.");
        }
    },

    // --------------------------
    // 3. UPDATE TIMETABLE SLOT
    // --------------------------
    update: async (timetableId, data) => {
        const { subjectId, teacherId, platformId, dayOfWeek, startTime, endTime } = data;

        try {
            // Get existing classroom
            const ttRes = await pool.query(
                `SELECT classroom_id FROM pp.timetable WHERE timetable_id = $1`,
                [timetableId]
            );
            if (ttRes.rows.length === 0) throw new Error("Timetable slot not found.");

            const classroomId = ttRes.rows[0].classroom_id;

            // Update classroom
            await pool.query(
                `UPDATE pp.classroom
                 SET subject_id = $1, teacher_id = $2, platform_id = $3
                 WHERE classroom_id = $4`,
                [subjectId, teacherId, platformId, classroomId]
            );

            // Update timetable
            const updateQuery = `
                UPDATE pp.timetable
                SET day_of_week = $1, start_time = $2, end_time = $3
                WHERE timetable_id = $4
                RETURNING *;
            `;
            const { rows } = await pool.query(updateQuery, [
                dayOfWeek, startTime, endTime, timetableId
            ]);

            return rows[0];

        } catch (error) {
            console.error("Error updating timetable:", error.message);
            throw new Error("Failed to update timetable.");
        }
    },

    // --------------------------
    // 4. DELETE TIMETABLE SLOT
    // --------------------------
    delete: async (timetableId) => {
        try {
            const result = await pool.query(
                "DELETE FROM pp.timetable WHERE timetable_id = $1",
                [timetableId]
            );

            if (result.rowCount === 0) throw new Error("Timetable slot not found.");

            return true;

        } catch (error) {
            console.error("Error deleting timetable:", error.message);
            throw new Error("Failed to delete timetable slot.");
        }
    }
};

// ==========================
// SUBJECT MODEL
// ==========================
const Subject = {
    findAll: async () => {
        try {
            const { rows } = await pool.query(`
                SELECT subject_id, subject_name
                FROM pp.subject
                ORDER BY subject_name
            `);
            return rows;
        } catch (error) {
            console.error("Error fetching subjects:", error.message);
            throw new Error("Failed to fetch subjects.");
        }
    }
};

// ==========================
// TEACHER MODEL
// ==========================
const Teacher = {
    findAll: async () => {
        try {
            const { rows } = await pool.query(`
                SELECT teacher_id, teacher_name
                FROM pp.teacher
                ORDER BY teacher_name;
            `);
            return rows;
        } catch (error) {
            console.error("Error fetching teachers:", error.message);
            throw new Error("Failed to fetch teachers.");
        }
    }
};

// ==========================
// PLATFORM MODEL
// ==========================
const Platform = {
    findAll: async () => {
        try {
            const { rows } = await pool.query(`
                SELECT platform_id, platform_name
                FROM pp.teaching_platform
                ORDER BY platform_name;
            `);
            return rows;
        } catch (error) {
            console.error("Error fetching platforms:", error.message);
            throw new Error("Failed to fetch platforms.");
        }
    }
};

// ==========================
// EXPORT MODULES
// ==========================
module.exports = {
    Cohort,
    Timetable,
    Subject,
    Teacher,
    Platform,
};
