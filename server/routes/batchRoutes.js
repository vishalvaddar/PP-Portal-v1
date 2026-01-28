const express = require("express");
const router = express.Router();
const batchController = require("../controllers/batchController");

// Coordinators
router.get("/coordinators", batchController.getCoordinators);

// Batch Names
router.get("/names", batchController.getBatchNames);
router.post("/names", batchController.addBatchName);

// Cohorts
router.get("/cohorts", batchController.getAllCohorts);
router.post("/cohorts", batchController.createCohort);
router.get("/cohorts/active", batchController.getActiveCohorts);

//  Unassigned students (modal data)
router.get("/students/unassigned", batchController.getStudentsNotInAnyBatch);

router.post("/:batchId/add-students", batchController.addStudentsToBatch);

//  Remove students from batch
router.post("/students/remove", batchController.removeStudentsFromBatch);

// Student Info
router.get("/students/:enr_id", batchController.getStudentsInfoFromBatch);

// Batches by Cohort
router.get("/:cohort_number/batches", batchController.getBatchesByCohort);

// All Batches
router.get("/", batchController.getAllBatches);
router.post("/", batchController.createBatch);

// Single Batch CRUD
router.get("/:batchId", batchController.getBatchById);
router.put("/:batchId", batchController.updateBatch);
router.delete("/:batchId", batchController.deleteBatch);

// Students in batch
router.get("/:batchId/students", batchController.getStudentsInBatch);

module.exports = router;
