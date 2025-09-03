const express = require("express");
const router = express.Router();
const batchCreateController = require("../controllers/batchCreateController");

// 🔹 Specific GET routes (keep first)
router.get("/coordinators", batchCreateController.getCoordinators);
router.get("/names", batchCreateController.getBatchNames);
router.post("/names", batchCreateController.addBatchName);

// 🔹 Cohort Routes
router.get("/cohorts", batchCreateController.getAllCohorts);
router.post("/cohorts", batchCreateController.createCohort);
router.get("/cohorts/active", batchCreateController.getActiveCohorts);

// 🔹 Batch CRUD routes
// --- (FIXED) Standardized on /:batchId to match the controller ---
router.get("/", batchCreateController.getAllBatches);
router.get("/:batchId", batchCreateController.getBatchById); 
router.post("/", batchCreateController.createBatch);
router.put("/:batchId", batchCreateController.updateBatch);
router.delete("/:batchId", batchCreateController.deleteBatch);

// 🔹 Students in batch (dynamic - keep last)
// --- (FIXED) Standardized on /:batchId to match the controller ---
// router.get("/:batchId/students", batchCreateController.getStudentsInBatch);
router.get("/:id/students", batchCreateController.getStudentsInBatch);


module.exports = router;

