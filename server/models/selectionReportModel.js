const pool = require('../config/db');

const SelectionReportsModel = {
    getAcademicYears: async () => {
        const query = `SELECT DISTINCT academic_year FROM pp.system_config ORDER BY academic_year DESC`;
        const { rows } = await pool.query(query);
        return rows;
    },
 
    getNMMSReport: async (year, type) => {
        if (type === 'district') {
            const query = `
                SELECT d.juris_name AS label, COUNT(a.applicant_id) AS applicant_count
                FROM pp.applicant_primary_info a
                JOIN pp.jurisdiction d ON a.district = d.juris_code
                WHERE a.nmms_year = $1
                GROUP BY d.juris_name ORDER BY d.juris_name;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        } else {
            const query = `
                SELECT 
                    d.juris_name AS district_name,
                    b.juris_name AS label,
                    COUNT(a.applicant_id) AS applicant_count
                FROM pp.applicant_primary_info a
                JOIN pp.jurisdiction d ON a.district = d.juris_code
                JOIN pp.jurisdiction b ON a.nmms_block = b.juris_code
                WHERE a.nmms_year = $1
                GROUP BY d.juris_name, b.juris_name
                ORDER BY d.juris_name, b.juris_name;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        }
    },

    // --- NEW: Test Turn-Out Report Method ---
    getTurnOutReport: async (year, type) => {
        if (type === 'district') {
            const query = `
                SELECT
                    j.juris_name AS label,
                    /* Called students */
                    COUNT(DISTINCT s.applicant_id) AS called_count,
                    /* Appeared students */
                    COUNT(DISTINCT CASE 
                        WHEN a.pp_exam_appeared_yn = 'Y' 
                        THEN s.applicant_id 
                    END) AS appeared_count,
                    /* Turn-out percentage */
                    ROUND(
                        COUNT(DISTINCT CASE 
                            WHEN a.pp_exam_appeared_yn = 'Y' 
                            THEN s.applicant_id 
                        END) * 100.0
                        / NULLIF(COUNT(DISTINCT s.applicant_id), 0),
                        2
                    ) AS turnout_percentage
                FROM pp.applicant_shortlist_info s
                JOIN pp.applicant_primary_info ap ON ap.applicant_id = s.applicant_id
                LEFT JOIN pp.applicant_exam_attendance a ON a.applicant_id = s.applicant_id
                JOIN pp.jurisdiction j ON ap.district = j.juris_code
                WHERE ap.nmms_year = $1
                GROUP BY ap.district, j.juris_name
                ORDER BY j.juris_name;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        } else {
            const query = `
                SELECT
                    d.juris_name AS district_name,
                    b.juris_name AS label,
                    /* Called students */
                    COUNT(DISTINCT s.applicant_id) AS called_count,
                    /* Appeared students */
                    COUNT(DISTINCT CASE
                        WHEN a.pp_exam_appeared_yn = 'Y'
                        THEN s.applicant_id
                    END) AS appeared_count,
                    /* Turn-out percentage */
                    ROUND(
                        COUNT(DISTINCT CASE
                            WHEN a.pp_exam_appeared_yn = 'Y'
                            THEN s.applicant_id
                        END) * 100.0
                        / NULLIF(COUNT(DISTINCT s.applicant_id), 0),
                        2
                    ) AS turnout_percentage
                FROM pp.applicant_shortlist_info s
                JOIN pp.applicant_primary_info ap ON ap.applicant_id = s.applicant_id
                LEFT JOIN pp.applicant_exam_attendance a ON a.applicant_id = s.applicant_id
                JOIN pp.jurisdiction d ON ap.district = d.juris_code
                JOIN pp.jurisdiction b ON ap.nmms_block = b.juris_code
                WHERE ap.nmms_year = $1
                GROUP BY ap.district, ap.nmms_block, d.juris_name, b.juris_name
                ORDER BY d.juris_name, b.juris_name;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        }
    },
    getSelectionReport: async (year, type) => {
        if (type === 'district') {
            const query = `
                SELECT j.juris_name AS label,
                    COUNT(DISTINCT a.applicant_id) AS appeared_count,
                    COUNT(DISTINCT sm.applicant_id) AS selected_count,
                    ROUND(COUNT(DISTINCT sm.applicant_id) * 100.0 / NULLIF(COUNT(DISTINCT a.applicant_id), 0), 2) AS selection_percentage
                FROM pp.applicant_exam_attendance a
                JOIN pp.applicant_primary_info ap ON ap.applicant_id = a.applicant_id
                JOIN pp.jurisdiction j ON ap.district = j.juris_code
                LEFT JOIN pp.student_master sm ON sm.applicant_id = a.applicant_id
                WHERE a.pp_exam_appeared_yn = 'Y' AND ap.nmms_year = $1
                GROUP BY ap.district, j.juris_name ORDER BY j.juris_name;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        } else {
            const query = `
                SELECT d.juris_name AS district_name, b.juris_name AS label,
                    COUNT(DISTINCT a.applicant_id) AS appeared_count,
                    COUNT(DISTINCT sm.applicant_id) AS selected_count,
                    ROUND(COUNT(DISTINCT sm.applicant_id) * 100.0 / NULLIF(COUNT(DISTINCT a.applicant_id), 0), 2) AS selection_percentage
                FROM pp.applicant_exam_attendance a
                JOIN pp.applicant_primary_info ap ON ap.applicant_id = a.applicant_id
                JOIN pp.jurisdiction d ON ap.district = d.juris_code
                JOIN pp.jurisdiction b ON ap.nmms_block = b.juris_code
                LEFT JOIN pp.student_master sm ON sm.applicant_id = a.applicant_id
                WHERE a.pp_exam_appeared_yn = 'Y' AND ap.nmms_year = $1
                GROUP BY ap.district, ap.nmms_block, d.juris_name, b.juris_name
                ORDER BY d.juris_name, b.juris_name;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        }
    },
    getSelectsReport: async (year, type) => {
        if (type === 'district') {
            const query = `
                SELECT 
                    d.juris_name AS label,
                    ap.gender,
                    /* Use LEFT JOIN and COUNT student_master records to show 0 if none exist */
                    COUNT(sm.applicant_id) AS student_count
                FROM pp.applicant_primary_info ap
                JOIN pp.jurisdiction d ON ap.district = d.juris_code
                LEFT JOIN pp.student_master sm ON sm.applicant_id = ap.applicant_id
                WHERE ap.nmms_year = $1
                GROUP BY ap.district, d.juris_name, ap.gender
                ORDER BY d.juris_name, ap.gender;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        } else {
            const query = `
                SELECT 
                    d.juris_name AS district_name,
                    b.juris_name AS label,
                    ap.gender,
                    /* Use LEFT JOIN and COUNT student_master records to show 0 if none exist */
                    COUNT(sm.applicant_id) AS student_count
                FROM pp.applicant_primary_info ap
                JOIN pp.jurisdiction d ON ap.district = d.juris_code
                JOIN pp.jurisdiction b ON ap.nmms_block = b.juris_code
                LEFT JOIN pp.student_master sm ON sm.applicant_id = ap.applicant_id
                WHERE ap.nmms_year = $1
                GROUP BY ap.district, d.juris_name, ap.nmms_block, b.juris_name, ap.gender
                ORDER BY d.juris_name, b.juris_name, ap.gender;`;
            const { rows } = await pool.query(query, [year]);
            return rows;
        }
    },
    getCohorts: async () => {
        const query = `SELECT cohort_name FROM pp.cohort ORDER BY cohort_number ASC;`;
        const { rows } = await pool.query(query);
        return rows;
    },

    // Fetch Sammelan details based on cohort and date range
   getSammelanData: async (cohort, fromDate, toDate) => {
    const query = `
        SELECT
            c.cohort_name,
            em.event_title AS label,
            d.juris_name AS district_name,
            b.juris_name AS block_name,
            em.event_location,
            em.event_start_date AS from_date,
            em.event_end_date AS to_date,
            COALESCE(em.boys_attended, 0) AS boys_sel,
            COALESCE(em.girls_attended, 0) AS girls_sel
        FROM pp.cohort c
        JOIN pp.event_master em ON em.cohort_number = c.cohort_number
        JOIN pp.event_type et ON et.event_type_id = em.event_type_id
        LEFT JOIN pp.jurisdiction d ON em.event_district = d.juris_code
        LEFT JOIN pp.jurisdiction b ON em.event_block = b.juris_code
        WHERE et.event_type_name = 'Sammelan'
            AND em.event_start_date <= $2
            AND em.event_end_date >= $3
            AND c.cohort_name = $1
        ORDER BY em.event_start_date;`;
    
    // Note: $2 is toDate, $3 is fromDate to match your logic
    const { rows } = await pool.query(query, [cohort, toDate, fromDate]);
    return rows;
}
   
  
};

module.exports = SelectionReportsModel;