const express = require("express");
const router = express.Router();
const SearchController = require("../controllers/searchController");

// Define routes and map to controller methods
router.get("/search", SearchController.search);
router.get("/cohorts", SearchController.getCohorts);
router.get("/batches/cohort/:cohortNumber", SearchController.getBatches);

module.exports = router;