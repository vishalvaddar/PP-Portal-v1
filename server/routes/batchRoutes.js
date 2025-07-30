const express = require("express");
const router = express.Router();
const batchCreateController = require("../controllers/batchCreateController");

// 🔹 Specific GET routes (non-dynamic) - always first
router.get("/coordinators", batchCreateController.getCoordinators);
router.get("/names", batchCreateController.getBatchNames);
router.post("/names", batchCreateController.addBatchName);

// 🔹 Cohort Routes
router.get("/cohorts", batchCreateController.getAllCohorts);
router.post("/cohorts", batchCreateController.createCohort);

// 🔸 Batch CRUD routes
router.get("/", batchCreateController.getAllBatches);
router.post("/", batchCreateController.createBatch);
router.put("/:id", batchCreateController.updateBatch);
router.delete("/:id", batchCreateController.deleteBatch);

router.get("/:id/students", batchCreateController.getStudentsInBatch);

module.exports = router;
