const express = require("express");
const router = express.Router();
const generateShortlistController = require("../controllers/generateShortlistController");

router.get("/allstates", generateShortlistController.getStates);

// 💡 NEW ROUTE: Fetch divisions by state
router.get("/divisions/:stateName", generateShortlistController.getDivisions);

// 💡 MODIFIED ROUTE: Fetch districts by division name
router.get("/districts/:divisionName", generateShortlistController.getDistricts);

// 💡 MODIFIED ROUTE: Fetch blocks by State, Division, AND District
router.get("/blocks/:stateName/:divisionName/:districtName", generateShortlistController.getBlocks);

router.get("/criteria", generateShortlistController.getCriteria);
router.post("/start-shortlist", generateShortlistController.startShortlisting);

module.exports = router;