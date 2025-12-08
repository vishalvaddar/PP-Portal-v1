const pool = require("../config/db");

// Fetch all States
async function getStates() {
  const query = `
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'STATE' AND PARENT_JURIS IS NULL
  `;
  const result = await pool.query(query);
  return result.rows;
}

// Fetch Divisions by State
async function getDivisionsByState(stateId) {
  const query = `
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'DIVISION'
    AND PARENT_JURIS = $1
  `;
  const result = await pool.query(query, [stateId]);
  return result.rows;
}

// Fetch Districts by Division
async function getDistrictsByDivision(divisionId) {
  const query = `
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'EDUCATION DISTRICT'
    AND PARENT_JURIS = $1
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

// Fetch Blocks by District
async function getBlocksByDistrict(districtId) {
  const query = `
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'BLOCK'
    AND PARENT_JURIS = $1
  `;
  const result = await pool.query(query, [districtId]);
  return result.rows;
}

//Fetch Clusters by block
async function getClustersByBlock(blockId) {
  const query = `
    SELECT JURIS_CODE AS id, JURIS_NAME AS name
    FROM PP.JURISDICTION
    WHERE JURIS_TYPE = 'CLUSTER'
    AND PARENT_JURIS = $1
  `;
  const result = await pool.query(query, [blockId]);
  return result.rows;
}
// Fetch Institutes by Cluster
async function getInstitutesByCluster(clusterId) {
  const query = `
    SELECT institute_id, institute_name, dise_code
    FROM PP.INSTITUTE
    WHERE juris_code = $1
  `;
  const result = await pool.query(query, [clusterId]);
  return result.rows;
}

module.exports = {
  getStates,
  getDivisionsByState,
  getDistrictsByDivision,
  getBlocksByDistrict,
  getClustersByBlock,
  getInstitutesByCluster,
};
