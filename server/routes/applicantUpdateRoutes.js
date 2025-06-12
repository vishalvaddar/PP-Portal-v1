const express = require("express");
const router = express.Router();
const { updateApplicant } = require("../controllers/applicantUpdateController");

//RESTful route to update the info
router.put('/:applicant_id', updateApplicant);

module.exports = router;
