const applicantModel = require("../models/applicantModel");
const moment = require("moment");

// Utility: sanitize values
const sanitizeValue = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const sanitizeDate = (dateStr) => {
  if (!dateStr) return null;
  return moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"], true).isValid()
    ? moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
    : null;
};

// CREATE Applicant
exports.createApplicant = async (req, res) => {
  try {
    const body = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID missing from token",
      });
    }

    // Required fields
    const requiredFields = [
      "nmms_year", "nmms_reg_number", "student_name", "father_name",
      "medium", "contact_no1", "district", "nmms_block",
      "gmat_score", "sat_score"
    ];

    const missing = requiredFields.filter((f) => !body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Validate numbers
    if (isNaN(body.nmms_year))
      return res.status(400).json({ success: false, message: "nmms_year must be numeric" });

    if (body.contact_no1 && !/^[0-9]{10}$/.test(body.contact_no1))
      return res.status(400).json({ success: false, message: "contact_no1 must be a valid 10-digit number" });

    if (body.contact_no2 && !/^[0-9]{10}$/.test(body.contact_no2))
      return res.status(400).json({ success: false, message: "contact_no2 must be a valid 10-digit number" });

    // Sanitized payload
    const applicantData = {
      nmms_year: sanitizeValue(body.nmms_year),
      nmms_reg_number: sanitizeValue(body.nmms_reg_number),
      app_state: sanitizeValue(body.app_state),
      district: sanitizeValue(body.district),
      nmms_block: sanitizeValue(body.nmms_block),
      student_name: sanitizeValue(body.student_name),
      father_name: sanitizeValue(body.father_name),
      mother_name: sanitizeValue(body.mother_name),
      gmat_score: sanitizeValue(body.gmat_score),
      sat_score: sanitizeValue(body.sat_score),
      gender: sanitizeValue(body.gender),
      medium: sanitizeValue(body.medium),
      aadhaar: sanitizeValue(body.aadhaar),
      dob: sanitizeDate(body.dob),
      home_address: sanitizeValue(body.home_address),
      family_income_total: sanitizeValue(body.family_income_total),
      contact_no1: sanitizeValue(body.contact_no1),
      contact_no2: sanitizeValue(body.contact_no2),
      current_institute_dise_code: sanitizeValue(body.current_institute_dise_code),
      previous_institute_dise_code: sanitizeValue(body.previous_institute_dise_code),
      created_by: userId,
      updated_by: userId
    };

    const applicant = await applicantModel.createApplicant(applicantData);

    return res.status(201).json({
      success: true,
      message: "Applicant created successfully",
      data: applicant,
    });

  } catch (error) {
    console.error("Error creating applicant:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create applicant",
      error: error.message,
    });
  }
};

// GET Applicant by ID
exports.getApplicantById = async (req, res) => {
  try {
    const { applicantId } = req.params;

    if (!applicantId)
      return res.status(400).json({ success: false, message: "applicantId is required" });

    const applicant = await applicantModel.getApplicantById(applicantId);

    if (!applicant)
      return res.status(404).json({ success: false, message: "Applicant not found" });

    res.status(200).json({
      success: true,
      message: "Applicant fetched successfully",
      data: applicant,
    });

  } catch (error) {
    console.error("Error fetching applicant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicant",
      error: error.message,
    });
  }
};

// UPDATE Applicant
exports.updateApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    if (!applicantId)
      return res.status(400).json({ success: false, message: "applicantId is required" });

    const updated = await applicantModel.updateApplicant(applicantId, req.body);

    if (!updated)
      return res.status(404).json({ success: false, message: "Applicant not found" });

    res.status(200).json({
      success: true,
      message: "Applicant updated successfully",
      data: updated,
    });

  } catch (error) {
    console.error("Error updating applicant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update applicant",
      error: error.message,
    });
  }
};

// DELETE Applicant
exports.deleteApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;

    if (!applicantId)
      return res.status(400).json({ success: false, message: "applicantId is required" });

    const deleted = await applicantModel.deleteApplicant(applicantId);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Applicant not found" });

    res.status(200).json({
      success: true,
      message: "Applicant deleted successfully",
      data: deleted,
    });

  } catch (error) {
    console.error("Error deleting applicant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete applicant",
      error: error.message,
    });
  }
};

// GET All Applicants
exports.getAllApplicants = async (req, res) => {
  try {
    const applicants = await applicantModel.getAllApplicants(req.query);
    res.status(200).json({
      success: true,
      message: "Applicants fetched successfully",
      data: applicants,
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants",
      error: error.message,
    });
  }
};

// GET Applicant by nmms_reg_number
exports.viewApplicantByRegNumber = async (req, res) => {
  try {
    let { nmms_reg_number } = req.params;

    // Validate input
    if (!nmms_reg_number || nmms_reg_number.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "NMMS Registration Number is required",
      });
    }

    // Clean and validate numeric type (since DB column is numeric)
    nmms_reg_number = nmms_reg_number.trim();

    if (!/^\d+$/.test(nmms_reg_number)) {
      return res.status(400).json({
        success: false,
        message: "NMMS Reg Number must be numeric only",
      });
    }

    // Query DB
    const applicant = await applicantModel.viewApplicantByRegNumber(
      nmms_reg_number
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Applicant fetched successfully",
      data: applicant,
    });
  } catch (error) {
    console.error("Error fetching applicant by reg number:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

