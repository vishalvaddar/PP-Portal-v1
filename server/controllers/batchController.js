const BatchModel = require("../models/batchModel"); // Adjust path as needed

const COHORT_START_YEAR = 2021;

// ======================================================
// 1. Get Coordinators
// ======================================================
exports.getCoordinators = async (req, res) => {
  try {
    const roleRes = await BatchModel.fetchCoordinator();

    if (roleRes.rows.length === 0)
      return res.status(404).json({ error: "Coordinator role not found" });

    const roleId = roleRes.rows[0].role_id;

    const result = await BatchModel.fetchCoordinatorsByRole(roleId);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching coordinators:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 2. Create Batch
// ======================================================
exports.createBatch = async (req, res) => {
  try {
    const { batch_name, cohort_number, coordinator_id = null } = req.body;

    if (!batch_name || cohort_number == null)
      return res.status(400).json({ error: "batch_name and cohort_number are required" });

    const existing = await BatchModel.checkBatchExists(batch_name.trim(), cohort_number);

    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Batch already exists for this cohort." });

    const result = await BatchModel.insertBatch(batch_name.trim(), cohort_number);

    const batchId = result.rows[0].batch_id;

    if (coordinator_id) {
      await BatchModel.assignCoordinatorToBatch(coordinator_id, batchId);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 3. Get All Batches
// ======================================================
exports.getAllBatches = async (req, res) => {
  try {
    const result = await BatchModel.fetchAllBatches();
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 4. Get Batch By ID
// ======================================================
exports.getBatchById = async (req, res) => {
  const { batchId } = req.params;
  try {
    const result = await BatchModel.fetchBatchById(batchId);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Batch not found." });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching batch by ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 5. Update Batch
// ======================================================
exports.updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { batch_name, cohort_number, coordinator_id } = req.body;

    if (!batch_name || cohort_number == null)
      return res.status(400).json({ error: "Missing required fields" });

    const duplicate = await BatchModel.checkDuplicateBatchForUpdate(batch_name.trim(), cohort_number, batchId);

    if (duplicate.rows.length > 0)
      return res.status(409).json({ error: "Duplicate batch name in cohort." });

    const result = await BatchModel.updateBatchDetails(batch_name.trim(), cohort_number, batchId);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Batch not found" });

    await BatchModel.deleteBatchCoordinators(batchId);

    if (coordinator_id) {
      await BatchModel.assignCoordinatorToBatch(coordinator_id, batchId);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 6. Delete Batch
// ======================================================
exports.deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    await BatchModel.deleteBatchCoordinators(batchId);

    const result = await BatchModel.deleteBatchById(batchId);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Batch not found" });

    res.json({ message: "Batch deleted successfully", deleted: result.rows[0] });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 7. Get Batch Names
// ======================================================
exports.getBatchNames = async (req, res) => {
  try {
    const result = await BatchModel.fetchBatchNames();
    res.json(
      result.rows.map((row) => ({ label: row.batch_name, value: row.batch_name }))
    );
  } catch (err) {
    console.error("Error fetching batch names:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 8. Add Batch Name
// ======================================================
exports.addBatchName = async (req, res) => {
  const { batch_name, cohort_number, created_by } = req.body;

  if (!batch_name?.trim())
    return res.status(400).json({ error: "Batch name is required" });
  if (!cohort_number)
    return res.status(400).json({ error: "Cohort number is required" });
  if (!created_by)
    return res.status(400).json({ error: "Created by (user ID) is required" });

  try {
    const result = await BatchModel.insertBatchName(batch_name.trim(), cohort_number, created_by);

    if (result.rows.length === 0)
      return res.status(200).json({ message: "Batch name already exists for this cohort" });

    res.status(201).json({
      message: "Batch created successfully",
      batch: result.rows[0],
    });
  } catch (err) {
    console.error("Error saving batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 9. Get All Cohorts
// ======================================================
exports.getAllCohorts = async (req, res) => {
  try {
    const result = await BatchModel.fetchAllCohorts();
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching cohorts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 10. Create Cohort
// ======================================================
exports.createCohort = async (req, res) => {
  const { cohort_name, start_date, description } = req.body;

  if (!cohort_name || !start_date)
    return res.status(400).json({ error: "cohort_name and start_date are required" });

  try {
    const existing = await BatchModel.checkCohortNameExists(cohort_name.trim());
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Cohort name already exists" });

    const year = new Date(start_date).getFullYear();
    if (isNaN(year))
      return res.status(400).json({ error: "Invalid start_date format" });

    const cohort_number = year - COHORT_START_YEAR;

    const checkYear = await BatchModel.checkCohortYearExists(cohort_number);
    if (checkYear.rows.length > 0)
      return res.status(409).json({ error: `Cohort for year ${year} already exists.` });

    const result = await BatchModel.insertCohort(cohort_number, cohort_name.trim(), start_date, description || null);

    res.status(201).json({
      message: "Cohort created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 11. Update Cohort
// ======================================================
exports.updateCohort = async (req, res) => {
  const { id } = req.params;
  const { cohort_name, start_date, description } = req.body;

  if (!cohort_name || !start_date)
    return res.status(400).json({ error: "cohort_name and start_date are required" });

  try {
    const duplicate = await BatchModel.checkCohortDuplicateForUpdate(cohort_name.trim(), id);

    if (duplicate.rows.length > 0)
      return res.status(409).json({ error: "Cohort name already exists" });

    const result = await BatchModel.updateCohortDetails(cohort_name.trim(), start_date, description || null, id);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Cohort not found" });

    res.json({ message: "Cohort updated successfully", data: result.rows[0] });
  } catch (err) {
    console.error("Error updating cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 12. Get Students in Batch
// ======================================================
exports.getStudentsInBatch = async (req, res) => {
  const { batchId } = req.params;

  try {
    const result = await BatchModel.fetchStudentsInBatch(batchId);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students in batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 13. Get Active Cohorts
// ======================================================
exports.getActiveCohorts = async (req, res) => {
  try {
    const result = await BatchModel.fetchActiveCohorts();
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching active cohorts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 14. Get Batches by Cohort
// ======================================================
exports.getBatchesByCohort = async (req, res) => {
  const { cohort_number } = req.params;
  try {
    const result = await BatchModel.fetchBatchesByCohortNumber(cohort_number);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches by cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 15. Get Student Info from Batch
// ======================================================
exports.getStudentsInfoFromBatch = async (req, res) => {
  try {
    const { enr_id } = req.params;

    const result = await BatchModel.fetchStudentInfoByEnrId(enr_id);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Student not found" });

    res.json({ reg_number: result.rows[0].nmms_reg_number, ...result.rows[0] });
  } catch (err) {
    console.error("Error fetching student info:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 16. Get Students NOT Assigned to Any Batch
// ======================================================
exports.getStudentsNotInAnyBatch = async (req, res) => {
  try {
    const result = await BatchModel.fetchStudentsNotInAnyBatch();
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching unassigned students:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 17. Add Students to Batch (Correct Version)
// ======================================================
exports.addStudentsToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { student_ids } = req.body;

    if (!batchId)
      return res.status(400).json({ error: "batchId is required" });

    if (!Array.isArray(student_ids) || student_ids.length === 0)
      return res
        .status(400)
        .json({ error: "student_ids array is required" });

    const result = await BatchModel.updateStudentBatchId(batchId, student_ids);

    res.json({
      message: "Students successfully assigned to batch",
      count: result.rowCount,
    });
  } catch (err) {
    console.error("Error adding students to batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================================================
// 18. Remove Students from Batch (Correct Version)
// ======================================================
exports.removeStudentsFromBatch = async (req, res) => {
  try {
    const { student_ids } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0)
      return res.status(400).json({ error: "student_ids are required" });

    const result = await BatchModel.removeStudentBatchId(student_ids);

    res.json({
      message: "Students removed from batch successfully",
      count: result.rowCount,
    });
  } catch (err) {
    console.error("Error removing students from batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};