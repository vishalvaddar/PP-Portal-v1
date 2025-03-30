const express = require("express");
const router = express.Router();
const { createApplicant } = require("../controllers/applicantController");


// ✅ Route for creating an applicant
router.post("/", createApplicant);

module.exports = router;
