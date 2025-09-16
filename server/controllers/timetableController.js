const pool = require('../config/db');

const getActiveCohorts = async (req, res) => {
    try {
        const query = `
            SELECT * FROM pp.cohort
            WHERE end_date IS NULL;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching active cohorts:', error);
        res.status(500).json({ message: 'Server error while fetching active cohorts.' });
    }
};

const getTimeTableByBatch = async (req, res) => {
    const { batchId } = req.params;
    try {
        const query = `
            SELECT
                ts.slot_id AS id,
                ts.day_of_week,
                TO_CHAR(ts.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(ts.end_time, 'HH12:MI AM') AS time,
                s.subject_name AS subject,
                u.user_name AS teacher,
                p.platform_name AS platform
            FROM
                pp.timetable_slot ts
            LEFT JOIN
                pp.subject s ON ts.subject_id = s.subject_id
            LEFT JOIN
                pp.user u ON ts.teacher_id = u.user_id
            LEFT JOIN
                pp.platform p ON ts.platform_id = p.platform_id
            WHERE
                ts.batch_id = $1
            ORDER BY
                CASE ts.day_of_week
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    WHEN 'Saturday' THEN 6
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
        res.status(200).json(timetable);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ message: 'Server error while fetching timetable.' });
    }
};

const addTimetableSlot = async (req, res) => {
    const { batchId, teacherId, subjectId, platformId, dayOfWeek, startTime, endTime } = req.body;

    if (!batchId || !dayOfWeek || !startTime) {
        return res.status(400).json({ message: 'Batch, day, and start time are required.' });
    }

    try {
        const query = `
            INSERT INTO pp.timetable_slot 
                (batch_id, teacher_id, subject_id, platform_id, day_of_week, start_time, end_time)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [batchId, teacherId, subjectId, platformId, dayOfWeek, startTime, endTime];
        const { rows } = await pool.query(query, values);
        res.status(201).json({ message: 'Timetable slot added successfully.', slot: rows[0] });
    } catch (error) {
        console.error('Error adding timetable slot:', error);
        // Check for unique constraint violation (double-booking a teacher)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Conflict: This teacher is already scheduled at this time.' });
        }
        res.status(500).json({ message: 'Server error while adding slot.' });
    }
};

const updateTimetableSlot = async (req, res) => {
    const { slotId } = req.params;
    const { teacherId, subjectId, platformId, dayOfWeek, startTime, endTime } = req.body;

    try {
        const query = `
            UPDATE pp.timetable_slot
            SET 
                teacher_id = $1, 
                subject_id = $2, 
                platform_id = $3, 
                day_of_week = $4, 
                start_time = $5, 
                end_time = $6
            WHERE 
                slot_id = $7
            RETURNING *;
        `;
        const values = [teacherId, subjectId, platformId, dayOfWeek, startTime, endTime, slotId];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Slot not found.' });
        }

        res.status(200).json({ message: 'Timetable slot updated successfully.', slot: rows[0] });
    } catch (error) {
        console.error('Error updating timetable slot:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Conflict: This teacher is already scheduled at this time.' });
        }
        res.status(500).json({ message: 'Server error while updating slot.' });
    }
};

const deleteTimetableSlot = async (req, res) => {
    const { slotId } = req.params;

    try {
        const { rowCount } = await pool.query('DELETE FROM pp.timetable_slot WHERE slot_id = $1', [slotId]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Slot not found.' });
        }

        res.status(200).json({ message: 'Timetable slot deleted successfully.' });
    } catch (error) {
        console.error('Error deleting timetable slot:', error);
        res.status(500).json({ message: 'Server error while deleting slot.' });
    }
};


const getSubjects = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT subject_id, subject_name FROM pp.subject ORDER BY subject_name');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


const getTeachers = async (req, res) => {
    try {
        const query = `
            SELECT u.user_id, u.user_name
            FROM pp.user u
            JOIN pp.user_role ur ON u.user_id = ur.user_id
            JOIN pp.role r ON ur.role_id = r.role_id
            WHERE r.role_name = 'TEACHER'
            ORDER BY u.user_name;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


const getPlatforms = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT platform_id, platform_name FROM pp.platform ORDER BY platform_name');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching platforms:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getBatchesByCohort = async (req, res) => {
  try {
    const { cohort_number } = req.query;
    if (!cohort_number) {
      return res.status(400).json({ error: "cohort_number query parameter is required" });
    }

    const result = await pool.query(`
      SELECT * 
      FROM pp.batch
      WHERE cohort_number = $1
    `, [cohort_number]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches by cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }

};

const addSubject = async (req, res) => {
    const { subject_name } = req.body;
    if (!subject_name) {
        return res.status(400).json({ message: 'Subject name is required.' });
    }
    try {
        const query = 'INSERT INTO pp.subject (subject_name) VALUES ($1) RETURNING *';
        const { rows } = await pool.query(query, [subject_name]);
        res.status(201).json({ message: 'Subject added successfully.', subject: rows[0] });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({ message: 'Server error while adding subject.' });
    }
};

const addPlatform = async (req, res) => {
    const { platform_name } = req.body;
    if (!platform_name) {
        return res.status(400).json({ message: 'Platform name is required.' });
    }
    try {
        const query = 'INSERT INTO pp.platform (platform_name) VALUES ($1) RETURNING *';
        const { rows } = await pool.query(query, [platform_name]);
        res.status(201).json({ message: 'Platform added successfully.', platform: rows[0] });
    } catch (error) {
        console.error('Error adding platform:', error);
        res.status(500).json({ message: 'Server error while adding platform.' });
    }
};
const deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query('DELETE FROM pp.subject WHERE subject_id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Subject not found.' });
        }
        res.status(200).json({ message: 'Subject deleted successfully.' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ message: 'Server error while deleting subject.' });
    }
};

const deletePlatform = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query('DELETE FROM pp.platform WHERE platform_id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Platform not found.' });
        }
        res.status(200).json({ message: 'Platform deleted successfully.' });
    } catch (error) {
        console.error('Error deleting platform:', error);
        res.status(500).json({ message: 'Server error while deleting platform.' });
    }
};


module.exports = {
    getTimeTableByBatch,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    getSubjects,
    getTeachers,
    getPlatforms,
    getActiveCohorts,
    getBatchesByCohort,
    addSubject,
    addPlatform,
    deleteSubject,
    deletePlatform,
};
