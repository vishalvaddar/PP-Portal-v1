const express = require("express");
const router = express.Router();
const { deleteApplicant } = require("../controllers/applicantDeleteController");

router.delete("/:id", deleteApplicant);

module.exports = router;
