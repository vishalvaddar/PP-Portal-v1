const pool = require('../config/db');

// 1. Get All Lists (Matches: loadLists)
exports.getAllLists = async () => {
    const query = `
        SELECT 
            cln.id,
            cln.list_name,
            COUNT(clm.student_id) AS student_count
        FROM pp.custom_list_names cln
        LEFT JOIN pp.custom_list_master clm ON cln.id = clm.list_id
        GROUP BY cln.id, cln.list_name
        ORDER BY cln.id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

// 2. Get Students by Cohort (Matches: loadCohortStudents)
// Note: This joins student_master with batch to filter by cohort_number
exports.getStudentsByCohort = async (cohortId) => {
    const query = `
        SELECT sm.student_id, sm.student_name
        FROM pp.student_master sm
        JOIN pp.batch b ON sm.batch_id = b.batch_id
        WHERE b.cohort_number = $1
        ORDER BY sm.student_name;
    `;
    const { rows } = await pool.query(query, [cohortId]);
    return rows;
};

// 3. Create List AND Add Students (Transactional) 
// (Matches: createList frontend function)
exports.createListWithStudents = async (listName, studentIds) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Step A: Insert List Name
        const listQuery = `
            INSERT INTO pp.custom_list_names (list_name)
            VALUES ($1)
            RETURNING id;
        `;
        const listRes = await client.query(listQuery, [listName]);
        const newListId = listRes.rows[0].id;

        // Step B: Insert Students into Mapping Table
        if (studentIds && studentIds.length > 0) {
            const mapQuery = `
                INSERT INTO pp.custom_list_master (list_id, student_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING;
            `;
            
            // Loop through ids and insert
            // (For very large lists, a bulk insert is better, but this is safe for <1000 items)
            for (const sId of studentIds) {
                await client.query(mapQuery, [newListId, sId]);
            }
        }

        await client.query('COMMIT');
        return { success: true, id: newListId };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// 4. Update List Name (Matches: saveEdit)
exports.updateListName = async (id, listName) => {
    const query = `
        UPDATE pp.custom_list_names
        SET list_name = $1
        WHERE id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [listName, id]);
    return rows[0];
};

// 5. Delete List (Matches: deleteList)
exports.deleteList = async (listId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Step A: Delete mappings from custom_list_master first
        await client.query('DELETE FROM pp.custom_list_master WHERE list_id = $1', [listId]);
        
        // Step B: Delete the list name from custom_list_names
        await client.query('DELETE FROM pp.custom_list_names WHERE id = $1', [listId]);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// 6. Get Students inside a Specific List (Matches: viewListStudents)
exports.getStudentsByListId = async (listId) => {
    const query = `
        SELECT sm.student_id, sm.student_name, sm.gender, b.batch_name, sm.contact_no1, sm.contact_no2
        FROM pp.custom_list_master clm
        LEFT JOIN pp.student_master sm 
            ON clm.student_id = sm.student_id
        LEFT JOIN pp.batch b
            ON b.batch_id = sm.batch_id
        LEFT JOIN pp.applicant_primary_info api
            ON api.applicant_id = sm.applicant_id
        WHERE clm.list_id = $1
        ORDER BY sm.student_name;
    `;
    const { rows } = await pool.query(query, [listId]);
    return rows;
};

exports.addStudentsToList = async (listId, studentIds) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertQuery = `
            INSERT INTO pp.custom_list_master (list_id, student_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
        `;
        for (const sId of studentIds) {
            await client.query(insertQuery, [listId, sId]);
        }
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

exports.removeStudentFromList = async (listId, studentId) => {
    const query = `
        DELETE FROM pp.custom_list_master 
        WHERE list_id = $1 AND student_id = $2
    `;
    await pool.query(query, [listId, studentId]);
    return true;
};