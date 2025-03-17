const express = require("express");
const router = express.Router();
const { updateApplicant } = require("../controllers/applicantUpdateController");

router.put("/:id", updateApplicant);

module.exports = router;
