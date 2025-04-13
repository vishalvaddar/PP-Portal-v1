const express = require("express");
const { updateApplicant } = require("../controllers/applicantUpdateController");

const router = express.Router();

router.put("/:id", updateApplicant); //miracles happeing


module.exports = router;
