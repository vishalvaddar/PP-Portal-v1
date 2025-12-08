const express = require("express");
const router = express.Router();
const jurisdictionController = require("../controllers/jurisdictionController");

// Routes
router.get("/states", jurisdictionController.getStates);
router.get("/divisions-by-state/:stateId", jurisdictionController.getDivisionsByState);
router.get("/districts-by-division/:divisionId", jurisdictionController.getDistrictsByDivision);
router.get("/blocks-by-district/:districtId", jurisdictionController.getBlocksByDistrict);
router.get("/clusters-by-block/:blockId", jurisdictionController.getClustersByBlock);
router.get("/institutes-by-cluster/:clusterId", jurisdictionController.getInstitutesByCluster);


module.exports = router;
