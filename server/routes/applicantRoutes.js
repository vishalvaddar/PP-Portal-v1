const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const applicantController = require("../controllers/applicantController");

// Create a new applicant (primary info only)
router.post("/create", authenticate, applicantController.createApplicant);

// Get all applicants
router.get("/", applicantController.getAllApplicants);

// View applicant by NMMS registration number (specific route first)
router.get("/reg/:nmms_reg_number", applicantController.viewApplicantByRegNumber);

// Get a specific applicant by ID
router.get("/:applicantId", applicantController.getApplicantById);

// Update applicant by ID
router.put("/:applicantId/update", authenticate, applicantController.updateApplicant);

// Delete applicant by ID
router.delete("/:applicantId", authenticate, applicantController.deleteApplicant);

module.exports = router;
