const express = require("express");
const router = express.Router();

const {fetchStates,fetchDistrictsByState,fetchBlocksByDistrict} =require('../controllers/resultandrankingController')


router.get("/states", fetchStates);
router.get("/districts-by-state/:stateId", fetchDistrictsByState);
router.get("/blocks-by-district/:districtId", fetchBlocksByDistrict);

module.exports = router;