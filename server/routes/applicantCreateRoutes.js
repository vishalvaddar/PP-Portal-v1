const express = require("express");
const router = express.Router();
const { createApplicant } = require("../controllers/applicantCreateController");

router.post("/", createApplicant);

module.exports = router;
