const express = require("express");
const router = express.Router();
const { createApplicant } = require("../controllers/applicantController");

router.post("/", createApplicant);

module.exports = router;
