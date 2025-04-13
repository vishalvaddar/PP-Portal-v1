const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const xlsx = require("xlsx");
const pool = require("../config/db");
const moment = require("moment");

// Function to sanitize values before insertion
const sanitizeValue = (value, type = "text") => {
  if (value === undefined || value === null || value === "") {
    return type === "numeric" ? null : null; // Convert empty numeric fields to NULL
  }
  return value;
};

// Function to properly format DOB
const sanitizeDate = (dateStr) => {
  if (!dateStr) return null;
  return moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"], true).isValid()
    ? moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
    : null;
};

// Database insertion function
const insertApplicants = async (data) => {
  const query = `
    INSERT INTO pp.applicant_primary_info (
      nmms_year, nmms_reg_number, app_state, district, nmms_block, 
      student_name, father_name, gmat_score, sat_score, contact_no1, 
      contact_no2, current_institute_dise_code, previous_institute_dise_code, medium, 
      home_address, family_income_total, mother_name, gender, aadhaar, DOB
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )`;

  try {
    for (let row of data) {
      const values = [
        sanitizeValue(row.nmms_year, "numeric"),
        sanitizeValue(row.nmms_reg_number),
        sanitizeValue(row.app_state),
        sanitizeValue(row.district),
        sanitizeValue(row.nmms_block),
        sanitizeValue(row.student_name),
        sanitizeValue(row.father_name),
        sanitizeValue(row.gmat_score, "numeric"),
        sanitizeValue(row.sat_score, "numeric"),
        sanitizeValue(row.contact_no1),
        sanitizeValue(row.contact_no2),
        sanitizeValue(row.current_institute_dise_code, "numeric"),
        sanitizeValue(row.previous_institute_dise_code, "numeric"),
        sanitizeValue(row.medium),
        sanitizeValue(row.home_address),
        sanitizeValue(row.family_income_total, "numeric"),
        sanitizeValue(row.mother_name),
        sanitizeValue(row.gender),
        sanitizeValue(row.aadhaar),
        sanitizeDate(row.DOB)
      ];
      await pool.query(query, values);
    }
  } catch (error) {
    throw new Error("Database insertion failed: " + error.message);
  }
};

// Function to parse CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(
        Papa.parse(Papa.NODE_STREAM_INPUT, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => value.trim(),
        })
      )
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

// Function to parse Excel
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

// Main file upload function
const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let parsedData = [];

  try {
    if (fileExt === ".csv") {
      parsedData = await parseCSV(filePath);
    } else if (fileExt === ".xlsx" || fileExt === ".xls") {
      parsedData = parseExcel(filePath);
    } else {
      return res.status(400).json({ message: "Unsupported file format" });
    }

    // Sanitize and format data before inserting
    const cleanedData = parsedData.map((row) => ({
      nmms_year: sanitizeValue(row.nmms_year, "numeric"),
      nmms_reg_number: sanitizeValue(row.nmms_reg_number),
      app_state: sanitizeValue(row.app_state),
      district: sanitizeValue(row.district),
      nmms_block: sanitizeValue(row.nmms_block),
      student_name: sanitizeValue(row.student_name),
      father_name: sanitizeValue(row.father_name),
      gmat_score: sanitizeValue(row.gmat_score, "numeric"),
      sat_score: sanitizeValue(row.sat_score, "numeric"),
      contact_no1: sanitizeValue(row.contact_no1),
      contact_no2: sanitizeValue(row.contact_no2),
      current_institute_dise_code: sanitizeValue(row.current_institute_dise_code, "numeric"),
      previous_institute_dise_code: sanitizeValue(row.previous_institute_dise_code, "numeric"),
      medium: sanitizeValue(row.medium),
      home_address: sanitizeValue(row.home_address),
      family_income_total: sanitizeValue(row.family_income_total, "numeric"),
      mother_name: sanitizeValue(row.mother_name),
      gender: sanitizeValue(row.gender),
      aadhaar: sanitizeValue(row.aadhaar),
      DOB: sanitizeDate(row.DOB),
    }));

    await insertApplicants(cleanedData);
    res.json({ message: "File uploaded and data inserted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error processing file: " + error.message });
  } finally {
    fs.unlinkSync(filePath); // Delete the file after processing
  }
};

module.exports = { uploadFile };
