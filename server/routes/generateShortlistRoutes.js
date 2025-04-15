const express = require("express");
const router = express.Router();
const generateShortlistController = require("../controllers/generateShortlistController");

router.get("/allstates", generateShortlistController.getStates);
router.get("/districts/:stateName", generateShortlistController.getDistricts);
router.get("/blocks/:districtName", generateShortlistController.getBlocks);
router.get("/criteria", generateShortlistController.getCriteria);
router.post("/start-shortlist", generateShortlistController.startShortlisting);

module.exports = router;