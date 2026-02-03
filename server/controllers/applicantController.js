const applicantModel = require("../models/applicantModel");
const moment = require("moment");

// --- HELPERS ---

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
    M: "Male",
    F: "Female",
    O: "Other"
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

// ======================================================
// CONTROLLERS
// ======================================================

// CREATE
exports.createApplicant = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let { primaryData, secondaryData = {} } = req.body;

    if (!primaryData) {
      primaryData = { ...req.body };
      delete primaryData.secondaryData;
    }

    const requiredFields = [
      "nmms_year",
      "nmms_reg_number",
      "student_name",
      "father_name",
      "medium",
      "contact_no1",
      "district",
      "nmms_block"
    ];

    const missing = requiredFields.filter((f) => !primaryData[f]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missing.join(", ")}`
      });
    }

    if (!/^\d{10}$/.test(primaryData.contact_no1)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact_no1"
      });
    }

    const sanitizedPrimary = buildPrimaryData(primaryData, userId, false);
    const sanitizedSecondary = {
      ...secondaryData,
      created_by: userId,
      updated_by: userId
    };

    const applicant = await applicantModel.createApplicant({
      primaryData: sanitizedPrimary,
      secondaryData: sanitizedSecondary
    });

    res.status(201).json({
      success: true,
      message: "Applicant created successfully",
      data: formatResponse(applicant)
    });
  } catch (error) {
    console.error("Create Applicant Error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Registration Number already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create applicant",
      error: error.message
    });
  }
};

// UPDATE
exports.updateApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const userId = req.user?.user_id;

    if (!applicantId) {
      return res.status(400).json({ success: false, message: "applicantId required" });
    }

    const { primaryData, secondaryData } = req.body;

    const cleanPrimary = primaryData
      ? buildPrimaryData(primaryData, userId, true)
      : null;

    if (secondaryData) {
      secondaryData.updated_by = userId;
    }

    const updated = await applicantModel.updateApplicant(applicantId, {
      primaryData: cleanPrimary,
      secondaryData
    });

    res.json({
      success: true,
      message: "Applicant updated successfully",
      data: formatResponse(updated)
    });
  } catch (error) {
    console.error("Update Applicant Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update applicant",
      error: error.message
    });
  }
};

// GET BY ID
exports.getApplicantById = async (req, res) => {
  try {
    const { applicantId } = req.params;

    const result = await applicantModel.getApplicantById(applicantId);
    if (!result?.rows?.length) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    res.json({
      success: true,
      data: formatResponse(result.rows[0])
    });
  } catch (error) {
    console.error("Get Applicant Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
exports.deleteApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;

    const result = await applicantModel.deleteApplicant(applicantId);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    res.json({ success: true, message: "Applicant deleted successfully" });
  } catch (error) {
    console.error("Delete Applicant Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL
exports.getAllApplicants = async (req, res) => {
  try {
    const result = await applicantModel.getAllApplicants(req.query);
    const formatted = result.rows.map(formatResponse);

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Get All Applicants Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET BY REG NUMBER
exports.viewApplicantByRegNumber = async (req, res) => {
  try {
    const { nmms_reg_number } = req.params;

    const result = await applicantModel.viewApplicantByRegNumber(nmms_reg_number);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    res.json({
      success: true,
      data: formatResponse(result.rows[0])
    });
  } catch (error) {
    console.error("View Applicant Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// COUNTS
exports.applicantsCount = async (req, res) => {
  const { year } = req.query;
  const count = await applicantModel.getApplicantsCount(year);
  res.json({ success: true, count: Number(count) || 0 });
};

exports.shortlistedCount = async (req, res) => {
  const { year } = req.query;
  const count = await applicantModel.shortlistedApplicants(year);
  res.json({ success: true, count: Number(count) || 0 });
};

exports.selectedStudentsCount = async (req, res) => {
  const { year } = req.query;
  const count = await applicantModel.selectedStudents(year);
  res.json({ success: true, count: Number(count) || 0 });
};

exports.studentCohortCount = async (req, res) => {
  const { year } = req.query;
  const data = await applicantModel.getCohortStudentCount(year);

  res.json({
    success: true,
    data: {
      currentYear: Number(year),
      previousYear: Number(year) - 1,
      counts: data
    }
  });
};

exports.todayClassesCount = async (req, res) => {
  const { year } = req.query;
  const count = await applicantModel.getTodayClassesCount(Number(year));
  res.json({ success: true, count });
};
