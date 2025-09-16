const pool = require("../config/db");

// --- Cohort Model ---
const Cohort = {

    findAllActive: async () => {
        try {
            const query = `
                SELECT * FROM pp.cohort
                WHERE end_date IS NULL ORDER BY start_date DESC;
            `;
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error("Error fetching active cohorts:", error.message);
            throw new Error("Failed to fetch active cohorts.");
        }
    },
};

// --- TimetableSlot Model ---
const TimetableSlot = {
    
    findByBatchId: async (batchId) => {
        try {
            const query = `
                SELECT 
                    ts.slot_id AS id,
                    ts.day_of_week,
                    TO_CHAR(ts.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(ts.end_time, 'HH12:MI AM') AS time,
                    s.subject_name AS subject,
                    u.user_name AS teacher,
                    p.platform_name AS platform
                FROM pp.timetable_slot ts
                LEFT JOIN pp.subject s ON ts.subject_id = s.subject_id
                LEFT JOIN pp.user u ON ts.teacher_id = u.user_id
                LEFT JOIN pp.platform p ON ts.platform_id = p.platform_id
                WHERE ts.batch_id = $1
                ORDER BY
                    CASE ts.day_of_week
                        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
                        WHEN 'Sunday' THEN 7
                    END,
                    ts.start_time;
            `;
            const { rows } = await pool.query(query, [batchId]);

            const timetable = rows.reduce((acc, slot) => {
                const day = slot.day_of_week;
                if (!acc[day]) {
                    acc[day] = [];
                }
                acc[day].push(slot);
                return acc;
            }, {});

            return timetable;
        } catch (error) {
            console.error("Error fetching timetable by batch ID:", error.message);
            throw new Error("Failed to fetch timetable.");
        }
    },

    create: async (slotData) => {
        const { batchId, teacherId, subjectId, platformId, dayOfWeek, startTime, endTime } = slotData;
        if (!batchId || !dayOfWeek || !startTime) {
            throw new Error("Batch ID, day of the week, and start time are required fields.");
        }
        try {
            const query = `
                INSERT INTO pp.timetable_slot (batch_id, teacher_id, subject_id, platform_id, day_of_week, start_time, end_time)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            const values = [batchId, teacherId, subjectId, platformId, dayOfWeek, startTime, endTime];
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error("Error creating timetable slot:", error.message);
            if (error.code === '23505') {
                throw new Error("This teacher is already scheduled at this time.");
            }
            throw new Error("Failed to create timetable slot.");
        }
    },


    update: async (slotId, slotData) => {
        const { teacherId, subjectId, platformId, dayOfWeek, startTime, endTime } = slotData;
        try {
            const query = `
                UPDATE pp.timetable_slot
                SET teacher_id = $1, subject_id = $2, platform_id = $3, day_of_week = $4, start_time = $5, end_time = $6
                WHERE slot_id = $7
                RETURNING *;
            `;
            const values = [teacherId, subjectId, platformId, dayOfWeek, startTime, endTime, slotId];
            const { rows } = await pool.query(query, values);
            if (rows.length === 0) {
                throw new Error("Timetable slot not found.");
            }
            return rows[0];
        } catch (error) {
            console.error("Error updating timetable slot:", error.message);
            if (error.code === '23505') {
                throw new Error("This teacher is already scheduled at this time.");
            }
            throw new Error("Failed to update timetable slot.");
        }
    },


    delete: async (slotId) => {
        try {
            const result = await pool.query("DELETE FROM pp.timetable_slot WHERE slot_id = $1", [slotId]);
            if (result.rowCount === 0) {
                throw new Error("Timetable slot not found.");
            }
            return true;
        } catch (error) {
            console.error("Error deleting timetable slot:", error.message);
            throw new Error("Failed to delete timetable slot.");
        }
    },
};

// --- Other Models ---
const Subject = {
    findAll: async () => {
        try {
            const { rows } = await pool.query('SELECT subject_id, subject_name FROM pp.subject ORDER BY subject_name');
            return rows;
        } catch (error) {
            console.error("Error fetching subjects:", error.message);
            throw new Error("Failed to fetch subjects.");
        }
    }
};

const Teacher = {
    findAll: async () => {
        try {
            const query = `
                SELECT u.user_id, u.user_name
                FROM pp.user u
                JOIN pp.user_role ur ON u.user_id = ur.user_id
                JOIN pp.role r ON ur.role_id = r.role_id
                WHERE r.role_name = 'Teacher'
                ORDER BY u.user_name;
            `;
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error("Error fetching teachers:", error.message);
            throw new Error("Failed to fetch teachers.");
        }
    }
};

const Platform = {
    findAll: async () => {
        try {
            const { rows } = await pool.query('SELECT platform_id, platform_name FROM pp.platform ORDER BY platform_name');
            return rows;
        } catch (error) {
            console.error("Error fetching platforms:", error.message);
            throw new Error("Failed to fetch platforms.");
        }
    }
};

// Correctly export all defined models
module.exports = {
    TimetableSlot,
    Cohort,
    Subject,
    Teacher,
    Platform,
};
