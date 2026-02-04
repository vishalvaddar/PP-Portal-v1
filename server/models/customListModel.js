const pool = require('../config/db');

exports.saveListFull = async (listId, listName, studentIds, selectedFields) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let finalId = (listId === 'undefined' || !listId) ? null : listId;
        if (!finalId) {
            const res = await client.query(`INSERT INTO pp.custom_list (list_name) VALUES ($1) RETURNING list_id`, [listName]);
            finalId = res.rows[0].list_id;
        } else {
            await client.query(`UPDATE pp.custom_list SET list_name = $1 WHERE list_id = $2`, [listName, finalId]);
            await client.query(`DELETE FROM pp.custom_list_fields WHERE list_id = $1`, [finalId]);
            await client.query(`DELETE FROM pp.custom_list_students WHERE list_id = $1`, [finalId]);
        }
        if (selectedFields?.length > 0) {
            for (const f of selectedFields) {
                const exist = await client.query(`SELECT field_id FROM pp.field_master WHERE col_name = $1`, [f.col_name]);
                let fId = exist.rows[0]?.field_id || (await client.query(`INSERT INTO pp.field_master (tab_name, col_name) VALUES ('pp.student_master', $1) RETURNING field_id`, [f.col_name])).rows[0].field_id;
                await client.query(`INSERT INTO pp.custom_list_fields (list_id, field_id) VALUES ($1, $2)`, [finalId, fId]);
            }
        }
        if (studentIds?.length > 0) {
            for (const sId of studentIds) {
                if (sId && sId !== 'undefined') await client.query(`INSERT INTO pp.custom_list_students (list_id, student_id) VALUES ($1, $2)`, [finalId, sId]);
            }
        }
        await client.query('COMMIT');
        return { success: true, list_id: finalId };
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
};

exports.getStudentsByListId = async (listId) => {
    const studentQuery = `
        SELECT 
            sm.*, 
            b.batch_name, 
            inst_curr.institute_name AS current_institute_name,
            inst_prev.institute_name AS previous_institute_name
        FROM pp.custom_list_students cls
        JOIN pp.student_master sm ON cls.student_id = sm.student_id
        LEFT JOIN pp.batch b ON b.batch_id = sm.batch_id
        LEFT JOIN pp.institute inst_curr ON sm.current_institute_dise_code = inst_curr.dise_code
        LEFT JOIN pp.institute inst_prev ON sm.previous_institute_dise_code = inst_prev.dise_code
        WHERE cls.list_id = $1 
        ORDER BY sm.student_name;
    `;

    // Updated this query to include the CASE statement for custom naming
    const fieldsQuery = `
        SELECT 
            fm.col_name, 
            fm.field_id, 
            CASE 
                WHEN fm.col_name = 'batch_id' THEN 'Batch Name'
                WHEN fm.col_name = 'current_institute_dise_code' THEN 'Current School Name'
                WHEN fm.col_name = 'previous_institute_dise_code' THEN 'Previous School Name'
                WHEN fm.col_name = 'active_yn' THEN 'Active Status'
                WHEN fm.col_name = 'contact_no1' THEN 'Contact Number 1'
                WHEN fm.col_name = 'contact_no2' THEN 'Contact Number 2'
                WHEN fm.col_name = 'enr_id' THEN 'Enrollment Id'
                ELSE INITCAP(REPLACE(fm.col_name, '_', ' ')) 
            END as display_name
        FROM pp.custom_list_fields clf
        JOIN pp.field_master fm ON clf.field_id = fm.field_id
        WHERE clf.list_id = $1;
    `;
    const students = await pool.query(studentQuery, [listId]);
    const fields = await pool.query(fieldsQuery, [listId]);
    return { students: students.rows, fields: fields.rows };
};


exports.getStudentsByCohort = async (cohortId, batchId, stateId, divisionId, districtId, blockId) => {
    // Start with the base query including all necessary joins
    let query = `
        SELECT 
            sm.student_id, 
            sm.student_name, 
            b.batch_name,
            api.gender
        FROM pp.student_master sm 
        JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
        LEFT JOIN pp.batch b ON sm.batch_id = b.batch_id 
        WHERE sm.active_yn = 'ACTIVE' 
          AND api.nmms_year = 2025
    `;
    
    const params = [];

    // Helper function to add filters dynamically
    const addFilter = (val, col) => {
        if (val && val !== 'all' && val !== 'null' && val !== 'undefined' && val !== '') {
            params.push(val);
            query += ` AND ${col} = $${params.length}`;
        }
    };

    // Apply any and all filters that are selected
    addFilter(cohortId, 'b.cohort_number');
    addFilter(batchId, 'sm.batch_id');
    addFilter(stateId, 'api.app_state');
    addFilter(districtId, 'api.district');
    addFilter(blockId, 'api.nmms_block');

    query += ` ORDER BY sm.student_name;`;

    // DEBUG LOGS
  //  console.log("--- DYNAMIC FLEXIBLE QUERY ---");
   // console.log("SQL:", query);
   // console.log("Params:", params);

    try {
        const { rows } = await pool.query(query, params);
        console.log(`SUCCESS: Found ${rows.length} students matching ALL filters.`);
        return rows;
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        throw err;
    }
};

exports.getAllLists = async () => { 
    const { rows } = await pool.query(`SELECT cl.list_id, cl.list_name, COUNT(cls.student_id) AS student_count FROM pp.custom_list cl LEFT JOIN pp.custom_list_students cls ON cl.list_id = cls.list_id GROUP BY cl.list_id, cl.list_name ORDER BY cl.list_id DESC;`);
    return rows;
};

exports.getAvailableFields = async () => {
    const query = `
        SELECT 
            column_name as col_name, 
            CASE 
                WHEN column_name = 'batch_id' THEN 'Batch Name'
                WHEN column_name = 'current_institute_dise_code' THEN 'Current School Name'
                WHEN column_name = 'previous_institute_dise_code' THEN 'Previous School Name'
                WHEN column_name = 'active_yn' THEN 'Active Status'
                WHEN column_name = 'contact_no1' THEN 'Contact Number 1'
                WHEN column_name = 'contact_no2' THEN 'Contact Number 2'
                WHEN column_name = 'enr_id' THEN 'Enrollment Id'
                ELSE INITCAP(REPLACE(column_name, '_', ' ')) 
            END as display_name
        FROM information_schema.columns 
        WHERE table_schema = 'pp' 
          AND table_name = 'student_master'
          AND column_name NOT IN (
              'created_at', 
              'updated_at', 
              'created_by', 
              'updated_by', 
              'applicant_id', 
              'photo_link'
          ) 
        ORDER BY display_name ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

exports.getListHeader = async (listId) => {
    const { rows } = await pool.query(`SELECT list_name FROM pp.custom_list WHERE list_id = $1`, [listId]);
    return rows[0];
};

 
exports.getAllBatches = async (cohortId) => {
    let query = `
        SELECT 
            b.batch_id, 
            b.batch_name, 
            c.cohort_name 
        FROM pp.batch b
        JOIN pp.cohort c ON b.cohort_number = c.cohort_number
    `;
    
    const params = [];

    // Force the filter if cohortId exists
    if (cohortId && cohortId !== 'null' && cohortId !== 'undefined') {
        query += ` WHERE b.cohort_number = $1`;
        params.push(cohortId);
    }

    query += ` ORDER BY b.batch_name;`;

    // DEBUG: This will show in your terminal/command prompt
   // console.log("Running Query:", query, "with Params:", params);

    const { rows } = await pool.query(query, params);
    return rows;
};

exports.deleteList = async (id) => { await pool.query(`DELETE FROM pp.custom_list WHERE list_id = $1`, [id]); };