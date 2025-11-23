const express = require("express");
const router = express.Router();

const {fetchDivisionsByState,fetchEducationDistrictsByDivision,fetchBlocksByDistrict,searchResults,downloadtheresult } =require('../controllers/resultandrankingController')

router.get("/divisions-by-state/:stateId", fetchDivisionsByState);
router.get("/education-districts-by-division/:divisionId", fetchEducationDistrictsByDivision);
router.get("/blocks-by-district/:districtId", fetchBlocksByDistrict);
router.post("/search", searchResults);
router.post("/download-results", downloadtheresult);





module.exports = router;