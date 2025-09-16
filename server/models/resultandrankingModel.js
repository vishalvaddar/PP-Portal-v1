const pool = require("../config/db");


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


module.export ={
    getBlocksByDistrict,
    getDistrictsByState,
    getStates
}