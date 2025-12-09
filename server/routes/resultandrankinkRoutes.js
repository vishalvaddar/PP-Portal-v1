const express = require("express");
const router = express.Router();

const {
  fetchDivisionsByState,
  fetchEducationDistrictsByDivision,
  fetchBlocksByDistrict,
  fetchAllExams,
  searchByBlocks,
  searchByExam,
  downloadByBlocks,
    getFilterOptions,
  downloadByExam
} = require('../controllers/resultandrankingController');

router.get("/divisions-by-state/:stateId", fetchDivisionsByState);
router.get("/education-districts-by-division/:divisionId", fetchEducationDistrictsByDivision);
router.get("/blocks-by-district/:districtId", fetchBlocksByDistrict);
router.get("/all-exams", fetchAllExams);
router.post("/search-by-blocks", searchByBlocks);
router.post("/search-by-exam", searchByExam);
router.post("/download-by-blocks", downloadByBlocks);
router.post("/download-by-exam", downloadByExam);
router.get("/filter-options/:field", getFilterOptions);

module.exports = router;