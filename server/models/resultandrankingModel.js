const pool = require("../config/db");

// Location Models
async function getDivisionsByState(stateId) {
  const result = await pool.query(`
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'DIVISION'
      AND PARENT_JURIS = $1
    ORDER BY JURIS_NAME
  `, [stateId]);
  return result.rows;
}

// 2️⃣ Education Districts by Division
async function getEducationDistrictsByDivision(divisionId) {
  const result = await pool.query(`
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'EDUCATION DISTRICT'
      AND PARENT_JURIS = $1
    ORDER BY JURIS_NAME
  `, [divisionId]);
  return result.rows;
}

// 3️⃣ Blocks by Education District
async function getBlocksByDistrict(districtId) {
  const result = await pool.query(`
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'BLOCK'
      AND PARENT_JURIS = $1
    ORDER BY JURIS_NAME
  `, [districtId]);
  return result.rows;
}


module.export ={
    getBlocksByDistrict,
    getEducationDistrictsByDivision,
    getDivisionsByState
}