const applicantModel = require("../models/applicantModel");
const moment = require("moment");

const sanitizeValue = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value.trim();
  return value;
};

const sanitizeDate = (dateStr) => {
  if (!dateStr) return null;
  const dateObj = moment.utc(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
  return dateObj.isValid() ? dateObj.format("YYYY-MM-DD") : null;
};

const formatResponse = (data) => {
  if (!data) return null;
  
  const obj = { ...data };

  if (obj.dob) {
    obj.dob = moment(obj.dob).format("YYYY-MM-DD");
  }

  const genderMap = { 
    "M": "Male", 
    "F": "Female", 
    "O": "Other" 
  };
  
  if (obj.gender && genderMap[obj.gender]) {
    obj.gender = genderMap[obj.gender];
  }
  
  return obj;
};

const buildPrimaryData = (sourceData, userId, isUpdate = false) => {
  const data = {
    nmms_year: sanitizeValue(sourceData.nmms_year),
    nmms_reg_number: sanitizeValue(sourceData.nmms_reg_number),
    app_state: sanitizeValue(sourceData.app_state),
    district: sanitizeValue(sourceData.district),
    nmms_block: sanitizeValue(sourceData.nmms_block),
    student_name: sanitizeValue(sourceData.student_name),
    father_name: sanitizeValue(sourceData.father_name),
    mother_name: sanitizeValue(sourceData.mother_name),
    gmat_score: sanitizeValue(sourceData.gmat_score),
    sat_score: sanitizeValue(sourceData.sat_score),
    gender: sanitizeValue(sourceData.gender),
    medium: sanitizeValue(sourceData.medium),
    aadhaar: sanitizeValue(sourceData.aadhaar),
    dob: sanitizeDate(sourceData.dob),
    home_address: sanitizeValue(sourceData.home_address),
    family_income_total: sanitizeValue(sourceData.family_income_total),
    contact_no1: sanitizeValue(sourceData.contact_no1),
    contact_no2: sanitizeValue(sourceData.contact_no2),
    current_institute_dise_code: sanitizeValue(sourceData.current_institute_dise_code),
    previous_institute_dise_code: sanitizeValue(sourceData.previous_institute_dise_code),
    updated_by: userId
  };

  if (!isUpdate) {
    data.created_by = userId;
  }

  return data;
};


// CREATE Applicant
exports.createApplicant = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User ID missing" });
    }

    let { primaryData, secondaryData } = req.body;

    if (!primaryData) {
      primaryData = { ...req.body };
      if (primaryData.secondaryData) delete primaryData.secondaryData;
    }
    if (!secondaryData) secondaryData = {};

    const requiredFields = [
      "nmms_year", "nmms_reg_number", "student_name", 
      "father_name", "medium", "contact_no1", 
      "district", "nmms_block"
    ];

    const missing = requiredFields.filter((f) => !primaryData[f]);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    if (primaryData.contact_no1 && !/^\d{10}$/.test(primaryData.contact_no1))
      return res.status(400).json({ success: false, message: "Invalid contact_no1 (10 digits required)" });

    const sanitizedPrimary = buildPrimaryData(primaryData, userId, false);

    const sanitizedSecondary = { ...secondaryData };
    sanitizedSecondary.created_by = userId;
    sanitizedSecondary.updated_by = userId;

    const applicant = await applicantModel.createApplicant({
      primaryData: sanitizedPrimary,
      secondaryData: sanitizedSecondary
    });

    return res.status(201).json({
      success: true,
      message: "Applicant created successfully",
      data: formatResponse(applicant),
    });

  } catch (error) {
    console.error("Error creating applicant:", error);
    if (error.code === '23505') {
       return res.status(400).json({ success: false, message: "Registration Number already exists." });
    }
    return res.status(500).json({ success: false, message: "Failed to create applicant", error: error.message });
  }
};

// UPDATE Applicant
exports.updateApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const userId = req.user?.user_id;

    if (!applicantId)
      return res.status(400).json({ success: false, message: "applicantId is required" });

    let { primaryData, secondaryData } = req.body;

    let cleanPrimary = null;
    if (primaryData) {
      cleanPrimary = buildPrimaryData(primaryData, userId, true);
    }

    if (secondaryData) {
      secondaryData.updated_by = userId;
    }

    const updated = await applicantModel.updateApplicant(applicantId, { 
      primaryData: cleanPrimary, 
      secondaryData 
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Applicant not found or update failed" });

    res.status(200).json({
      success: true,
      message: "Applicant updated successfully",
      data: formatResponse(updated),
    });

  } catch (error) {
    console.error("Error updating applicant:", error);
    res.status(500).json({ success: false, message: "Failed to update applicant", error: error.message });
  }
};

// GET Applicant by ID
exports.getApplicantById = async (req, res) => {
  try {
    const { applicantId } = req.params;
    if (!applicantId) return res.status(400).json({ success: false, message: "applicantId is required" });

    const applicant = await applicantModel.getApplicantById(applicantId);

    if (!applicant) return res.status(404).json({ success: false, message: "Applicant not found" });

    res.status(200).json({ 
      success: true, 
      data: formatResponse(applicant)
    });

  } catch (error) {
    console.error("Error fetching applicant:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// DELETE Applicant
exports.deleteApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    if (!applicantId) return res.status(400).json({ success: false, message: "applicantId is required" });

    const deleted = await applicantModel.deleteApplicant(applicantId);
    if (!deleted) return res.status(404).json({ success: false, message: "Applicant not found" });

    res.status(200).json({ success: true, message: "Applicant deleted successfully" });

  } catch (error) {
    console.error("Error deleting applicant:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET All Applicants
exports.getAllApplicants = async (req, res) => {
  try {
    const applicants = await applicantModel.getAllApplicants(req.query);
    
    const formattedApplicants = applicants.map(app => formatResponse(app));

    res.status(200).json({ success: true, data: formattedApplicants });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET by Reg Number
exports.viewApplicantByRegNumber = async (req, res) => {
  try {
    let { nmms_reg_number } = req.params;

    if (!nmms_reg_number || nmms_reg_number.trim() === "") {
      return res.status(400).json({ success: false, message: "NMMS Registration Number is required" });
    }

    nmms_reg_number = nmms_reg_number.trim();

    if (!/^\d+$/.test(nmms_reg_number)) {
      return res.status(400).json({ success: false, message: "NMMS Reg Number must be numeric" });
    }

    const applicant = await applicantModel.viewApplicantByRegNumber(nmms_reg_number);

    if (!applicant) return res.status(404).json({ success: false, message: "Applicant not found" });

    return res.status(200).json({ 
      success: true, 
      data: formatResponse(applicant)
    });

  } catch (error) {
    console.error("Error fetching applicant by reg number:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};