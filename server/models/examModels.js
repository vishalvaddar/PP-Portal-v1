const pool = require("../config/db");

// Exam Centre Models
async function getExamCentres() {
    const result = await pool.query(
        `SELECT pp_exam_centre_id, pp_exam_centre_name
        FROM pp.pp_exam_centre
        ORDER BY pp_exam_centre_name ASC`
    );
    return result.rows;
}

async function addExamCentre(pp_exam_centre_name) {
    const result = await pool.query(
        "INSERT INTO pp.pp_exam_centre (pp_exam_centre_name) VALUES ($1) RETURNING *",
        [pp_exam_centre_name]
    );
    return result.rows[0];
}

async function deleteExamCentre(id) {
    await pool.query("DELETE FROM pp.pp_exam_centre WHERE pp_exam_centre_id = $1", [id]);
}

// Location Models
async function getStates() {
    const result = await pool.query(`
        SELECT JURIS_CODE AS id, JURIS_NAME AS name
        FROM PP.JURISDICTION 
        WHERE JURIS_TYPE = 'STATE' AND PARENT_JURIS IS NULL
    `);
    return result.rows;
}

async function getDistrictsByState(stateId) {
    const result = await pool.query(`
        SELECT JURIS_CODE AS id, JURIS_NAME AS name 
        FROM PP.JURISDICTION 
        WHERE JURIS_TYPE = 'EDUCATION DISTRICT' 
        AND PARENT_JURIS = $1
    `, [stateId]);
    return result.rows;
}

async function getBlocksByDistrict(districtId) {
    const result = await pool.query(`
        SELECT JURIS_CODE AS id, JURIS_NAME AS name 
        FROM PP.JURISDICTION 
        WHERE JURIS_TYPE = 'BLOCK' 
        AND PARENT_JURIS = $1
    `, [districtId]);
    return result.rows;
}

async function getUsedBlocks(blockId) {
    let result;
    if (blockId) {
        result = await pool.query(`
            SELECT DISTINCT api.nmms_block
            FROM pp.applicant_primary_info api
            INNER JOIN pp.applicant_exam ae ON api.applicant_id = ae.applicant_id
            WHERE api.nmms_block = $1
        `, [blockId]);
    } else {
        result = await pool.query(`
            SELECT DISTINCT api.nmms_block
            FROM pp.applicant_primary_info api
            INNER JOIN pp.applicant_exam ae ON api.applicant_id = ae.applicant_id
        `);
    }
    return result.rows.map(row => Number(row.nmms_block));
}

// Exam Models
async function getAllExams() {
    const result = await pool.query(`
        SELECT 
            e.exam_id,
            e.exam_name,
            e.exam_date,
            e.frozen_yn,
            e.pp_exam_centre_id,
            c.pp_exam_centre_name,
            ARRAY_AGG(DISTINCT jd.juris_code) AS district_ids,
            ARRAY_AGG(DISTINCT jd.juris_name) AS district_names,
            ARRAY_AGG(DISTINCT jb.juris_code) AS block_ids,
            ARRAY_AGG(DISTINCT jb.juris_name) AS block_names
        FROM pp.examination e
        LEFT JOIN pp.pp_exam_centre c 
            ON e.pp_exam_centre_id = c.pp_exam_centre_id
        JOIN pp.applicant_exam ae 
            ON ae.exam_id = e.exam_id
        JOIN pp.applicant_primary_info api 
            ON ae.applicant_id = api.applicant_id
        LEFT JOIN pp.jurisdiction jd 
            ON api.district = jd.juris_code
        LEFT JOIN pp.jurisdiction jb 
            ON api.nmms_block = jb.juris_code
        GROUP BY 
            e.exam_id, e.exam_name, e.exam_date, 
            e.pp_exam_centre_id, c.pp_exam_centre_name
        ORDER BY e.exam_date DESC
    `);
    return result.rows;
}

async function deleteExamById(examId) {
    await pool.query("BEGIN");
    await pool.query("DELETE FROM pp.applicant_exam WHERE exam_id = $1", [examId]);
    await pool.query("DELETE FROM pp.examination WHERE exam_id = $1", [examId]);
    await pool.query("COMMIT");
}

module.exports = {
    getExamCentres,
    addExamCentre,
    deleteExamCentre,
    getStates,
    getDistrictsByState,
    getBlocksByDistrict,
    getUsedBlocks,
    getAllExams,
    deleteExamById
};