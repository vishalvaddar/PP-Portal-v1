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
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID missing from token",
      });
    }

    // Handle incoming data structure (Nested vs Flat)
    let { primaryData, secondaryData } = req.body;

    // If primaryData is missing, assume flat structure (legacy support)
    if (!primaryData) {
      primaryData = { ...req.body };
      // Remove secondaryData key if it exists inside flat body to avoid duplication
      if (primaryData.secondaryData) delete primaryData.secondaryData;
    }

    // Ensure secondaryData is initialized
    if (!secondaryData) secondaryData = {};

    // Required fields check (Validating primaryData)
    const requiredFields = [
      "nmms_year", "nmms_reg_number", "student_name", "father_name",
      "medium", "contact_no1", "district", "nmms_block",
      "gmat_score", "sat_score"
    ];

    const missing = requiredFields.filter((f) => !primaryData[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Validate numbers
    if (isNaN(primaryData.nmms_year))
      return res.status(400).json({ success: false, message: "nmms_year must be numeric" });

    if (primaryData.contact_no1 && !/^[0-9]{10}$/.test(primaryData.contact_no1))
      return res.status(400).json({ success: false, message: "contact_no1 must be a valid 10-digit number" });

    if (primaryData.contact_no2 && !/^[0-9]{10}$/.test(primaryData.contact_no2))
      return res.status(400).json({ success: false, message: "contact_no2 must be a valid 10-digit number" });

    // Sanitized Primary Data
    const sanitizedPrimary = {
      nmms_year: sanitizeValue(primaryData.nmms_year),
      nmms_reg_number: sanitizeValue(primaryData.nmms_reg_number),
      app_state: sanitizeValue(primaryData.app_state),
      district: sanitizeValue(primaryData.district),
      nmms_block: sanitizeValue(primaryData.nmms_block),
      student_name: sanitizeValue(primaryData.student_name),
      father_name: sanitizeValue(primaryData.father_name),
      mother_name: sanitizeValue(primaryData.mother_name),
      gmat_score: sanitizeValue(primaryData.gmat_score),
      sat_score: sanitizeValue(primaryData.sat_score),
      gender: sanitizeValue(primaryData.gender),
      medium: sanitizeValue(primaryData.medium),
      aadhaar: sanitizeValue(primaryData.aadhaar),
      dob: sanitizeDate(primaryData.dob),
      home_address: sanitizeValue(primaryData.home_address),
      family_income_total: sanitizeValue(primaryData.family_income_total),
      contact_no1: sanitizeValue(primaryData.contact_no1),
      contact_no2: sanitizeValue(primaryData.contact_no2),
      current_institute_dise_code: sanitizeValue(primaryData.current_institute_dise_code),
      previous_institute_dise_code: sanitizeValue(primaryData.previous_institute_dise_code),
      created_by: userId,
      updated_by: userId
    };

    // Prepare Secondary Data (Inject User ID)
    const sanitizedSecondary = { ...secondaryData };
    sanitizedSecondary.created_by = userId;
    sanitizedSecondary.updated_by = userId;

    // Call Model with Nested Structure
    const applicant = await applicantModel.createApplicant({
      primaryData: sanitizedPrimary,
      secondaryData: sanitizedSecondary
    });

    return res.status(201).json({
      success: true,
      message: "Applicant created successfully",
      data: applicant,
    });

  } catch (error) {
    console.error("Error creating applicant:", error);
    // Handle Duplicate Key Error (Postgres code 23505)
    if (error.code === '23505') {
       return res.status(400).json({ success: false, message: "Registration Number already exists." });
    }
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
    const userId = req.user?.user_id;

    if (!applicantId)
      return res.status(400).json({ success: false, message: "applicantId is required" });

    // Handle nested structure from Frontend
    let { primaryData, secondaryData } = req.body;

    // Inject updated_by user ID
    if (primaryData) primaryData.updated_by = userId;
    if (secondaryData) secondaryData.updated_by = userId;

    // Call model with nested structure
    const updated = await applicantModel.updateApplicant(applicantId, { 
      primaryData, 
      secondaryData 
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Applicant not found or update failed" });

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

    // Clean and validate numeric type
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