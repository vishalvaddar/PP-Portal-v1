const express = require("express");
const router = express.Router();
const { viewApplicants } = require("../controllers/applicantViewController");

router.get("/", viewApplicants);

module.exports = router;
