const express = require("express");
const router = express.Router();
const { viewApplicants, viewApplicantByRegNumber } = require("../controllers/applicantViewController");

// Fetch all applicants
router.get("/", viewApplicants);

// Fetch a single applicant by nmms_reg_number
router.get("/:nmms_reg_number", viewApplicantByRegNumber)

module.exports = router;
