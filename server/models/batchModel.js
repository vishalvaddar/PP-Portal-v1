const pool = require("../config/db");

const COHORT_START_YEAR = 2021;

// ======================================================
// 1. Get Coordinators
// ======================================================
exports.fetchCoordinator = async () => {
  return await pool.query(
    `SELECT role_id FROM pp.role WHERE role_name = 'BATCH COORDINATOR'`
  );
};

exports.fetchCoordinatorsByRole = async (roleId) => {
  return await pool.query(
    `SELECT u.user_id AS id, u.user_name AS name
     FROM pp.user u
     JOIN pp.user_role ur ON u.user_id = ur.user_id
     WHERE ur.role_id = $1`,
    [roleId]
  );
};

// ======================================================
// 2. Create Batch
// ======================================================
exports.checkBatchExists = async (batch_name, cohort_number) => {
  return await pool.query(
    `SELECT 1 FROM pp.batch WHERE batch_name = $1 AND cohort_number = $2`,
    [batch_name, cohort_number]
  );
};

exports.insertBatch = async (batch_name, cohort_number) => {
  return await pool.query(
    `INSERT INTO pp.batch (batch_name, cohort_number)
     VALUES ($1, $2)
     RETURNING *`,
    [batch_name, cohort_number]
  );
};

exports.assignCoordinatorToBatch = async (coordinator_id, batchId) => {
  return await pool.query(
    `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [coordinator_id, batchId]
  );
};

// ======================================================
// 3. Get All Batches
// ======================================================
exports.fetchAllBatches = async () => {
  return await pool.query(`
    SELECT 
      b.batch_id AS id, 
      b.batch_name, 
      b.cohort_number, 
      c.cohort_name, 
      u.user_name AS coordinator_name, 
      u.user_id AS coordinator_id 
    FROM pp.batch b 
    LEFT JOIN pp.cohort c ON b.cohort_number = c.cohort_number 
    LEFT JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id 
    LEFT JOIN pp.user u ON bcb.user_id = u.user_id 
    WHERE EXISTS (
      SELECT 1 
      FROM pp.system_config sc 
      WHERE sc.is_active = 'true'
      AND c.cohort_number = (CAST(SUBSTRING(sc.academic_year FROM 1 FOR 4) AS INTEGER) - ${COHORT_START_YEAR})
    )
    ORDER BY b.batch_id DESC
  `);
};

// ======================================================
// 4. Get Batch By ID
// ======================================================
exports.fetchBatchById = async (batchId) => {
  return await pool.query(
    `SELECT 
        b.batch_id, 
        b.batch_name,
        c.cohort_name
     FROM pp.batch b
     LEFT JOIN pp.cohort c ON b.cohort_number = c.cohort_number
     WHERE b.batch_id = $1`,
    [batchId]
  );
};

// ======================================================
// 5. Update Batch
// ======================================================
exports.checkDuplicateBatchForUpdate = async (batch_name, cohort_number, batchId) => {
  return await pool.query(
    `SELECT 1 FROM pp.batch
     WHERE batch_name = $1 AND cohort_number = $2 AND batch_id != $3`,
    [batch_name, cohort_number, batchId]
  );
};

exports.updateBatchDetails = async (batch_name, cohort_number, batchId) => {
  return await pool.query(
    `UPDATE pp.batch
     SET batch_name = $1, cohort_number = $2
     WHERE batch_id = $3
     RETURNING *`,
    [batch_name, cohort_number, batchId]
  );
};

exports.deleteBatchCoordinators = async (batchId) => {
  return await pool.query(
    `DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`,
    [batchId]
  );
};

// ======================================================
// 6. Delete Batch
// ======================================================
exports.deleteBatchById = async (batchId) => {
  return await pool.query(
    `DELETE FROM pp.batch WHERE batch_id = $1 RETURNING *`,
    [batchId]
  );
};

// ======================================================
// 7. Get Batch Names
// ======================================================
exports.fetchBatchNames = async () => {
  return await pool.query(
    `SELECT batch_name FROM pp.batch ORDER BY batch_name ASC`
  );
};

// ======================================================
// 8. Add Batch Name
// ======================================================
exports.insertBatchName = async (batch_name, cohort_number, created_by) => {
  return await pool.query(
    `INSERT INTO pp.batch (batch_name, cohort_number, created_by, updated_by)
     VALUES ($1, $2, $3, $3)
     ON CONFLICT (cohort_number, batch_name) DO NOTHING
     RETURNING *`,
    [batch_name, cohort_number, created_by]
  );
};

// ======================================================
// 9. Get All Cohorts
// ======================================================
exports.fetchAllCohorts = async () => {
  return await pool.query(`
    SELECT cohort_number, cohort_name, start_date, description 
    FROM pp.cohort 
    ORDER BY cohort_number ASC
  `);
};

// ======================================================
// 10. Create Cohort
// ======================================================
exports.checkCohortNameExists = async (cohort_name) => {
  return await pool.query(
    `SELECT 1 FROM pp.cohort WHERE cohort_name = $1`,
    [cohort_name]
  );
};

exports.checkCohortYearExists = async (cohort_number) => {
  return await pool.query(
    `SELECT 1 FROM pp.cohort WHERE cohort_number = $1`,
    [cohort_number]
  );
};

exports.insertCohort = async (cohort_number, cohort_name, start_date, description) => {
  return await pool.query(
    `INSERT INTO pp.cohort (cohort_number, cohort_name, start_date, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [cohort_number, cohort_name, start_date, description]
  );
};

// ======================================================
// 11. Update Cohort
// ======================================================
exports.checkCohortDuplicateForUpdate = async (cohort_name, id) => {
  return await pool.query(
    `SELECT 1 FROM pp.cohort WHERE cohort_name = $1 AND cohort_number != $2`,
    [cohort_name, id]
  );
};

exports.updateCohortDetails = async (cohort_name, start_date, description, id) => {
  return await pool.query(
    `UPDATE pp.cohort
     SET cohort_name = $1, start_date = $2, description = $3
     WHERE cohort_number = $4
     RETURNING *`,
    [cohort_name, start_date, description, id]
  );
};

// ======================================================
// 12. Get Students in Batch
// ======================================================
exports.fetchStudentsInBatch = async (batchId) => {
  return await pool.query(
    `SELECT 
       sm.student_id, sm.enr_id, sm.student_name, sm.student_email, 
       sm.contact_no1, sm.active_yn, api.nmms_reg_number
     FROM pp.student_master sm
     JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
     WHERE sm.batch_id = $1
     ORDER BY sm.student_name`,
    [batchId]
  );
};

// ======================================================
// 13. Get Active Cohorts
// ======================================================
exports.fetchActiveCohorts = async () => {
  return await pool.query(`
    SELECT *
    FROM pp.cohort
    WHERE end_date IS NULL
  `);
};

// ======================================================
// 14. Get Batches by Cohort
// ======================================================
exports.fetchBatchesByCohortNumber = async (cohort_number) => {
  return await pool.query(
    `SELECT * FROM pp.batch WHERE cohort_number = $1`,
    [cohort_number]
  );
};

// ======================================================
// 15. Get Student Info from Batch
// ======================================================
exports.fetchStudentInfoByEnrId = async (enr_id) => {
  return await pool.query(
    `SELECT 
       sm.enr_id,
       api.nmms_reg_number,
       api.nmms_year,
       api.student_name,
       api.father_name,
       api.mother_name,
       api.gender,
       api.aadhaar,
       api.dob,
       api.medium,
       api.home_address,
       api.family_income_total,
       api.contact_no1,
       api.contact_no2,
       api.current_institute_dise_code,
       api.previous_institute_dise_code,
       asi.village,
       asi.father_occupation,
       asi.mother_occupation,
       asi.father_education,
       asi.mother_education,
       asi.household_size,
       asi.own_house,
       asi.smart_phone_home,
       asi.internet_facility_home,
       asi.career_goals,
       asi.subjects_of_interest,
       asi.transportation_mode,
       asi.distance_to_school,
       asi.num_two_wheelers,
       asi.num_four_wheelers,
       asi.irrigation_land,
       asi.neighbor_name,
       asi.neighbor_phone,
       asi.favorite_teacher_name,
       asi.favorite_teacher_phone
     FROM pp.student_master sm
     JOIN pp.applicant_primary_info api USING (applicant_id)
     JOIN pp.applicant_secondary_info asi USING (applicant_id)
     WHERE sm.enr_id = $1`,
    [enr_id]
  );
};

// ======================================================
// 16. Get Students NOT Assigned to Any Batch
// ======================================================
exports.fetchStudentsNotInAnyBatch = async () => {
  return await pool.query(
    `SELECT 
       sm.student_id, 
       sm.enr_id, 
       sm.student_name, 
       sm.student_email,
       sm.contact_no1
     FROM pp.student_master sm
     WHERE sm.batch_id IS NULL
       AND sm.active_yn = 'ACTIVE'
     ORDER BY sm.student_name`
  );
};

exports.updateStudentBatchId = async (batchId, student_ids) => {
  const cleanBatchId = Number(batchId);
  const cleanStudentIds = student_ids.map(id => Number(id));

  return await pool.query(
    `UPDATE pp.student_master
     SET batch_id = $1
     WHERE student_id = ANY($2::bigint[])`,
    [cleanBatchId, cleanStudentIds]
  );
};

exports.removeStudentBatchId = async (student_ids) => {
  const cleanStudentIds = student_ids.map(id => Number(id));

  return await pool.query(
    `UPDATE pp.student_master
     SET batch_id = NULL
     WHERE student_id = ANY($1::bigint[])`,
    [cleanStudentIds]
  );
};
